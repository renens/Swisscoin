import * as htmlparser from "htmlparser";
import * as async from "async";

var request = require('request');
var coinmarketcap = require('coinmarketcap')
const ObservableStore = require('obs-store')
const {warn} = require('loglevel')
const Token = require('../lib/token')
const cheerio = require('cheerio');

// By default, poll every 3 minutes
const DEFAULT_INTERVAL = 180 * 1000

const BASEURL = "https://etherscan.io/"

/**
 * A controller that polls for token exchange
 * rates based on a user's current token list
 */
class TokenRatesController {
  /**
   * Creates a TokenRatesController
   *
   * @param {Object} [config] - Options to configure controller
   */
  constructor({interval = DEFAULT_INTERVAL, preferences} = {}) {
    this.store = new ObservableStore()
    this.preferences = preferences
    this.interval = interval
    this.requestQuee = []
    this.fetchetTokenRates = []
    this.requestLoading = false
    this.isLoading=false
    this.isActive=true
    // this.enableRequestHandler()
    this.tokens=preferences.getState().tokens
  }

  enableRequestHandler = () => {
    const _this = this
    fetch('https://api.coinmarketcap.com/v2/listings').then(function (response) {
      response.json().then(function (json) {
        _this.listings = json
        _this.requestHandler = setInterval(function () {
          if (!_this.requestLoading && _this.requestQuee.length > 0) {
            var f = _this.requestQuee.pop()
            f()
          }
        }, 1000)
      })
    })

  }

  /**
   * Updates exchange rates for all tokens
   */
  async updateExchangeRates() {
    if (!this.isActive) {
      return
    }
    this.isActive=true
    this.isLoading=true
    const contractExchangeRates = {}

    var requests = []
    requests.push(function () {
      _this.store.putState({contractExchangeRates})
      _this.isActive=false
      _this.isLoading=false
    })
    var _this = this
    var nextRequest = function () {
      var f = requests.pop()
      if (f) {
        f()
      }
    }
    for (const i in this._tokens) {
      const address = this._tokens[i].address
      const symbol = this._tokens[i].symbol
      const name = this._tokens[i].name
      if (symbol) {
        requests.push(function () {
          _this.getTokenInfo(address).then(function (data) {
            contractExchangeRates[address] = data
            nextRequest()
          }).catch(function (e) {
            nextRequest()
          })
        })
      }
    }
    nextRequest()
  }

  /**
   * Fetches a token exchange rate by address
   *
   * @param {String} address - Token contract address
   */
  async fetchExchangeRate(address, symbol) {
    /*try {
      const response = await fetch(`https://metamask.balanc3.net/prices?from=${address}&to=ETH&autoConversion=false&summaryOnly=true`)
      const json = await response.json()
      return json && json.length ? json[0].averagePrice : 0
    } catch (error) {
      var ticker=await coinmarketcap.tickerByAsset(symbol)
      console.log(ticker)
      warn(`MetaMask - TokenRatesController exchange rate fetch failed for ${address}.`, error)
      return 0
    }*/
    var token
    if (this.listings) {
      this.listings.data.forEach(function (t) {
        if (t.symbol.toLowerCase() === symbol) {
          token = t
        }
      })
    }
    if (token) {
      if (this.fetchetTokenRates[token.id]) {
        return this.fetchetTokenRates[token.id]
      }
      else {
        try {
          const response = await fetch(`https://api.coinmarketcap.com/v2/ticker/` + token.id)
          const json = await response.json()
          var tokenInfo = json && json.data ? {
            rate: json.data.quotes.USD.price,
            change: json.data.quotes.USD.percent_change_24h
          } : {rate: 0, change: 0}
          this.fetchetTokenRates[token.id] = tokenInfo
          return tokenInfo
        } catch (error) {
          warn(`MetaMask - TokenRatesController exchange rate fetch failed for ${address}.`, error)
          return {rate: 0, change: 0}
        }
      }
    }
    return {rate: 0, change: 0}
  }

  /**
   * @type {Number}
   */
  set interval(interval) {
    this._handle && clearInterval(this._handle)
    if (!interval) {
      return
    }
    this._handle = setInterval(() => {
      this.updateExchangeRates()
    }, interval)
  }

  /**
   * @type {Object}
   */
  set preferences(preferences) {
    this._preferences && this._preferences.unsubscribe()
    if (!preferences) {
      return
    }
    this._preferences = preferences
    this.tokens = preferences.getState().tokens
    /*preferences.subscribe(({tokens = []}) => {
      this.tokens = tokens
    })*/
  }

  /**
   * @type {Array}
   */
  set tokens(tokens) {
    this._tokens = tokens
    if(!this.isLoading && tokens && tokens.length>0) {
      this.isLoading=true
      this.updateExchangeRates()
    }
  }

  iconMatch = /<h1 class="pull-left">.*\n\s*<img\ssrc='(.*)'\sstyle/

  createTokenFrom(opts) {
    const owner = this.userAddress
    const {address, symbol, balance, decimals} = opts
    const contract = this.TokenContract.at(address)
    return new Token({address, symbol, balance, decimals, contract, owner})
  }

  getTokenBalance = (address) => {

  }

  updateToken(address, newToken) {
    var tokens = this._preferences.getState().tokens
    tokens.forEach(function (t) {
      if (t.owner === address) {
        if (newToken.address === t.address) {
          t.icon = newToken.icon
        }
      }
    })
    this._preferences.updateState({tokens})
  }

  usdPrice = /\$(\d*.\d*\s)/
  ethPrice = /@\s(\d*.\d*\s)Eth/
  changePattern = /\((.*)%/

  getTokenInfo = (address) => {
    const _this = this

    return new Promise(function (resolve, reject) {

      if (_this.fetchetTokenRates[address]) {
        resolve(_this.fetchetTokenRates[address])
        return
      }
      else {
        const selectedAddress = _this._preferences.getState().selectedAddress
        var allTokens = _this._preferences.getState().tokens.filter(t => t.owner === selectedAddress)
        if (!allTokens) {
          resolve({})
          return
        }
        var tokenIndex = allTokens.findIndex(t => t.address === address)
        if (tokenIndex === -1) {
          resolve({})
          return
        }
        let token = allTokens[tokenIndex];
        /*if (token.icon || token.icon === "") {
          resolve(token)
          return
        }*/

        request(BASEURL + "token/" + address, function (error, response, body) {
          if (error) {
            reject(error)
          }
          else {
            const b = cheerio.load(body)
            var tokenInfo = {}
            var fullIconElement = b("h1")
            if (fullIconElement && fullIconElement.length > 0) {
              fullIconElement[0].children.forEach(function (val) {
                if (val.name === "img") {
                  tokenInfo.icon = val.attribs.src
                }
              })
            }
            var priceElement = b("#ContentPlaceHolder1_tr_valuepertoken")
            if (priceElement && priceElement.length > 0) {
              priceElement[0].children.forEach(function (val0) {
                if (val0.name && val0.name === "td") {
                  val0.children.forEach(function (val1) {
                    if (val1.type === "text") {
                      var usd = val1.data.match(_this.usdPrice)
                      if (usd && usd.length > 1) {
                        tokenInfo.usdPrice = parseFloat(usd[1])
                      }
                      var eth = val1.data.match(_this.ethPrice)
                      if (eth && eth.length > 1) {
                        tokenInfo.ethPrice = parseFloat(eth[1])
                      }
                    }
                    else if (val1.name === "font") {
                      if (val1.children && val1.children.length > 0 && val1.children[0].type === "text") {
                        var change = val1.children[0].data.match(_this.changePattern)
                        if (change && change.length > 1) {
                          tokenInfo.change = parseFloat(change[1])
                        }
                      }
                    }
                  })
                }
              })
            }
            if (tokenInfo.icon) {
              token.icon = BASEURL + tokenInfo.icon
            }
            else {
              token.icon = ""
            }
            if(address.toLowerCase()==="0x3Ff663f89631d3948f85CE1365da09910EAa013f".toLowerCase()){
              token.icon=chrome.runtime.getURL("/images/swisscoin.png")
              tokenInfo.usdPrice=0.12
            }
            _this.updateToken(selectedAddress, token)
            _this.fetchetTokenRates[address] = {
              rate: tokenInfo.usdPrice,
              ethRate: tokenInfo.ethPrice,
              change: tokenInfo.change
            }
            resolve(_this.fetchetTokenRates[address])
          }
        })
      }
    })

  }
}

module.exports = TokenRatesController
