import React, {PropTypes, Component} from 'react';
import WelcomeScreen from "./components/WelcomeScreen";

const actions = require('../../ui/app/actions')
import {connect} from 'react-redux';
import CreateRestore from "./components/CreateRestoreScreeen";
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Dashboard from "./components/Dashboard";
import Unlock from "./components/Unlock";
import swTheme from "./swtheme"

const muiTheme = getMuiTheme({

})

class App extends Component {


  constructor(props) {
    super(props)
    if(chrome.tabs) {
      chrome.tabs.query({active: true}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {hideAnimation: true})
        })

      })
    }
    else{
     props.dispatch(actions.hideLoading())
    }
  }

  render() {
    console.warn(this)
    if (this.props.provider.type && this.props.provider.type !== "mainnet") {
      this.props.dispatch(actions.setProviderType('mainnet'))
      return <div></div>
    }
    var mainComponent
    if (!this.props.noActiveNotices && this.props.lastUnreadNotice) {
      mainComponent = <WelcomeScreen notice={this.props.lastUnreadNotice}/>
    }
    else if (!this.props.isInitialized || this.props.forgottenPassword) {
      mainComponent = <CreateRestore/>
    }
    else if (!this.props.isUnlocked) {
      mainComponent = <Unlock/>
    }
    else {
      mainComponent = <Dashboard/>
    }
    var cssUrl=chrome.runtime.getURL("/css/style.css")
    return (
      //
      <MuiThemeProvider>

        <div style={{overflow:"hidden"}}>
          <link rel="stylesheet" href={cssUrl}/>
          {mainComponent}
        </div>
      </MuiThemeProvider>
    );
  }
}

function mapStateToProps(state) {
  return {
    noActiveNotices: state.metamask.noActiveNotices,
    lastUnreadNotice:state.metamask.lastUnreadNotice,
    isInitialized: state.metamask.isInitialized,
    forgottenPassword: state.appState.forgottenPassword,
    isUnlocked: state.metamask.isUnlocked,
    provider: state.metamask.provider,
    fullstate: state
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)