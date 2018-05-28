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


  render() {
    console.warn(this)
    if (this.props.provider.type && this.props.provider.type !== "mainnet") {
      this.props.dispatch(actions.setProviderType('mainnet'))
      return <div>hello</div>
    }
    var mainComponent
    if (!this.props.isTutorialReaded) {
      mainComponent = <WelcomeScreen/>
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
    return (
      //
      <MuiThemeProvider>

        <div style={{overflow:"hidden"}}>
          <link rel="stylesheet" href="/css/style.css"/>
          {mainComponent}
        </div>
      </MuiThemeProvider>
    );
  }
}

function mapStateToProps(state) {
  return {
    isTutorialReaded: state.metamask.isTutorialReaded,
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