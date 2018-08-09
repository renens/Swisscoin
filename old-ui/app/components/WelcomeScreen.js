import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Slider from 'react-slick';

const actions = require('../../../ui/app/actions')
import LandingSlide from './LandingSlide';
import {FlatButton} from "material-ui";

class WelcomeScreen extends Component {


  markReaded = () => {
    this.props.dispatch(actions.markNoticeRead(this.props.notice))
  }

  getLinkNotice = (notice) => {
    return <iframe className="noticeContent" src={notice.link}></iframe>
  }

  getTextNotice = (notice) => {
    var text
    if (Array.isArray(notice.text)) {
      text = notice.text.map((t) => {
        return <p>{t}</p>
      })
    }
    else {
      text = <p>{notice.text}</p>
    }
    return <div className="noticeContent">
      <h4 className="textNoticeTitle">{notice.title}</h4>
      <div className="textContent">
        {text}
      </div>

    </div>
  }

  getTopicNotice = (notice) => {
    const settings = {
      dots: true,
      infinite: true,
      speed: 1000,
      autoplay: true,
      autoplaySpeed: 5000,
      slidesToShow: 1,
      slidesToScroll: 1
    };
    var slides = []
    notice.forEach((n) => {
      const title = n.title ? n.title : "Title"
      slides.push(
        <LandingSlide title={title} image={n.image} desc={n.text}/>
      )
    })

    return <Slider {...settings} className="welcome-container">
      {slides}
    </Slider>

  }

  getNewsNotice = (notice) => {
    const title = notice.title ? notice.title : "Title"
    return <LandingSlide title={title} image={notice.image} desc={notice.text} isText="true"/>
  }
  getNotice = () => {
    const notice = this.props.notice
    if (notice.type === "link") {
      return this.getLinkNotice(notice.data)
    }
    else if (notice.type === "text") {
      return this.getTextNotice(notice.data)
    }
    else if (notice.type === "news") {
      return this.getNewsNotice(notice.data)
    }
    else if (notice.type === "topics") {
      return this.getTopicNotice(notice.data)
    }
  }

  render() {

    var buttonLabel = this.props.unreadNoticeCount === 1 ? "Open" : "Next"
    if (this.props.notice.type === "text") {
      buttonLabel = "Agree"
    }
    return (
      <div>
        <div>
          {this.getNotice()}
        </div>
        <div className="noticeButton">
          <div className="general-btn" onClick={this.markReaded}>
            <span>{buttonLabel}</span>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    unreadNoticeCount: state.metamask.unreadNoticeCount
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WelcomeScreen)