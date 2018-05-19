const BN = require('ethjs').BN
const util = require('./util')
const zero = new BN(0)

class Token {

  constructor (opts = {}) {
    const { address, symbol, balance, decimals, contract, owner } = opts
    this.isLoading = !address || !symbol || !balance || !decimals
    this.address = address || '0x0'
    this.symbol  = symbol
    this.balance = new BN(balance || '0', 16)
    this.decimals = decimals ? new BN(decimals) : undefined
    this.owner = owner

    this.contract = contract
    this.update()
    .catch((reason) => {
      console.error('token updating failed', reason)
    })
  }

  async update() {
    const results = await Promise.all([
      this.symbol || this.updateSymbol(),
      this.updateBalance(),
      this.decimals || this.updateDecimals(),
    ])
    this.isLoading = false
    return results
  }

  serialize() {
    return {
      address: this.address,
      symbol: this.symbol,
      balance: this.balance.toString(10),
      decimals: this.decimals ? parseInt(this.decimals.toString()) : 0,
      string: this.stringify(),
    }
  }

  stringifyBalance (balance, bnDecimals) {
    if (balance.eq(zero)) {
      return '0'
    }

    const decimals = parseInt(bnDecimals.toString())
    if (decimals === 0) {
      return balance.toString()
    }

    let bal = balance.toString()
    let len = bal.length
    let decimalIndex = len - decimals
    let prefix = ''

    if (decimalIndex < 0) {
      while (prefix.length <= decimalIndex * -1) {
        prefix += '0'
        len++
      }
      bal = prefix + bal
      decimalIndex = 1
    }

    const result = `${bal.substr(0, len - decimals)}.${bal.substr(decimalIndex, 3)}`
    return result
  }

  stringify() {
    return this.stringifyBalance(this.balance, this.decimals || new BN(0))
  }

  async updateSymbol() {
    const symbol = await this.updateValue('symbol')
    this.symbol = symbol || 'TKN'
    return this.symbol
  }

  async updateBalance() {
    const balance = await this.updateValue('balance')
    this.balance = balance
    return this.balance
  }

  async updateDecimals() {
    if (this.decimals !== undefined) return this.decimals
    var decimals = await this.updateValue('decimals')
    if (decimals) {
      this.decimals = decimals
    }
    return this.decimals
  }

  async updateValue(key) {
    let methodName
    let args = []

    switch (key) {
      case 'balance':
        methodName = 'balanceOf'
        args = [ this.owner ]
        break
      default:
        methodName = key
    }

    let result
    try {
      result = await this.contract[methodName](...args)
    } catch (e) {
      console.warn(`failed to load ${key} for token at ${this.address}`)
      if (key === 'balance') {
        throw e
      }
    }

    if (result) {
      const val = result[0]
      this[key] = val
      return val
    }

    return this[key]
  }

}

module.exports = Token
