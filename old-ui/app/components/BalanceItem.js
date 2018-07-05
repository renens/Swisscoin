import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import {connect} from 'react-redux';
import * as actions from "../../../ui/app/actions";
import {FloatingActionButton} from "material-ui";
const explorerLink = require('etherscan-link').createExplorerLink
const util = require('../util')

class BalanceItem extends Component {
  style = {
    containerStyle: {
      background: "blue"
    }
  }

  constructor(props) {
    super(props)

    var image = "";
    var background = "white"
    var _this = this
    if (props.isToken) {

    }
    else {
      image = "./images/ether.png"
    }


    this.state = {
      image: image,
      background: background
    }
  }

  showTransfer = () => {
    this.props.dispatch(actions.showSendPage({
      isToken: this.props.isToken,
      address: this.props.address,
      name: this.props.name,
      balance: this.props.tokenCount,
      decimals: this.props.decimals
    }))
  }
  showDetail =(e)=>{
    if (this.props.isToken) {
      e.preventDefault()
      e.stopPropagation()
      var url = explorerLink(this.props.address, 1).replace("tx","token")
      global.platform.openWindow({url})
    }
  }
  formatNumber =(num,digits)=> {
    if(num) {
      return new Intl.NumberFormat({minimumFractionDigits:digits}).format(num);// num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1'")
    }
    else{
      return ""
    }
  }

  render() {
    const _this=this

    var {tokenType, image, tokenCount, balance , address, isToken, name,fullName} = this.props;
    var usdBalance=balance?balance.toFixed(2):0
    if((tokenCount+"").indexOf(".")!==-1){
      tokenCount=parseFloat(tokenCount).toFixed(4)
    }
    var percent;
    var tokenPrice;
    if(isToken){
      var exRate=this.props.contractExchangeRates[address]

      if(exRate) {
        if(exRate.rate) {
          tokenPrice = exRate.rate;
          usdBalance = (tokenCount * exRate.rate).toFixed(2)
        }
        else{
          tokenPrice=exRate.usdPrice
          usdBalance=exRate.usdPrice?(tokenCount*exRate.usdPrice).toFixed(2):"-"
        }
        percent=exRate.change
      }
    }
    else{
      tokenPrice=this.props.conversionRate
    }

    const changeClass = percent ? classnames({
      'change': true,
      'neg-change': parseFloat(percent) < 0
    }) : undefined;

    var getCurrencySymbol=()=>{
      return this.props.currencySymbol?this.props.currencySymbol:"$"
    }

    const priceBlock = <div className="token-amount"><span>{getCurrencySymbol} {tokenPrice}</span></div>
    const changeBlock = percent ? <div className={changeClass}>{percent}% </div> : <div></div>

    const eqlBgClass = classnames({
      'eql-logo': tokenType === 'eql',
    });
    var getIcon = function () {
      if (image !== "") {
        return <img onClick={_this.showDetail} className={eqlBgClass} src={image}  role="presentation"/>
      }
      else{
        return <FloatingActionButton mini={true} onClick={_this.showDetail} backgroundColor={"#7d878d"} style={{color:"#fbb03f"}} iconStyle={{color:"#fbb03f"}}>
          {name.slice(0,1)}
        </FloatingActionButton>
      }
    }




    return (
      <div onClick={this.showTransfer}>
        <div className="image-container" >
          {getIcon()}

        </div>
        <div className="token-info">
          <div className="token-name">{fullName ? fullName.toLowerCase() : 'Ethereum'}</div>
          {priceBlock}
        </div>
        <div className="change-container">
          <div className="currency-value">{getCurrencySymbol()} {this.formatNumber(usdBalance,2)}</div>
          <div className="token-amount"><span>{this.formatNumber(tokenCount,8)} {name}</span></div>
    
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    tokens: state.metamask.tokens,
    state: state,
    contractExchangeRates:state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    currencySymbol: state.metamask.currencySymbol,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BalanceItem)