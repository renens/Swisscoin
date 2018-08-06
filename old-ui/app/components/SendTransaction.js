import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import TextField from 'material-ui/TextField';
import {connect} from "react-redux";
import * as actions from "../../../ui/app/actions";
import {Dialog, Divider, FlatButton, RaisedButton, Slider} from "material-ui";
import {orange500, blue500} from 'material-ui/styles/colors';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const abi = require('human-standard-token-abi')
const ethUtil = require('ethereumjs-util')
const util = require('../util')


const muiTheme = getMuiTheme({
  slider: {
    trackColor: '#c2cdd3',
    selectionColor: '#fbb03f'
  },
  toggle: {
    thumbOnColor: 'rgb(144, 126, 229)',
    trackOnColor: 'rgb(128, 79, 227)',
  },
  thumbOff: {
    backgroundColor: '#ebecf7',
  },
  trackOff: {
    backgroundColor: '#c6c9ef',
  },
});

const styles = {
  underlineStyle: {
    borderColor: '#fbb03f',
  },
  floatingLabelStyle: {
    color: '#fbb03f',
  },
  floatingLabelFocusStyle: {
    color: '#fbb03f',
  },
  toggle: {
    marginBottom: 16,
  },
  thumbSwitched: {
    backgroundColor: 'red',
  },
  trackSwitched: {
    backgroundColor: '#ff9d9d',
  },
  thumbOff: {
    backgroundColor: '#ebecf7',
  },
  trackOff: {
    backgroundColor: '#c6c9ef',
  },
  max: {
    position: 'absolute',
    right: '25px',
    marginTop: '35px',
    lineHeight: '28px',
    height: '28px',
    minWidth: '60px',
    fontSize: '11px',
  },
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
};


class SendTransaction extends Component {

  constructor(props, context) {

    super(props);
    var _this = this

    this.state = {
      amountError: "",
      addressError: "",
      amount: undefined,
      gasPrices: {},
      gasPrice: 0,
      secondSlider: 50,
      swiftSend: true,
      estimateGas: 21000
    };

    this.symbol = this.props.tokens[this.props.currentView.value.address] ?
      this.props.tokens[this.props.currentView.value.address].symbol : "ETH"

    this.props.dispatch(actions.getGasPrice()).then(function (result) {
      _this.setState({
        gasPrices: result,
        gasPrice: result.normal
      })
    })
  }

  showConfirm = () => {
    if (this.state.amountError === "" && this.amount.getValue() !== "" &&
      this.state.addressError === "" && this.recipient.getValue() !== "") {
      var gasPrice = new ethUtil.BN(this.state.gasPrice).mul(util.bnTable.gwei).toString("hex")
      if (this.props.currentView.value.isToken) {
        console.log("Do transfer token")
        const value = this.amount.getValue() * Math.pow(10, this.props.currentView.value.decimals)
        let tokenAddress = this.props.currentView.value.address;
        var tokenInst = global.eth.contract(abi).at(tokenAddress)
        var data = tokenInst.transfer(ethUtil.addHexPrefix(this.recipient.getValue()), value,
          {
            from: this.props.state.metamask.selectedAddress,
            gasPrice: "0x" + gasPrice
          },
          function (err, res) {
            console.log(err)
          }
        )
        this.props.dispatch(actions.goHome())
      }
      else {
        const value = util.normalizeEthStringToWei(this.amount.getValue())
        var txParams = {
          from: this.props.state.metamask.selectedAddress,
          value: '0x' + value.toString(16),
          gasPrice: "0x" + gasPrice
        }

        txParams.to = ethUtil.addHexPrefix(this.recipient.getValue())
        console.log("Do send ether")
        this.props.dispatch(actions.signTx(txParams))
      }
    }
  }

  cancel = () => {
    this.props.dispatch(actions.goHome())
  }

  checkAddress = (e, val) => {
    if (!ethUtil.isValidAddress(val)) {
      this.setState({
        addressError: "wrong address"
      })
    }
    else {
      this.setState({
        addressError: ""
      })
    }
  }
  checkAmount = (e, val) => {
    this.setState({
      amount: val
    })
    if (val < 0) {
      this.setState({
        amountError: "Amount must be a positive"
      })
    }
    else if (val > this.props.currentView.value.balance) {
      this.setState({
        amountError: "Amount must be a lower than balance"
      })
    }
    else {
      this.setState({
        amountError: "",
      })
    }
  }
  setMaxAmount = () => {
    this.setState({
      amount: this.props.currentView.value.balance
    })
  }

  render() {
    const balance = this.props.currentView.value.balance
    var getAmountHint = () => {
      return "Max value :" + balance
    }
    var _this = this
    var getFee = () => {
      var gasPrice = parseInt(this.state.gasPrice + "")
      var estGas = parseInt(this.state.estimateGas.toString())
      const estGasEth = gasPrice*estGas/ Math.pow(10, 9);
      return (estGasEth * _this.props.conversionRate).toFixed(2)
    }

    var getCurrencySymbol = () => {
      return this.props.currencySymbol ? this.props.currencySymbol : "$"
    }

    return (

      <div className="send-container">

        <TextField
          id="recipient"
          className="recipient_text"
          floatingLabelText="To"
          fullWidth={true}
          hintText="Recipient address"
          margin="normal"
          defaultValue=""
          onChange={this.checkAddress}
          ref={(t) => this.recipient = t}
          underlineFocusStyle={styles.underlineStyle}
          floatingLabelFocusStyle={styles.floatingLabelFocusStyle}
          inputStyle={{fontSize: '14px;', color: '#5f5865;'}}
        />
        <div className="amount-input-btn-block">

          <TextField
            id="transferAmount"
            className="pay_text"
            floatingLabelText="Amount"
            fullWidth={true}
            hintText={getAmountHint()}
            margin="normal"
            type="number"
            value={this.state.amount}
            onChange={this.checkAmount}
            errorText={this.state.amountError}
            ref={(t) => this.amount = t}
            underlineFocusStyle={styles.underlineStyle}
            floatingLabelFocusStyle={styles.floatingLabelFocusStyle}
            inputStyle={{fontSize: '14px;', color: '#5f5865;'}}

          />
          <FlatButton className="max-btn" style={styles.max} label={"max"} onClick={this.setMaxAmount}/>

        </div>
        <div className="send-btn-container">
          <div>
            <RaisedButton buttonStyle={styles.slowButton} label="slow" onClick={() => {
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
          <div className="fee-summary">
            <span className="max-fee">Min Network Fee</span>
            <span className="usd-fee">{getFee()}</span> {getCurrencySymbol()}
          </div>

          <div className="transaction-btn-container">
            <div className="general-btn cancel-btn" onClick={this.cancel}>
              <span>Cancel</span>
            </div>

            <div className="general-btn" onClick={this.showConfirm}>
              <span>Send</span>
              <div className="wave -button"/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    currentView: state.appState.currentView,
    tokens: state.metamask.tokens,
    conversionRate: state.metamask.conversionRate,
    currencySymbol: state.metamask.currencySymbol,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SendTransaction)
