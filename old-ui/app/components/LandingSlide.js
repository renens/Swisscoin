import React, { PropTypes, Component } from 'react';
import Wave from './Wave';

export default class LandingSlide extends Component {

  static propTypes = {
    title: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired
  };

  render() {
    const { title } = this.props;
    const { desc } = this.props;
    const { image } = this.props;
    return (
      <div className="chrome-extension-container tutorial">
        <Wave waveType="one" />
        <Wave waveType="two" />
        <Wave waveType="three" />
        <div className="title">{title}</div>
        <div className="imagery-container">
          <img className="float float-0" src={image} role="presentation" />
          <img className="float floating-logos float-1" src="./images/ethereum-logo.png" role="presentation" />
          <img className="float floating-logos float-2" src="./images/0x-logo.png" role="presentation" />
          <img className="float floating-logos float-3" src="./images/augur-logo.png" role="presentation" />
          <img className="float floating-logos float-4" src="./images/bnb-logo.png" role="presentation" />
          <img className="float floating-logos float-5" src="./images/status-logo.png" role="presentation" />
        </div>
        <div className="logo" />
        <div className="description">{desc}</div>
      </div>
    );
  }
}
