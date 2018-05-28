import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Slider from 'react-slick';
const actions = require('../../../ui/app/actions')
import LandingSlide from './LandingSlide';
import {FlatButton} from "material-ui";

class WelcomeScreen extends Component {

  skipTutorial=()=>{
    var _this=this
    this.props.dispatch(actions.tutorialReaded(true)).then(function () {
      _this.props.dispatch(actions.goHome())
    })
  }

  render() {
    const settings = {
      dots: true,
      infinite: false,
      speed: 500,
      autoplaySpeed:1000,
      slidesToShow: 1,
      slidesToScroll: 1
    };

    return (
      <div>
        <Slider {...settings} className="welcome-container">
          <LandingSlide title="Store" image="./images/wallet-eql.png" desc="Store all your tokens in one simple to use wallet." />
          <LandingSlide title="Send" image="./images/swiss.png" desc="Send any token without the need for MyEtherWallet." />
          <LandingSlide title="Receive" image="./images/swiss.png" desc="Receive Ethereum and any ERC20 token." />
        </Slider>
        <div className="pagination">
            <FlatButton className="skip-tutorial" label={"skip"} onClick={this.skipTutorial} labelStyle={{background:"#ededed"}}/>
        </div>
      </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    isTutorialReaded:state.metamask.isTutorialReaded,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch:dispatch
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(WelcomeScreen)