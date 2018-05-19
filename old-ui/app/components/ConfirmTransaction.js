import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import TextField from 'material-ui/TextField';
const txHelper = require('../../lib/tx-helper')

import {connect} from "react-redux";
import * as actions from "../../../ui/app/actions";
import {Divider} from "material-ui";
const util = require('../util')
const ethUtil = require('ethereumjs-util')

class ConfirmTransaction extends Component {

  static propTypes = {};

  constructor(props, context) {
    super(props);
    this.state = {
      sliderValue: 10
    };
    var _this=this

    this.props.dispatch(actions.getGasPrice()).then(function (result) {
      var gasPrice = util.numericBalance(result)
      gasPrice=gasPrice.div(util.bnTable.gwei)
      _this.setState({sliderValue: gasPrice.toNumber()})

    })
  }

  handleChange(evt) {
    this.setState({
      sliderValue: evt.target.value
    });
  }

  cancel=()=>{
    this.props.dispatch(actions.goHome())
  }

  getValueToSend=(tx)=>{
    if(!tx){
      return
    }
    else if(tx.txParams && tx.txParams.value!=="0x0"){
      var value=util.numericBalance(tx.txParams.value).toNumber()
      value=value/Math.pow(10,18)
      return <h4 className="confTx-amount">{value}<span>ETH</span></h4>
    }
  }

  getFee = (_gasPrice,_estimateGas) => {
    if(_gasPrice && _estimateGas) {
      var gasPrice = util.numericBalance(_gasPrice)
      var estGas = util.numericBalance(_estimateGas)
      const estGasEth = gasPrice.mul(estGas).toNumber() / Math.pow(10, 9);
      return estGasEth
    }
    else {
      return 0
    }
  }
  render() {

    var firstTx=this.props.tx
    this.currentTx=firstTx
    const toLength=firstTx.txParams.to.length
    var to=firstTx.txParams.to.slice(0,8)+"..."+firstTx.txParams.to.slice(toLength-8)

    const ethFee=this.getFee(firstTx.txParams.gasPrice,firstTx.estimatedGas)
    const usdFee=(ethFee*this.props.ethConversionRate).toFixed(2)
    return (
      <div className="confTx-container">
        {this.getValueToSend(firstTx)}
        <div className="receipt-info">
          <div style={{width:"30px"}}>To</div>
          <div>{to}<br/>
          </div>
        </div>
        <div className="tx-speed-container" hidden={firstTx.gasPriceSpecified}>
          <div className="speed-title">Transaction Speed</div>
          <input className="mdl-slider mdl-js-slider" type="range" value={this.state.sliderValue}
                 onChange={event => this.handleChange(event)} min="1" max="50" tabIndex="0"/>
          <div className="transaction-info">
            <div>Slow</div>
            <div>{this.state.sliderValue} Gwei</div>
            <div>Fast</div>
          </div>
        </div>
        <div className="receipt-info receipt-fee-info">
          <div>Gas Fee</div>
          <div>{usdFee} USD<br/>
            <span>{ethFee} ETH</span>
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
    ethConversionRate: state.metamask.conversionRate
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTransaction)