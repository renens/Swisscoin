import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import TextField from 'material-ui/TextField';

const txHelper = require('../../lib/tx-helper')

import {connect} from "react-redux";
import * as actions from "../../../ui/app/actions";
import {Divider, RaisedButton} from "material-ui";

const util = require('../util')
const ethUtil = require('ethereumjs-util')

const styles={
  slowButton:{
    backgroundColor:"#ffff9d",
    height: "30px",
    lineHeight:"30px"
  },
  normalButton:{
    backgroundColor:"#FFFF00",
    height: "30px",
    lineHeight:"30px"
  },
  fastButton:{
    backgroundColor:"#fbb03f",
    height: "30px",
    lineHeight:"30px"
  }
}
class ConfirmTransaction extends Component {

  static propTypes = {};

  constructor(props, context) {
    super(props);
    this.state = {
      sliderValue: 10,
      gasPrices: {},
      gasPrice: 0,
    };
    var _this = this

    if (!this.props.tx.gasPriceSpecified) {
      this.props.dispatch(actions.getGasPrice()).then(function (result) {
        _this.setState({
          gasPrices: result,
          gasPrice: result.normal
        })
      })
    }
  }

  getGasPrice = () => {
    const tx = this.props.tx;
    return tx.gasPriceSpecified ? tx.txParams.gasPrice : this.state.gasPrice
  }

  cancel = () => {
    this.props.dispatch(actions.goHome())
  }

  getValueToSend = (tx) => {
    if (!tx) {
      return
    }
    else if (tx.txParams && tx.txParams.value !== "0x0") {
      var value = util.numericBalance(tx.txParams.value).toString()
      value = parseFloat(value) / Math.pow(10, 18)
      value=new Intl.NumberFormat("en-EU",{minimumFractionDigits:8}).format(value);// num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1'")
      return <h4 className="confTx-amount">{value}<span style={{margin:"5px"}}>ETH</span></h4>
    }
  }

  render() {

    var firstTx = this.props.tx
    this.currentTx = firstTx
    const toLength = firstTx.txParams.to.length
    var to = firstTx.txParams.to
    if(this.props.tokenState && this.props.tokenState.to){
      to=this.props.tokenState.to
    }
    to=to.slice(0, 8) + "..." + to.slice(toLength - 8)
    var _this = this
    if (firstTx.txParams.gasPrice) {
      this.props.setGasPrice(util.numericBalance(firstTx.txParams.gasPrice))
    }
    var getCurrencySymbol = () => {
      return this.props.currencySymbol ? this.props.currencySymbol : "$"
    }
    var getFee = function () {
      var gasPrice = firstTx.gasPriceSpecified ? firstTx.txParams.gasPrice : _this.state.gasPrice * Math.pow(10, 9)
      if (gasPrice && firstTx.txParams.gas) {
        var _gasPrice = util.numericBalance(gasPrice)
        var estGas = util.numericBalance(firstTx.txParams.gas)
        var toEth = Math.pow(10, 18)
        return parseFloat(_gasPrice.mul(estGas).toString()) / toEth;
      }
      else {
        return 0
      }
    }
    var getUsdFee = function () {
      return (getFee() * _this.props.conversionRate).toFixed(2)
    }
    return (
      <div className="confTx-container">
        {this.getValueToSend(firstTx)}
        <div className="receipt-info">
          <div style={{width: "30px"}}>To</div>
          <div>{to}<br/>
          </div>
        </div>
        <div hidden={firstTx.gasPriceSpecified}>
          <div className="send-btn-container">
            <RaisedButton  buttonStyle={styles.slowButton} label="slow" onClick={() => {
              this.setState({gasPrice: this.state.gasPrices.slow})
            }}/>
            <RaisedButton buttonStyle={styles.normalButton} label="normal" onClick={() => {
              this.setState({gasPrice: this.state.gasPrices.normal})
            }}/>
            <RaisedButton buttonStyle={styles.fastButton} label="fast" onClick={() => {
              this.setState({gasPrice: this.state.gasPrices.fast})
            }}/>
          </div>
          <div className="tx-speed-container">
            <div className="transaction-info">
              Gas price {this.state.gasPrice} Gwei
            </div>
          </div>
        </div>
        <div className="receipt-info receipt-fee-info">
          <div>Gas Fee</div>
          <div>{getUsdFee()} {getCurrencySymbol()}<br/>
            <span>{getFee()} ETH</span>
          </div>
        </div>

      </div>
    );
  }

}

function mapStateToProps(state) {
  return {
    state: state,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedPersonalMsgs: state.metamask.unapprovedPersonalMsgs,
    unapprovedTypedMessages: state.metamask.unapprovedTypedMessages,
    blockGasLimit: state.metamask.currentBlockGasLimit,
    currentView: state.appState.currentView,
    conversionRate: state.metamask.conversionRate,
    currencySymbol: state.metamask.currencySymbol,
    tokenState:state.appState.sendingTokenInfo,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTransaction)