import React, { PropTypes, Component } from 'react';
import classnames from 'classnames';

export default class Wave extends Component {

  static propTypes = {
    waveType: PropTypes.string.isRequired
  };

  render() {
    const { waveType } = this.props;
    const waveClass = classnames({
      'wave': true,
      '-one': waveType === 'one',
      '-two': waveType === 'two',
      '-three': waveType === 'three',
    });
    return (
      <div
        className={waveClass}
      />
    );
  }
}
