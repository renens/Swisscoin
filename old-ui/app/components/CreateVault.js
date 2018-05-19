import React, {PropTypes, Component} from 'react';
import TextField from 'material-ui/TextField';
import {connect} from "react-redux";
import * as actions from "../../../ui/app/actions";
import {FlatButton} from "material-ui";

class CreateVault extends Component {

  changeStyle = {
    float: "right",
    cursor: "pointer"
  }

  constructor(props) {
    super(props)
    this.state = {
      passwordError: "",
      passwordConfirmError: "",
      seedWorsError: ""
    }
  }

  restoreVault = () => {
    this.setState({
      passwordError: "",
      passwordConfirmError: "",
      seedWorsError: ""
    })
    var password = this.password.getValue()
    if (password.length < 8) {
      var warn = 'Password not long enough'
      this.setState({
        passwordError: warn
      })
      this.props.dispatch(actions.displayWarning(warn))
      return
    }
    if (this.password.getValue() !== this.passwordConfirm.getValue()) {
      var warn = 'Passwords don\'t match'
      this.setState({
        passwordConfirmError: warn
      })
      this.props.dispatch(actions.displayWarning(warn))
      return
    }

    var _this=this
    this.props.dispatch(actions.displayWarning(null))
    this.props.dispatch(actions.createNewVaultAndKeychain(password)).then(function (seed) {
      if(_this.props.forgottenPassword){
        _this.props.dispatch(actions.showAccountsPage())
      }
    })
  }
  changeBlock=()=>{
    console.log("change block")
    this.props.changeBlock()
  }
  render() {
    return (
      <div className="chrome-extension-container seed-backup-screen">
        <div className="wave -one"/>
        <div className="wave -two"/>
        <div className="wave -three"/>
        <div className="imagery-container">
          <img className="nav-icon" width={"100px"} src="./images/eql-white-2.png" role="presentation"/>
          <i className="fas fa-ellipsis-v"/>
        </div>
        <div className="balance-section">
          <div className="balance balance-no-logo">Seed Backup
          </div>
          <div className="balance balance-eth">
            Stay safe and backup your wallet
          </div>
        </div>

        <div className="seed-container" style={{width: "285px"}}>
          <div className="seed-generation-container" hidden={true}>
            <input type="text" className="seed-generation" placeholder="Type 12 words here"
                   ref={(t) => this.seedWords = t}/>
            <div className="backup-suggestion">
              <span>These 12 words are the <strong>ONLY</strong> way to restore your EQUAL wallet, save them someone where safe! <br/></span>
            </div>
            <div className="general-btn download-seed">
              <span>Download Seed Backup <i className="fas fa-arrow-down"/></span>
              <div className="wave -button"/>
            </div>
          </div>


          <div className="seed-confirm">
            <TextField
              id="password"
              floatingLabelText={"Password"}
              fullWidth={true}
              margin="normal"
              type={"password"}
              ref={(t) => this.password = t}
              errorText={this.state.passwordError}
            />
            <TextField
              id="confirm_password"
              floatingLabelText="Confirm password"
              fullWidth={true}
              margin="normal"
              type={"password"}
              ref={(t) => this.passwordConfirm = t}
              errorText={this.state.passwordConfirmError}
            />

            <div className="general-btn" onClick={this.restoreVault}>
              <span>Create account</span>
            </div>

            <FlatButton onClick={this.changeBlock} label={"Restore vault"} style={{float:"right"}}/>

          </div>
        </div>

      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    forgottenPassword: state.appState.forgottenPassword,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateVault)