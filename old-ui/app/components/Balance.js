import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import {connect} from 'react-redux';

import BalanceItem from './BalanceItem';
import * as actions from "../../../ui/app/actions";
import {CircularProgress} from "material-ui";

const ethUtil = require('ethereumjs-util')

const util = require('../util')


class Balance extends Component {


  constructor(props) {
    super(props)
    this.state = {
      tokens: [],
      hideLoadingToken: true
    }
    var _this = this
  }

  getEthBalance = (hexvalue) => {
    var balance = util.parseBalance(hexvalue)
    return balance[0] + "." + balance[1].slice(0, 6)
  }
  calcUsdBalance = (hexValue) => {
    var balance = parseFloat(this.getEthBalance(hexValue))
    return balance * this.props.conversionRate
  }

  render() {
    var accounts = []
    if(this.props.accounts[this.props.state.metamask.selectedAddress] && this.props.accounts[this.props.state.metamask.selectedAddress].balance){
      accounts.push(this.props.accounts[this.props.state.metamask.selectedAddress])
    }
    var _this = this
    var tokens = [];


    this.props.state.metamask.tokens.forEach(function (val) {

      if (val.decimals && (typeof val.balance === 'string' || val.balance instanceof String)) {
        val.balance = val.balance / Math.pow(10, val.decimals)
      }
      if(val.owner===_this.props.state.metamask.selectedAddress) {
        if (val.address.toLowerCase() === util.SWISSToken.toLowerCase()) {
          tokens.unshift(val)
        }
        else {
          tokens.push(val)
        }
      }
    })

    /* for (var addr in this.props.accounts) {
       accounts.push(this.props.accounts[addr])
     }*/
    return (
      <div className="token-list">
        <ul data-simplebar>
          {accounts.map((row, index) => (
              <li>
                <BalanceItem tokenType="eth" name="ETH" image="./images/ether.png" isToken={false}
                             tokenCount={this.getEthBalance(row.balance)} balance={this.calcUsdBalance(row.balance)}
                             address={row.address}/>
              </li>
            )
          )}
          <div className="loading-list" hidden={this.state.hideLoadingToken}>
            <CircularProgress/>
          </div>
          {tokens.map((row, index) => (
              <li>
                <BalanceItem address={row.address} tokenType={row.type} name={row.symbol} image={row.icon} fullName={row.name}
                             tokenCount={row.balance} balance={row.usdbalance} isToken={true} decimals={row.decimals}/>
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
    accounts: state.metamask.accounts,
    conversionRate: state.metamask.conversionRate
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Balance)