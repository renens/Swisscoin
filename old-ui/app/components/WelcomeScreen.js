import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Slider from 'react-slick';
const actions = require('../../../ui/app/actions')
import LandingSlide from './LandingSlide';
import {FlatButton} from "material-ui";

class WelcomeScreen extends Component {


  markReaded=()=>{
    this.props.dispatch(actions.markNoticeRead(this.props.notice))
  }

  getLinkNotice=(notice)=>{
    return <iframe className="noticeContent" src={notice.link}></iframe>
  }

  getTextNotice=(notice)=>{
    var text
    if(Array.isArray(notice.text)) {
      text=notice.text.map((t) => {
        return <p>{t}</p>
      })
    }
    else{
      text =<p>{notice.text}</p>
    }
    return <div className="noticeContent">
      <h4 className="textNoticeTitle" >{notice.title}</h4>
      <div className="textContent" >
        {text}
      </div>

    </div>
  }

  getTopicNotice=(notice)=>{
    const title=notice.title?notice.title:"Title"
    return <LandingSlide title={title} image={notice.image} desc={notice.text} />
  }
  getNotice=()=>{
    const notice=this.props.notice
    if(notice.type==="link"){
      return this.getLinkNotice(notice)
    }
    else if(notice.type==="text"){
      return this.getTextNotice(notice)
    }
    else if(notice.type==="topic"){
      return this.getTopicNotice(notice)
    }
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
        <div>
          {this.getNotice()}
        </div>
        <div className="noticeButton">
          <div className="general-btn" onClick={this.markReaded}>
            <span>Agree</span>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps (state) {
  return {

  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch:dispatch
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(WelcomeScreen)