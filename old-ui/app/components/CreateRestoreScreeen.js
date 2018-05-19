import React, {PropTypes, Component} from 'react';
import TextField from 'material-ui/TextField';
import {connect} from "react-redux";
import * as actions from "../../../ui/app/actions";
import CreateVault from "./CreateVault";
import RestoreVault from "./RestoreVault";

class Register extends Component {


  constructor(props) {
    super(props)
    this.state={
      createVaultHidden:false,
      changeText:"Restore vault"
    }
  }
  changeBlock=()=>{
    if(this.state.createVaultHidden){
      this.setState({
        createVaultHidden:false,
        changeText:"Create vault"
      })
    }
    else {
      this.setState({
        createVaultHidden:true,
        changeText:"Restore vault"
      })
    }
  }
  render() {
    return (
     <div>

       <div hidden={this.state.createVaultHidden}>
         <CreateVault changeBlock={this.changeBlock}/>
       </div>
       <div hidden={!this.state.createVaultHidden}>
         <RestoreVault changeBlock={this.changeBlock}/>
       </div>

     </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Register)