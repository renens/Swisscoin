import React, {PropTypes, Component} from 'react';
import {Dialog, FlatButton} from "material-ui";
import ConfirmTransaction from "./ConfirmTransaction";
import * as actions from "../../../ui/app/actions";
import {connect} from 'react-redux';
const ethUtil = require('ethereumjs-util')
const util = require('../util')

class ConfirmTransactionDialog extends Component {

  constructor(props) {
    super(props)
    this.state={
      gasPrice:"0"
    }
  }

  confirmTx=()=>{
    var tx=this.props.tx
    var gasPrice = new ethUtil.BN(util.bnTable.gwei)
    gasPrice=gasPrice.mul(new ethUtil.BN(this.state.gasPrice))
    tx.txParams.gasPrice='0x' + gasPrice.toString('hex')
    this.props.dispatch(actions.updateAndApproveTx(tx))
  }

  rejectTx=()=>{
    this.props.dispatch(actions.cancelTx(this.props.tx))
  }

  setGasPrice=(gasPrice)=>{
    this.setState({
      gasPrice:gasPrice
    })
  }
  render() {
    var confirmTransactionActions=[
      <FlatButton label={"Cancel"} onClick={this.rejectTx}/>,
      <FlatButton label={"Confirm"} onClick={this.confirmTx}/>
    ]
    return (
      <Dialog
        title="Confirm transaction"
        modal={true}
        actions={confirmTransactionActions}
        open={this.props.open}
      >
        <ConfirmTransaction tx={this.props.tx} setGasPrice={this.setGasPrice}/>
      </Dialog>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmTransactionDialog)