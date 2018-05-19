import React, {PropTypes, Component} from 'react';
import {connect} from 'react-redux';
import IconButton from 'material-ui/IconButton';
import AccountIcon from 'material-ui/svg-icons/social/person';
import * as actions from "../../../ui/app/actions";
import {Tabs, Tab} from "material-ui";




import FontIcon from 'material-ui/FontIcon';
import {BottomNavigation, BottomNavigationItem} from 'material-ui/BottomNavigation';
import Paper from 'material-ui/Paper';
import IconLocationOn from 'material-ui/svg-icons/communication/location-on';
import IconAccountBalance from 'material-ui/svg-icons/action/account-box';
import IconSettings from 'material-ui/svg-icons/action/lock';

const tabStyle = {
    default_tab:{
      color: '#FFFFFF',
      backgroundColor: '#606060',
        fontSize: 15,
        textTransform: 'capitalize',
    },
    active_tab:{
      color: '#fbb03f',
      backgroundColor: '#606060',
        fontSize: 15,
        textTransform: 'capitalize',
    }
};

const iconStyle = {
    default_tab:{
        color: '#FFFFFF',
    },
    active_tab:{
        color: '#fbb03f',
    }
};


class Footer extends Component {

  constructor(props) {
    super(props);
  }

  handleChange = (value) => {
    if(value === 'home') {
       this.props.dispatch(actions.goHome())
    } else if (value === 'accounts') {
       this.props.dispatch(actions.showAccountsPage())
    }
    else{
      this.props.dispatch(actions.lockMetamask())
    }
    this.setState({
      value: value,
    });
  };


  getStyle (isActive) {
      return isActive ? tabStyle.active_tab : tabStyle.default_tab
  }

  getIconStyle (isActive) {
    return isActive ? iconStyle.active_tab : iconStyle.default_tab
  }

  render() {
    const page=this.props.page
    return (
    <Tabs className="app-footer" value={page} onChange={this.handleChange} inkBarStyle={{background: '#fbb03f'}}>
      <Tab value="home" style={ this.getStyle("home" === page) } icon={<IconLocationOn style={ this.getIconStyle("home" === page) }/> }></Tab>
      <Tab value="accounts" style={ this.getStyle("accounts" === page) } icon={<IconAccountBalance style={ this.getIconStyle("accounts" === page) }/>}></Tab>
      <Tab value="c" style={ this.getStyle("c" === page) } icon={<IconSettings style={ this.getIconStyle("c" === page) }/>}></Tab>
    </Tabs>

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

export default connect(mapStateToProps, mapDispatchToProps)(Footer)