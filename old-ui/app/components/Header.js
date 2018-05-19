import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import {connect} from 'react-redux';

const util = require('../util')

class Header extends Component {


  constructor(props) {
    super(props)
    this.state = {
      ethBalance: 0.0,
      usdBalance: 0.0
    }
  }

  getEthBalance = (hexvalue) => {
    var balance = util.parseBalance(hexvalue)
    return parseFloat(balance[0] + "." + balance[1].slice(0, 6))
  }

  render() {
    const {type} = this.props;
    var totalEth = 0.0
    var usdBalance = 0.0
    const _this = this

    if (this.props.accounts[this.props.selectedAddress] &&
      this.props.accounts[this.props.selectedAddress].balance) {
      var balance = this.getEthBalance(this.props.accounts[this.props.selectedAddress].balance)
      totalEth += balance
    }
    if (this.props.tokens) {
      _this.props.tokens.forEach(function (token) {
        if (_this.props.contractExchangeRates[token.address] &&
          _this.props.contractExchangeRates[token.address].ethRate
        && token.owner===_this.props.selectedAddress) {
          var balance = token.balance
          if (token.decimals && (typeof token.balance === 'string' || token.balance instanceof String)) {
            token.balance = token.balance / Math.pow(10, token.decimals)
          }
          var ethBalance = _this.props.contractExchangeRates[token.address].ethRate * token.balance
          totalEth += ethBalance
        }
      })
    }
    usdBalance = totalEth * _this.props.ethConversionRate

    return (
      <div>
        <div className="wave -one"/>
        <div className="wave -two"/>
        <div className="wave -three"/>
        <div className="imagery-container">
          <img width={"100px"} className="nav-icon" src="./images/eql-white-2.png" role="presentation"/>
          <i className="fas fa-ellipsis-v"/>
        </div>
        <div className="balance-section">
          <span>Total Balance</span>
          <div className="balance">${usdBalance.toFixed(2)}</div>
          <div className="balance balance-eth">
            {totalEth.toFixed(6)} ETH
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    tokens: state.metamask.tokens,
    selectedAddress: state.metamask.selectedAddress,
    contractExchangeRates: state.metamask.contractExchangeRates,
    accounts: state.metamask.accounts,
    ethConversionRate: state.metamask.conversionRate
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header)