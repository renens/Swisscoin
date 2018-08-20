import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import {connect} from 'react-redux';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';
import {Divider, FlatButton} from "material-ui";


import {List, ListItem} from 'material-ui/List';
import ActionInfo from 'material-ui/svg-icons/action/info';
import Subheader from 'material-ui/Subheader';
import Avatar from 'material-ui/Avatar';
import FileFolder from 'material-ui/svg-icons/file/folder';
const exportAsFile = require('../util').exportAsFile
import TextField from 'material-ui/TextField';
import * as actions from "../../../ui/app/actions";


class Accounts extends Component {
  styles = {
    large: {
      width: 120,
      height: 120,
      padding: 30,
    }
  }

  constructor(props) {
    super(props)
    this.state={
      passwordBlock:true
    }
  }

  setDefaultAccount = (val) => {
    const _this=this
    this.props.dispatch(actions.setSelectedAddress(val)).then(function(){
      _this.props.dispatch(actions.goHome())
    })
  }
  addAccount = () => {
    this.props.dispatch(actions.addNewAccount()).then(function (val) {
      _this.props.dispatch(actions.goHome())
    })
  }
  downloadSeedWords=()=>{
    var pass=this.password.getValue()
    this.setState({
      passwordBlock:true
    })
    this.props.dispatch(actions.requestRevealSeedWords(pass)).then((seed)=>{
      if(seed) {
        exportAsFile(`SwissWallet Seed Words.txt`, seed)
      }
    })
  }

  render() {
    var accounts = []
    for (var addr in this.props.accounts) {
      accounts.push(this.props.accounts[addr])
    }
    return (
      <div>
        <div className="app-header">
          <div style={{width:"100%"}}>
          <h3 style={{textAlign:"center"}}>Accounts</h3>
            <FlatButton label="Seeds" style={{float:"right",marginTop:"-40px"}} onClick={()=>this.setState({passwordBlock:false})}/>
          </div>
          <div hidden={this.state.passwordBlock}>
            <TextField
              id="password"
              className="password-text"
              hintText="Password"
              floatingLabelText="Enter password for download"
              fullWidth="true"
              margin="normal"
              type={"password"}
              ref={(t)=>this.password=t}
              errorText={this.state.errorText}
              onKeyPress={(ev) => {
                if (ev.key === 'Enter') {
                  ev.preventDefault();
                  this.downloadSeedWords();
                }
              }}
            />
            <div className="general-btn" style={{lineHeight:"36px"}} onClick={this.downloadSeedWords}>
              <span>Confirm</span>
            </div>
          </div>
          <div hidden={!this.state.passwordBlock} className="general-btn" style={{lineHeight:"36px"}} onClick={this.addAccount}>
            <span>Add</span>
          </div>

        </div>
        <List className="accounts-list" data-simplebar>
          {accounts.map((row, index) => (
            <ListItem
              className={'wallet-block'}
              leftAvatar={<Avatar icon={<FileFolder />} />}
              rightIcon={<div className={this.props.selectedAccount == row.address ? 'custom-radio active-custom-radio' : 'custom-radio'}></div>}
              primaryText={"Wallet "+ index}

              secondaryText={row.address}
              value={row.address}
              onClick={this.setDefaultAccount.bind(this, row.address)}
              style={{color:"#fbb03f"}}
            />
            )
          )}
        </List>

      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    selectedAccount: state.metamask.selectedAddress,
    accounts: state.metamask.accounts
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Accounts)