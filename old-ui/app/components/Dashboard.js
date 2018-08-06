import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import Header from "./Header";
import {connect} from 'react-redux';
import Balance from "./Balance";
import History from "./History";
import Footer from "./Footer";
import SendTransaction from "./SendTransaction";
import ConfirmTransaction from "./ConfirmTransaction";
import Accounts from "./Accounts";
import IconButton from 'material-ui/IconButton';
import CopyIcon from 'material-ui/svg-icons/content/content-copy';
import {Tabs, Tab, Dialog, FlatButton} from "material-ui";
import * as actions from "../../../ui/app/actions";
import ConfirmationSeeds from "./ConfirmationSeeds";
import ConfirmTransactionDialog from "./ConfirmTransactionDialog";
import Settings from "./Settings";

const txHelper = require('../../lib/tx-helper')

const tabStyle = {
  default_tab: {
    color: '#7d878d',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    textTransform: 'capitalize',
    borderBottom: '2px solid #eee'
  },
  active_tab: {
    color: '#fbb03f',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    textTransform: 'capitalize',
  }
};


class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 'a',
    };
  }

  handleChange = (value) => {
    this.setState({
      value: value,
    });
  };


  getStyle(isActive) {
    return isActive ? tabStyle.active_tab : tabStyle.default_tab
  }

  getBalances = () => {
    return <div>
      <Tabs value={this.state.value} onChange={this.handleChange} inkBarStyle={{background: '#fbb03f'}}>
        <Tab value="a" style={this.getStyle("a" === this.state.value)} label="Balance"></Tab>
        <Tab value="b" style={this.getStyle("b" === this.state.value)} label="History"></Tab>
      </Tabs>

      <div>
        {this.state.value === 'a' ? (
          <Balance/>
        ) : (
          <History/>
        )}
      </div>
    </div>
  }


  copyAddress = (e) => {
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    copyDiv.style.width = "0px"
    copyDiv.style.height = "0px"
    document.body.appendChild(copyDiv);
    copyDiv.innerHTML = this.props.state.metamask.selectedAddress;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
  }

  render() {
    const {
      network, unapprovedTxs,
      unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, blockGasLimit
    } = this.props

    var unconfTxList = txHelper(unapprovedTxs, unapprovedMsgs, unapprovedPersonalMsgs, unapprovedTypedMessages, network)

    var firstTx = unconfTxList.pop()

    var mainContainer;
    var hideFooter = false
    var uncomfirmetnCount = 0
    var _this = this
    var page = "home"
    var showConfirmTransaction = false
    if (this.props.currentView.name === "sendTransaction") {
      mainContainer = <SendTransaction/>
      hideFooter = true
    }
    else if (/*this.props.currentView.name === "confTx" &&*/ firstTx) {
      hideFooter = true
      showConfirmTransaction = true
      mainContainer = this.getBalances()
    }
    else if (this.props.currentView.name === "accounts") {
      mainContainer = <Accounts/>
      page = "accounts"
    }
    else if (this.props.currentView.name === "config") {
      mainContainer = <Settings/>
      page = "settings"
    }
    else {
      mainContainer = this.getBalances()
    }
    var dialogActions
    var showConfirm = false

    var seed
    var hideDetail = false
    if (this.props.seed || this.props.cachedSeed) {
      showConfirm = true
      hideDetail = true
      if (this.props.seed) {
        seed = this.props.seed
      }
      else {
        seed = this.props.cachedSeed
      }
      var confirm = function () {
        _this.props.dispatch(actions.confirmSeedWords())
        showConfirm = false
      }
      dialogActions = [
        <div className="general-btn" style={{height: "16px"}} onClick={confirm}>
          <span>Confirm</span>
        </div>
      ]
    }
    var addressSize = this.props.state.metamask.selectedAddress.length
    var curAddress = this.props.state.metamask.selectedAddress
    return (
      <div className="account-wallet chrome-extension-container">
        <Header hideDetail={hideDetail}/>
        <div className="wallet-address-container" hidden={page === 'accounts' || hideFooter}>
          <div className="wallet-address">
            {curAddress}
          </div>
          <span className="copyIcon" onClick={this.copyAddress}>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACfSURBVDhPY8AGKrrn/MeF6/oXXoQqww1ACj/9+o+BQeI9c1b/q5mw4DxUKXaAz4Av377/75m96h/QJafginHhKYs3YhgAAl++fv/fDTSkpn/+UbAB2ABIvGfumv9TlmxCMQAd4zUA7Nw5q/5PX7YFxSXIBuI1AATAzgUaMmPFVtINQMckGYAORg2AKMaGSTIAnHTRAVUMIBZDtSABBgYAnWj0B+1+CHAAAAAASUVORK5CYII="/>
          </span>

        </div>
        {mainContainer}

        <Dialog
          title="Loading"
          modal={true}
          open={this.props.isLoading}
        >
          {this.props.loadingMessage}
        </Dialog>

        <Dialog
          title="Confirm seed words"
          modal={true}
          actions={dialogActions}
          open={showConfirm}
        >
          <ConfirmationSeeds seed={seed}/>
        </Dialog>
        <ConfirmTransactionDialog tx={firstTx} open={showConfirmTransaction}/>
        <div hidden={hideFooter}>
          <Footer page={page}/>
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
    currentView: state.appState.currentView,
    isLoading: state.appState.isLoading,
    loadingMessages: state.appState.loadingMessage,
    seed: state.appState.currentView.seedWords,
    cachedSeed: state.metamask.seedWords,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Dashboard)