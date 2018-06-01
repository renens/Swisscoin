import React, {PropTypes, Component} from 'react';
import classnames from 'classnames';
import {connect} from "react-redux";
import IconButton from 'material-ui/IconButton';
import AlertIcon from 'material-ui/svg-icons/notification/priority-high';
import WifiIcon from 'material-ui/svg-icons/notification/wifi';
import Moment from 'react-moment';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faMinus from '@fortawesome/fontawesome-free-solid/faMinus'
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus'
import faExclamation from '@fortawesome/fontawesome-free-solid/faExclamation'
import faFileAlt from '@fortawesome/fontawesome-free-solid/faFile'
import LinearProgress from 'material-ui/LinearProgress';


const explorerLink = require('etherscan-link').createExplorerLink

class HistoryItem extends Component {

  constructor(props) {
    super(props)

  }

  showTx = () => {
    if(this.props.txInfo.fullHash) {
      var url = explorerLink(this.props.txInfo.fullHash, 1)
      global.platform.openWindow({url})
    }
  }

  render() {
    const {type,value,hash,date,usdValue,symbol}=this.props.txInfo

    const txClass = classnames({
      'tx-amount': true,
      'tx-in': type==="in",
      'tx-out': type==="out",
      'tx-fail': type==="failed"
    });
    var getStatusIcon = function () {
      if (type=== "failed") {
        return <div className="direction">
          <FontAwesomeIcon icon={faExclamation}/>
          <div className="triangle"/>
        </div>
      }
      else if (type === "pending") {
        return <div className="direction tx-pending">
          <IconButton>
            <LinearProgress mode="indeterminate" />
          </IconButton>
        </div>
      }
      else if (type==="in") {
        return <div className="direction direction-in">
          <FontAwesomeIcon icon={faPlus}/>
        </div>
      }
      else if (type==="out") {
        return <div className="direction direction-out">
          <FontAwesomeIcon icon={faMinus}/>
        </div>
      }
      else {
        return <div className="direction direction-call">
          <FontAwesomeIcon icon={faFileAlt}/>
        </div>
      }
    }

    var getTransactionName = () => {
      if(symbol){
        return <div className={symbol ? 'token-name history-token-name' : 'token-name'}>{symbol}</div>
      } else if (type === 'failed') {
        return <div className={symbol ? 'token-name history-token-name' : 'token-name'}>Failed</div>
      } else {
        return <div className={symbol ? 'token-name history-token-name' : 'token-name'}>Contract</div>
      }
    }
    var getCurrencySymbol=()=>{
      return this.props.currencySymbol?this.props.currencySymbol:"$"
    }

    return (
      <div onClick={this.showTx}>
        {getStatusIcon()}
        <div className="token-info transaction-text-block">
          {getTransactionName()}
          <div className="transfer-date"><span>Sent to {hash}</span></div>
          <div className="usd-value"/>
        </div>
        <div className="tx-price-block">
          {usdValue && (
            <div className={txClass}>{usdValue}
              <span className="symbol"> {getCurrencySymbol()}</span>
            </div>
          )}
          <div className="tx-amount crypto-amount">{value || ''}
            <span className="symbol"> {symbol}</span>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    state: state,
    tokens: state.metamask.tokens,
    contractExchangeRates: state.metamask.contractExchangeRates,
    conversionRate: state.metamask.conversionRate,
    currencySymbol: state.metamask.currencySymbol,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch: dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HistoryItem)