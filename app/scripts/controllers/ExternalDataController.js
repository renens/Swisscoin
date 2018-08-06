const request = require('request');
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')
const ObservableStore = require('obs-store')
const EventEmitter = require('events')

class ExternalDataController extends EventEmitter{

  constructor(opts = {}) {
    super()
    this.tokens= []
    this.tokenTransferEvent=[]
  }

  setInitialTokens = (tokens) => {
    this.tokens=tokens
  }

  setSelectedAddress=(address)=>{
    this.address=address
  }

  loadHistory=(address,fromBlock,limit)=>{
    var _this=this
    return new Promise(function (resolve, reject) {
      request('http://api.etherscan.io/api?module=account&action=txlist&address=' + address + '&startblock='+fromBlock+'&endblock=latest&sort=desc&apikey=T3AM72P1VK8ZX59N42P41TB93DXXCT23SH', function (error, response, body) {
        if(error){
          reject()
        }
        else {
          var resultBody = JSON.parse(body).result;
          resultBody.forEach(function (tx) {
            _this.emit("transactionFromHistory",address,tx,fromBlock!==0)
          })
          resolve();
        }
      })
    })
  }

  fetchTokens = (address, fromBlock) => {
    const _this = this
    return new Promise(function (resolve, reject) {
      const storeTokens = _this.getTokens(address)
      request('http://api.etherscan.io/api?module=account&action=tokentx&address=' + address + '&startblock=' + fromBlock + '&endblock=latest&sort=asc&apikey=T3AM72P1VK8ZX59N42P41TB93DXXCT23SH', function (error, response, body) {
        if (error) {
          reject(error)
        }
        else {
          var resultBody = JSON.parse(body).result;
          var tokens = [];
          var addresses = [];
          resultBody.forEach(function (val) {
            //if(fromBlock!==0){
              var eventIndex=_this.tokenTransferEvent.findIndex(e=>
                e.hash===val.hash && e.from===val.to && e.from===val.to && e.contractAddress===val.contractAddress
              )
            if(eventIndex===-1) {
              _this.tokenTransferEvent.push(val)
              _this.emit("newTokenTransaction", address, val, fromBlock !== 0)
            }
            //}
            const contractAddress = val.contractAddress
            const tokenIndex = storeTokens ? storeTokens.findIndex(t => t.address === contractAddress) : -1
            if (!addresses.includes(contractAddress) && tokenIndex === -1) {
              tokens.push(val)
              addresses.push(contractAddress)
            }
          })
          tokens.forEach(function (val) {
            _this.addToken(address, val.contractAddress, val.tokenSymbol, val.tokenDecimal, val.tokenName)
          })
          if(tokens.length>0){
            _this.emit("newToken",function () {
              resolve()
            });
          }
          else{
            resolve()
          }

        }
      });
    })
  }

  addToken(owner, rawAddress, symbol, decimals, name) {
    const address = normalizeAddress(rawAddress)
    const newEntry = {owner, address, symbol, decimals, name}

    const previousEntry = this.tokens.find((token, index) => {
      return token.address === address && token.owner === owner
    })
    const previousIndex = this.tokens.indexOf(previousEntry)

    if (previousEntry) {
      this.tokens[previousIndex] = newEntry
    } else {
      this.tokens.push(newEntry)
    }


    return newEntry
  }

  getTokens(address) {
    if (address) {
      return this.tokens.filter(token => token.owner === address)
    }
    else {
      return this.tokens
    }

  }
}

module.exports = ExternalDataController
