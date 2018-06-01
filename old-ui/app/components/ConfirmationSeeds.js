import React, {PropTypes, Component} from 'react';
import TextField from 'material-ui/TextField';
import {connect} from "react-redux";
const exportAsFile = require('../util').exportAsFile

class ConfirmationSeeds extends Component {
  style={
    padding:"0px",
    height:"100%"
  }
  constructor(props) {
    super(props)
  }
  render() {
    return (
      <div className="seed-container" style={this.style}>
        <div className="seed-generation-container" >
          <textarea type="text" className="seed-generation" value={this.props.seed} disabled={true} cols={"40"} rows={"3"}/>
          <div className="backup-suggestion">
            <span>These 12 words are the <strong>ONLY</strong> way to restore your SWISS wallet, save them someone where safe! <br/></span>
          </div>
          <div className="general-btn download-seed">
            <span onClick={()=>exportAsFile(`MetaMask Seed Words`, this.props.seed)}>Download Seed Backup <i className="fas fa-arrow-down"/></span>
            <div className="wave -button"/>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmationSeeds)