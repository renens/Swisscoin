import React, { PropTypes, Component } from 'react';


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
    const textClass=this.props.isText?"descriptionText":"description"
    return (
        <div className="description">{desc}</div>
    );
  }
}
