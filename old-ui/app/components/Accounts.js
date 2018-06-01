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
  }

  setDefaultAccount = (val) => {
    console.log(val)
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

  render() {
    var accounts = []
    for (var addr in this.props.accounts) {
      accounts.push(this.props.accounts[addr])
    }
    return (
      <div>
        <div className="app-header">
          <center>
            <h3 >Accounts</h3>
          </center>
          <div className="general-btn" onClick={this.addAccount}>
            <span>Add</span>
            <div className="wave -button"/>
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