import {hexToBn} from "../../lib/util";

var request = require('request');
const extend = require('xtend')
const EventEmitter = require('events')
const ObservableStore = require('obs-store')
const ethUtil = require('ethereumjs-util')
const log = require('loglevel')
const txStateHistoryHelper = require('./lib/tx-state-history-helper')
const createId = require('../../lib/random-id')
const { getFinalStates } = require('./lib/util')
/**
  TransactionStateManager is responsible for the state of a transaction and
  storing the transaction
  it also has some convenience methods for finding subsets of transactions
  *
  *STATUS METHODS
  <br>statuses:
  <br>   - `'unapproved'` the user has not responded
  <br>   - `'rejected'` the user has responded no!
  <br>   - `'approved'` the user has approved the tx
  <br>   - `'signed'` the tx is signed
  <br>   - `'submitted'` the tx is sent to a server
  <br>   - `'confirmed'` the tx has been included in a block.
  <br>   - `'failed'` the tx failed for some reason, included on tx data.
  <br>   - `'dropped'` the tx nonce was already used
  @param opts {object}
  @param {object} [opts.initState={ transactions: [] }] initial transactions list with the key transaction {array}
  @param {number} [opts.txHistoryLimit] limit for how many finished
  transactions can hang around in state
  @param {function} opts.getNetwork return network number
  @class
*/
class TransactionStateManager extends EventEmitter {
  constructor({initState, txHistoryLimit, getNetwork, getTokens,isInited}) {
    super()

    this.store = new ObservableStore(
      extend({
        transactions: [],
      }, initState))
    this.txHistoryLimit = txHistoryLimit
    this.getNetwork = getNetwork
    this.getTokens = getTokens
    this.isInited=isInited
  }

  /**
    @param opts {object} - the object to use when overwriting defaults
    @returns {txMeta} the default txMeta object
  */
  generateTxMeta (opts,time=(new Date()).getTime(),status='unapproved') {
    return extend({
      id: createId(),
      time: time,
      status: status,
      metamaskNetworkId: this.getNetwork(),
      loadingDefaults: true,
    }, opts)
  }

  /**
    @returns {array} of txMetas that have been filtered for only the current network
  */
  getTxList () {
    const network = this.getNetwork()
    const fullTxList = this.getFullTxList()
    return fullTxList.filter((txMeta) => txMeta.metamaskNetworkId === network)
  }

  /**
    @returns {array} of all the txMetas in store
  */
  getFullTxList () {
    return this.store.getState().transactions
  }

  /**
    @returns {array} the tx list whos status is unapproved
  */
  getUnapprovedTxList () {
    const txList = this.getTxsByMetaData('status', 'unapproved')
    return txList.reduce((result, tx) => {
      result[tx.id] = tx
      return result
    }, {})
  }

  /**
    @param [address] {string} - hex prefixed address to sort the txMetas for [optional]
    @returns {array} the tx list whos status is submitted if no address is provide
    returns all txMetas who's status is submitted for the current network
  */
  getPendingTransactions (address) {
    const opts = { status: 'submitted' }
    if (address) opts.from = address
    return this.getFilteredTxList(opts)
  }

  /**
    @param [address] {string} - hex prefixed address to sort the txMetas for [optional]
    @returns {array} the tx list whos status is confirmed if no address is provide
    returns all txMetas who's status is confirmed for the current network
  */
  getConfirmedTransactions (address) {
    const opts = { status: 'confirmed' }
    if (address) opts.from = address
    return this.getFilteredTxList(opts)
  }

  /**
    Adds the txMeta to the list of transactions in the store.
    if the list is over txHistoryLimit it will remove a transaction that
    is in its final state
    it will allso add the key `history` to the txMeta with the snap shot of the original
    object
    @param txMeta {Object}
    @returns {object} the txMeta
  */
  addTx (txMeta) {
    this.once(`${txMeta.id}:signed`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:rejected`)
    })
    this.once(`${txMeta.id}:rejected`, function (txId) {
      this.removeAllListeners(`${txMeta.id}:signed`)
    })
    // initialize history
    txMeta.history = []
    // capture initial snapshot of txMeta for history
    const snapshot = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
    txMeta.history.push(snapshot)

    const transactions = this.getFullTxList()
    const txCount = transactions.length
    const txHistoryLimit = this.txHistoryLimit

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    /*if (txCount > txHistoryLimit - 1) {
      const index = transactions.findIndex((metaTx) => {
        return getFinalStates().includes(metaTx.status)
      })
      if (index !== -1) {
        transactions.splice(index, 1)
      }
      var oldTx = transactions.pop()
      console.log("remove old TX " + oldTx)
    }*/
    transactions.push(txMeta)
    this._saveTxList(transactions)
    return txMeta
  }
  /**
    @param txId {number}
    @returns {object} the txMeta who matches the given id if none found
    for the network returns undefined
  */
  getTx (txId) {
    const txMeta = this.getTxsByMetaData('id', txId)[0]
    return txMeta
  }

  updateTokenTransaction(hash, tokenInfo) {
    var transactions = this.getTxList()
    const index = transactions.findIndex(txData => txData.hash === hash)
    transactions[index].tokenInfo = []
    const info = {
      amount: parseFloat(tokenInfo.amount),
      type: "out",
      isToken: true,
      hash: hash,
      address: tokenInfo.address
    };
    transactions[index].tokenInfo.push(info)
    this._saveTxList(transactions)

  }

  /**
    updates the txMeta in the list and adds a history entry
    @param txMeta {Object} - the txMeta to update
    @param [note] {string} - a not about the update for history
  */
  updateTx (txMeta, note) {
    // validate txParams
    if (txMeta.txParams) {
      if (typeof txMeta.txParams.data === 'undefined') {
        delete txMeta.txParams.data
      }

      this.validateTxParams(txMeta.txParams)
    }

    // create txMeta snapshot for history
    const currentState = txStateHistoryHelper.snapshotFromTxMeta(txMeta)
    // recover previous tx state obj
    const previousState = txStateHistoryHelper.replayHistory(txMeta.history)
    // generate history entry and add to history
    const entry = txStateHistoryHelper.generateHistoryEntry(previousState, currentState, note)
    txMeta.history.push(entry)

    // commit txMeta to state
    const txId = txMeta.id
    const txList = this.getFullTxList()
    const index = txList.findIndex(txData => txData.id === txId)
    txList[index] = txMeta
    this._saveTxList(txList)
  }


  /**
    merges txParams obj onto txMeta.txParams
    use extend to ensure that all fields are filled
    @param txId {number} - the id of the txMeta
    @param txParams {object} - the updated txParams
  */
  updateTxParams (txId, txParams) {
    const txMeta = this.getTx(txId)
    txMeta.txParams = extend(txMeta.txParams, txParams)
    this.updateTx(txMeta, `txStateManager#updateTxParams`)
  }

  /**
    validates txParams members by type
    @param txParams {object} - txParams to validate
  */
  validateTxParams (txParams) {
    Object.keys(txParams).forEach((key) => {
      const value = txParams[key]
      // validate types
      switch (key) {
        case 'chainId':
          if (typeof value !== 'number' && typeof value !== 'string') throw new Error(`${key} in txParams is not a Number or hex string. got: (${value})`)
          break
        default:
          if (typeof value !== 'string') throw new Error(`${key} in txParams is not a string. got: (${value})`)
          if (!ethUtil.isHexPrefixed(value)) throw new Error(`${key} in txParams is not hex prefixed. got: (${value})`)
          break
      }
    })
  }

/**
  @param opts {object} -  an object of fields to search for eg:<br>
  let <code>thingsToLookFor = {<br>
    to: '0x0..',<br>
    from: '0x0..',<br>
    status: 'signed',<br>
    err: undefined,<br>
  }<br></code>
  @param [initialList=this.getTxList()]
  @returns a {array} of txMeta with all
  options matching
  */
  /*
  ****************HINT****************
  | `err: undefined` is like looking |
  | for a tx with no err             |
  | so you can also search txs that  |
  | dont have something as well by   |
  | setting the value as undefined   |
  ************************************

  this is for things like filtering a the tx list
  for only tx's from 1 account
  or for filltering for all txs from one account
  and that have been 'confirmed'
  */
  getFilteredTxList (opts, initialList) {
    let filteredTxList = initialList
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList)
    })
    return filteredTxList
  }
  /**

    @param key {string} - the key to check
    @param value - the value your looking for
    @param [txList=this.getTxList()] {array} - the list to search. default is the txList
    from txStateManager#getTxList
    @returns {array} a list of txMetas who matches the search params
  */
  getTxsByMetaData (key, value, txList = this.getTxList()) {
    return txList.filter((txMeta) => {
      if (txMeta.txParams[key]) {
        return txMeta.txParams[key] === value
      } else {
        return txMeta[key] === value
      }
    })
  }

  // get::set status

  /**
    @param txId {number} - the txMeta Id
    @return {string} the status of the tx.
  */
  getTxStatus (txId) {
    const txMeta = this.getTx(txId)
    return txMeta.status
  }

  /**
    should update the status of the tx to 'rejected'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusRejected (txId) {
    this._setTxStatus(txId, 'rejected')
  }

  /**
    should update the status of the tx to 'unapproved'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusUnapproved (txId) {
    this._setTxStatus(txId, 'unapproved')
  }
  /**
    should update the status of the tx to 'approved'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusApproved (txId) {
    this._setTxStatus(txId, 'approved')
  }

  /**
    should update the status of the tx to 'signed'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusSigned (txId) {
    this._setTxStatus(txId, 'signed')
  }

  /**
    should update the status of the tx to 'submitted'.
    and add a time stamp for when it was called
    @param txId {number} - the txMeta Id
  */
  setTxStatusSubmitted (txId) {
    const txMeta = this.getTx(txId)
    txMeta.submittedTime = (new Date()).getTime()
    this.updateTx(txMeta, 'txStateManager - add submitted time stamp')
    this._setTxStatus(txId, 'submitted')
  }

  /**
    should update the status of the tx to 'confirmed'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusConfirmed (txId) {
    this._setTxStatus(txId, 'confirmed')
  }

  /**
    should update the status of the tx to 'dropped'.
    @param txId {number} - the txMeta Id
  */
  setTxStatusDropped (txId) {
    this._setTxStatus(txId, 'dropped')
  }


  /**
    should update the status of the tx to 'failed'.
    and put the error on the txMeta
    @param txId {number} - the txMeta Id
    @param err {erroObject} - error object
  */
  setTxStatusFailed (txId, err) {
    const txMeta = this.getTx(txId)
    txMeta.err = {
      message: err.toString(),
      stack: err.stack,
    }
    this.updateTx(txMeta)
    this._setTxStatus(txId, 'failed')
  }

  /**
    Removes transaction from the given address for the current network
    from the txList
    @param address {string} - hex string of the from address on the txParams to remove
  */
  wipeTransactions (address) {
    // network only tx
    const txs = this.getFullTxList()
    const network = this.getNetwork()

    // Filter out the ones from the current account and network
    const otherAccountTxs = txs.filter((txMeta) => !(txMeta.txParams.from === address && txMeta.metamaskNetworkId === network))

    // Update state
    this._saveTxList(otherAccountTxs)
  }

  wipeBadTransactions (address) {
    // network only tx
    const txs = this.getFullTxList()
    const network = this.getNetwork()

    // Filter out the ones from the current account and network
    const otherAccountTxs = txs.filter((txMeta) => !(txMeta.txParams.from === address && txMeta.metamaskNetworkId === network && !txMeta.hash))

    // Update state
    this._saveTxList(otherAccountTxs)
  }

  showNotification(data) {
    if(!this.isInited()){
      return;
    }
    var msg
    if(data.msg){
      msg=data.msg
    }
    else {
      var type = data.type === "in" ? "Incoming" : "Outcoming"
      var symbol = "ETH"
      var value;
      if (data.value !== "0") {
        value = data.value
      }
      if (data.isToken) {
        var tokens = this.getTokens()
        const index = tokens.findIndex(t => t.address === data.address)
        if (index !== -1) {
          symbol = tokens[index].symbol
        }
        value = data.amount
      }

      msg = type + " transaction."
      if (value) {
        msg += value + " " + symbol
      }
    }
    var iconUrl=chrome.runtime.getURL("/images/icon-128.png");
    // Now create the notification
    chrome.notifications.create("", {
      type: 'basic',
      iconUrl: iconUrl,
      title: 'New transaction',
      message: msg
    }, function(notificationId) {});
  }

  updateTransactionFromHistory(txList, address, showNotify) {
    if (address) {
      this.wipeTransactions(address)
      return;
    }
    var transactions = this.getTxList()
    const _this = this
    var toHex = function (val) {
      return new ethUtil.BN(val).toString("hex")
    }
    txList.forEach(function (t, i) {
      _this.addTransaction(address,t,showNotify)
    })
  }

  addTransaction=(address,t,showNotify)=>{
    var transactions = this.getTxList()
    const _this = this
    var toHex = function (val) {
      return new ethUtil.BN(val).toString("hex")
    }
    var hash = t.hash
    const index = transactions.findIndex(txData => txData.hash === hash)
    if (index === -1) {
      var status = t.txreceipt_status === "1" ? "confirmed" : "failed"
      var newTx = _this.generateTxMeta({}, parseInt(t.timeStamp), status)
      newTx.hash = hash
      newTx.txParams = {
        from: t.from,
        gas: toHex(t.gasUsed),
        gasPrice: toHex(t.gasPrice),
        nonce: toHex(t.nonce),
        to: t.to,
        value: toHex(t.value)
      }
      var value = 0

      if (newTx.txParams.value !== "0") {
        var tvalue = new ethUtil.BN(newTx.txParams.value)
        value = parseFloat(tvalue.toString()) / Math.pow(10, 18)
      }
      if (showNotify && newTx.txParams.value !== "0") {
        _this.showNotification({
          type: newTx.txParams.to === address ? "in" : "out",
          isToken: false,
          hash: newTx.hash,
          value: value
        })
      }
      _this.addTx(newTx)
    }
  }

  addTokenTransferInfo = (address, tokenEvent,showNotify) => {
    var transactions = this.getTxList()
    const index = transactions.findIndex(txData => txData.hash === tokenEvent.hash)
    const selectedAddress = hexToBn(address).toString("hex")
    var amount = parseFloat(tokenEvent.value) / Math.pow(10, parseInt(tokenEvent.tokenDecimal))
    var type = tokenEvent.from.toString("hex") === address ? "out" : "in"
    const tokenInfo = {
      amount: parseFloat(amount),
      type: type,
      isToken: true,
      hash: tokenEvent.hash,
      address: tokenEvent.contractAddress
    };
    var _notify=false;
    if(index===-1 || (transactions[index].txParams.value &&
        transactions[index].txParams.value!=="0" && !transactions[index].tokenInfo)) {
      var tx = this.generateTxMeta({}, parseInt(tokenEvent.timeStamp), 'confirmed')
      tx.txParams = []
      tx.tokenInfo = []
      tx.tokenInfo.push(tokenInfo)
      tx.hash = tokenEvent.hash
      tx.txParams = {
        from: tokenEvent.from,
        to: tokenEvent.to
      }
      tx.metamaskNetworkId="1"
      transactions.push(tx)
      _notify=true
   }
   else if(index!==-1 && !transactions[index].tokenInfo){
        transactions[index].tokenInfo=[]
        transactions[index].tokenInfo.push(tokenInfo)
      _notify=true
    }
    if (showNotify && _notify) {
      this.showNotification(tokenInfo)
    }
    this._saveTxList(transactions)
  }

  loadingTokenTransferInfo = (tokenTransfer, address) => {

    var transactions = this.getTxList()
    const selectedAddress = hexToBn(address).toString("hex")
    var requests = []
    var runNext = function () {
      var f = requests.pop();
      if (f) {
        f()
      }
    }
    const _this = this
    requests.push(function () {
      _this._saveTxList(transactions)
    })
    tokenTransfer.forEach(function (e) {
      var hash = e.hash
      const index = transactions.findIndex(txData => txData.hash === hash)
      if (index !== -1 && !transactions[index].tokenInfo) {
        const block = e.blockNumber
        transactions[index].tokenInfo = []
        const decimals = new ethUtil.BN(Math.pow(10, e.tokenDecimal) + "")
        requests.push(function () {
          const s = 'http://api.etherscan.io/api?module=logs&action=getLogs&address=' + e.contractAddress + '&fromBlock=' + block + '&toBlock=' + block + '&topic0=0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef&apikey=T3AM72P1VK8ZX59N42P41TB93DXXCT23SH';
          request(s, function (error, response, body) {
            if (body) {
              var resultBody = JSON.parse(body).result;
              resultBody.forEach(function (event) {
                var amount = hexToBn(event.data).div(decimals).toString()
                var from = hexToBn(event.topics[1])
                var to = hexToBn(event.topics[2])
                var type
                if (to.toString("hex") === selectedAddress) {
                  type = "in"
                } else if (from.toString("hex") === selectedAddress) {
                  type = "out"
                }
                if (type) {
                  if (!transactions[index].tokenInfo) {
                    transactions[index].tokenInfo = []
                  }
                  const tokenInfo = {
                    amount: parseFloat(amount),
                    type: type,
                    isToken: true,
                    hash: hash,
                    address: e.contractAddress
                  };
                  _this.showNotification(tokenInfo)
                  transactions[index].tokenInfo.push(tokenInfo)
                }
              })
            }
            runNext()
          })
        })
      }
    })
    runNext()
  }
//
//           PRIVATE METHODS
//

  // STATUS METHODS
  // statuses:
  //    - `'unapproved'` the user has not responded
  //    - `'rejected'` the user has responded no!
  //    - `'approved'` the user has approved the tx
  //    - `'signed'` the tx is signed
  //    - `'submitted'` the tx is sent to a server
  //    - `'confirmed'` the tx has been included in a block.
  //    - `'failed'` the tx failed for some reason, included on tx data.
  //    - `'dropped'` the tx nonce was already used

  /**
    @param txId {number} - the txMeta Id
    @param status {string} - the status to set on the txMeta
    @emits tx:status-update - passes txId and status
    @emits ${txMeta.id}:finished - if it is a finished state. Passes the txMeta
    @emits update:badge
  */
  _setTxStatus (txId, status) {
    const txMeta = this.getTx(txId)
    txMeta.status = status
    setTimeout(() => {
      try {
        this.updateTx(txMeta, `txStateManager: setting status to ${status}`)
        this.emit(`${txMeta.id}:${status}`, txId)
        this.emit(`tx:status-update`, txId, status)
        if (['submitted', 'rejected', 'failed'].includes(status)) {
          this.emit(`${txMeta.id}:finished`, txMeta)
        }
        this.emit('update:badge')
      } catch (error) {
        log.error(error)
      }
    })
  }

  /**
    Saves the new/updated txList.
    @param transactions {array} - the list of transactions to save
  */
  // Function is intended only for internal use
  _saveTxList(transactions) {
    transactions = transactions.sort(function (a, b) {
      return b.time - a.time
    })
    if(transactions.length>this.txHistoryLimit){
      transactions=transactions.splice(0,this.txHistoryLimit)
    }
    this.store.updateState({transactions})
  }
}

module.exports = TransactionStateManager
