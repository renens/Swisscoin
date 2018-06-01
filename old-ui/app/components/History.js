import React, {PropTypes, Component} from 'react';

const ethUtil = require('ethereumjs-util')
const util = require('../util')

import HistoryItem from './HistoryItem';
import {connect} from "react-redux";

class History extends Component {

  constructor(props) {
    super(props)
  }

  getEthValue = (hexvalue) => {
    var balance = util.parseBalance(hexvalue)
    return parseFloat(balance[0] + "." + balance[1].slice(0, 6))
  }

  getInfo = (tx) => {
    const txParam = tx.txParams
    const date = new Date(tx.rawTx?tx.time:tx.time * 1000);
    var transactionId
    if (tx.hash) {
      var hashSize = tx.hash.length
      transactionId = tx.hash.slice(0, 8) + "..." + tx.hash.slice(hashSize - 4, hashSize)
    }
    var value = this.getEthValue(txParam.value)
    var usdValue, type, symbol, address
    if (tx.status === "failed") {
      type = "failed"
    }
    else if (tx.status === "submitted" || tx.status === "pending") {
      type = "pending"
    }
    else if (txParam.value !== "0" && txParam.value !== "0x0") {
      if (txParam.from === this.props.state.metamask.selectedAddress) {
        type = "out"
      }
      else {
        type = "in"
      }
      usdValue = (value * this.props.conversionRate).toFixed(2)
      symbol = "ETH"
    }
    if (tx.tokenInfo && tx.tokenInfo.length > 0) {
      const firstTokenInfo = tx.tokenInfo[0]
      var index = this.props.tokens.findIndex(token => firstTokenInfo.address === token.address)
      if (index !== -1) {
        symbol = this.props.tokens[index].symbol
      }
      if (firstTokenInfo.type && !type) {
        type = firstTokenInfo.type
      }
      value = firstTokenInfo.amount
      address = firstTokenInfo.address
      const exchangeRate = this.props.contractExchangeRates[address];
      if (exchangeRate && exchangeRate.rate) {
        usdValue = (value * exchangeRate.rate).toFixed(2)
      }
    }

    return {
      type: type,
      value: value,
      hash: transactionId,
      date: date,
      usdValue: usdValue,
      symbol: symbol,
      fullHash:tx.hash
    }
  }

  render() {
    return (
      <div className="token-list">
        <ul data-simplebar>
          {this.props.transactions.map((row, index) => (
              <li>
                <HistoryItem txInfo={this.getInfo(row)}/>
              </li>
            )
          )}
        </ul>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    transactions: state.metamask.selectedAddressTxList,
    tokens: state.metamask.tokens,
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(History)