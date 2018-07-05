import React, { PropTypes, Component } from 'react';
import TextField from 'material-ui/TextField';
import {connect} from 'react-redux';
import * as actions from "../../../ui/app/actions";

class Unlock extends Component {


  constructor(props) {
    super(props)
    this.state={
      errorText:""
    }
  }

  resetVault=()=>{
    this.props.dispatch(actions.goBackToInitView())
  }
  login=()=>{
    const _this=this
    this.props.dispatch(actions.tryUnlockMetamask(this.password.getValue())).then(function(err,result){
        _this.setState({
          errorText:"Incorrect password"
        })
    })
  }

  render() {
    return (
      <div className="chrome-extension-container tutorial">

        <div className="title">
          <span className="app-title">SWISSWALLET</span>
          <div className="powered-by">
            <span>By Swisscoin Lab</span>
          </div>
        </div>
        <div className="imagery-container">
          <img className="float float-0" style={{top:"1cm",width:"92px"}} src="./images/swisscoin.png" role="presentation" />
          <img className="float floating-logos float-1" src="./images/ethereum-logo.png" role="presentation" />
          <img className="float floating-logos float-2" src="./images/0x-logo.png" role="presentation" />
          <img className="float floating-logos float-3" src="./images/augur-logo.png" role="presentation" />
          <img className="float floating-logos float-4" src="./images/bnb-logo.png" role="presentation" />
          <img className="float floating-logos float-5" src="./images/status-logo.png" role="presentation" />
        </div>
        <div className="logo" />
        <div className="description login-info">
          <div className="login-input-btn-container">
            <TextField
              id="password"
              className="password-text"
              floatingLabelText="Password"
              fullWidth="true"
              margin="normal"
              type={"password"}
              ref={(t)=>this.password=t}
              errorText={this.state.errorText}
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  this.login();
                }
              }}
            />

              <div className="general-btn" onClick={this.login}>
                <span>Log In</span>
              </div>

          </div>
          <a onClick={this.resetVault} style={{cursor:"pointer"}}>Restore wallet from seed phrase</a>
        </div>
      </div>
    );
  }
}
function mapStateToProps(state) {
  return {
    state: state,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Unlock)