const ObservableStore = require('obs-store')
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')
var request = require('request');
const EthQuery = require('ethjs-query')

class PreferencesController {

  /**
   *
   * @typedef {Object} PreferencesController
   * @param {object} opts Overrides the defaults for the initial state of this.store
   * @property {object} store The stored object containing a users preferences, stored in local storage
	 * @property {array} store.frequentRpcList A list of custom rpcs to provide the user
   * @property {string} store.currentAccountTab Indicates the selected tab in the ui
   * @property {array} store.tokens The tokens the user wants display in their token lists
   * @property {boolean} store.useBlockie The users preference for blockie identicons within the UI
   * @property {object} store.featureFlags A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature
   * @property {string} store.currentLocale The preferred language locale key
   * @property {string} store.selectedAddress A hex string that matches the currently selected address in the app
   *
   */
  constructor (opts = {}) {
    const initState = extend({
      frequentRpcList: [],
      currentAccountTab: 'history',
      useBlockie: false,
      featureFlags: {},
      tokenTransfer:[],
      currentLocale: opts.initLangCode,
      notification:false,
      theme:"classic"
    }, opts.initState)
    this.query = new EthQuery(opts.provider)
    if(opts.initState) {
      initState.tokens = opts.initState.tokens
    }
    if(!initState.tokens){
      initState.tokens=[]
    }

    this.externalDataController=opts.externalDataController
    this.store = new ObservableStore(initState)

    if(this.externalDataController) {
      this.externalDataController.setInitialTokens(initState.tokens)
    }
    this.initialDataFetch=false
  }
// PUBLIC METHODS
  checkIsInitedToken=()=>{
    return this.isInitedToken
  }

  fetchAllTokens=(address,fromBlock)=>{
    var _this=this
    this.isInitedToken=this.getTokens(address).length!==0
    return new Promise(function (resolve, reject) {
      if(address && !_this.initialDataFetch) {

        if(!_this.isInitedToken){
          _this.initialDataFetch=true
        }
        const fromBlock2 = !_this.isInitedToken ? 0 : fromBlock;
        _this.externalDataController.loadHistory(address,fromBlock2).then(function () {
          _this.externalDataController.fetchTokens(address,fromBlock2).then(function () {
            _this.isInitedToken = true;
            _this.initialDataFetch=false
            resolve()
          })
        })
      }
      else{
        resolve()
      }
    })
  }
  /**
   * Setter for the `useBlockie` property
   *
   * @param {boolean} val Whether or not the user prefers blockie indicators
   *
   */
  setUseBlockie (val) {
    this.store.updateState({ useBlockie: val })
  }

  /**
   * Getter for the `useBlockie` property
   *
   * @returns {boolean} this.store.useBlockie
   *
   */
  getUseBlockie () {
    return this.store.getState().useBlockie
  }

  /**
   * Setter for the `currentLocale` property
   *
   * @param {string} key he preferred language locale key
   *
   */
  setCurrentLocale (key) {
    this.store.updateState({ currentLocale: key })
  }

  /**
   * Setter for the `selectedAddress` property
   *
   * @param {string} _address A new hex address for an account
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  setSelectedAddress (_address,lastBlock) {
    const _this=this
    return new Promise((resolve, reject) => {
      const address = normalizeAddress(_address)
      _this.store.updateState({ selectedAddress: address })
        _this.fetchAllTokens(address,lastBlock).then(function () {
          if(_this.addressChangeHandler){
            _this.addressChangeHandler(address)
          }
          resolve()
        })
    })
  }

  onSetAddress(handler){
    this.addressChangeHandler=handler
  }
  /**
   * Getter for the `selectedAddress` property
   *
   * @returns {string} The hex address for the currently selected account
   *
   */
  getSelectedAddress () {
    return this.store.getState().selectedAddress
  }

  /**
   * Contains data about tokens users add to their account.
   * @typedef {Object} AddedToken
   * @property {string} address - The hex address for the token contract. Will be all lower cased and hex-prefixed.
   * @property {string} symbol - The symbol of the token, usually 3 or 4 capitalized letters
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#symbol}
   * @property {boolean} decimals - The number of decimals the token uses.
   *  {@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#decimals}
   */

  /**
   * Adds a new token to the token array, or updates the token if passed an address that already exists.
   * Modifies the existing tokens array from the store. All objects in the tokens array array AddedToken objects.
   * @see AddedToken {@link AddedToken} 
   *
   * @param {string} rawAddress Hex address of the token contract. May or may not be a checksum address.
   * @param {string} symbol The symbol of the token
   * @param {number} decimals  The number of decimals the token uses.
   * @returns {Promise<array>} Promises the new array of AddedToken objects.
   *
   */
  async addToken (owner,rawAddress, symbol, decimals,name) {
    const address = normalizeAddress(rawAddress)
    const newEntry = {owner, address, symbol, decimals ,name}

    var tokens = this.store.getState().tokens

    const previousEntry = tokens.find((token, index) => {
      return token.address === address && token.owner===owner
    })
    const previousIndex = tokens.indexOf(previousEntry)

    if (previousEntry) {
      tokens[previousIndex] = newEntry
    } else {
      tokens.push(newEntry)
    }

    this.store.updateState({ tokens })

    return Promise.resolve(tokens)
  }

  /**
   * Removes a specified token from the tokens array.
   *
   * @param {string} rawAddress Hex address of the token contract to remove.
   * @returns {Promise<array>} The new array of AddedToken objects
   *
   */
  removeToken (rawAddress) {
    const tokens = this.store.getState().tokens

    const updatedTokens = tokens.filter(token => token.address !== rawAddress)

    this.store.updateState({ tokens: updatedTokens })
    return Promise.resolve(updatedTokens)
  }

  /**
   * A getter for the `tokens` property
   *
   * @returns {array} The current array of AddedToken objects
   *
   */
  getTokens (address) {
    if(address){
      return this.store.getState().tokens.filter(token => token.owner === address)
    }


    else{
      return this.store.getState().tokens
    }

  }

  updateTokens(address,newTokens){
    var tokens=this.getTokens()
    tokens.forEach(function (t) {
      if(t.owner===address){
        newTokens.forEach(function (t2) {
          if(t2.address===t.address){
            t.balance=t2.balance
          }
        })
      }
    })
    this.store.updateState({tokens})
  }
  /**
   * Gets an updated rpc list from this.addToFrequentRpcList() and sets the `frequentRpcList` to this update list.
   *
   * @param {string} _url The the new rpc url to add to the updated list
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  updateFrequentRpcList (_url) {
    return this.addToFrequentRpcList(_url)
      .then((rpcList) => {
        this.store.updateState({ frequentRpcList: rpcList })
        return Promise.resolve()
      })
  }

  /**
   * Setter for the `currentAccountTab` property 
   *
   * @param {string} currentAccountTab Specifies the new tab to be marked as current
   * @returns {Promise<void>} Promise resolves with undefined
   *
   */
  setCurrentAccountTab (currentAccountTab) {
    return new Promise((resolve, reject) => {
      this.store.updateState({ currentAccountTab })
      resolve()
    })
  }

  /**
   * Returns an updated rpcList based on the passed url and the current list.
   * The returned list will have a max length of 2. If the _url currently exists it the list, it will be moved to the
   * end of the list. The current list is modified and returned as a promise.
   *
   * @param {string} _url The rpc url to add to the frequentRpcList.
   * @returns {Promise<array>} The updated frequentRpcList. 
   *
   */
  addToFrequentRpcList (_url) {
    const rpcList = this.getFrequentRpcList()
    const index = rpcList.findIndex((element) => { return element === _url })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    if (_url !== 'http://localhost:8545') {
      rpcList.push(_url)
    }
    if (rpcList.length > 2) {
      rpcList.shift()
    }
    return Promise.resolve(rpcList)
  }

  /**
   * Getter for the `frequentRpcList` property.
   *
   * @returns {array<string>} An array of one or two rpc urls.
   *
   */
  getFrequentRpcList () {
    return this.store.getState().frequentRpcList
  }

  /**
   * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
   *
   * @param {string} feature A key that corresponds to a UI feature.
   * @param {boolean} activated Indicates whether or not the UI feature should be displayed
   * @returns {Promise<object>} Promises a new object; the updated featureFlags object.
   *
   */
  setFeatureFlag (feature, activated) {
    const currentFeatureFlags = this.store.getState().featureFlags
    const updatedFeatureFlags = {
      ...currentFeatureFlags,
      [feature]: activated,
    }

    this.store.updateState({ featureFlags: updatedFeatureFlags })

    return Promise.resolve(updatedFeatureFlags)
  }

  setNotification=(val)=>{
    this.store.updateState({notification:val})
  }

  setTheme=(val)=>{
    this.store.updateState({theme:val})
  }
  /**
   * A getter for the `featureFlags` property
   *
   * @returns {object} A key-boolean map, where keys refer to features and booleans to whether the
   * user wishes to see that feature
   *
   */
  getFeatureFlags () {
    return this.store.getState().featureFlags
  }
  //
  // PRIVATE METHODS
  //
}

module.exports = PreferencesController
