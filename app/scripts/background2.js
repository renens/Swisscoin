var injectedTabId

chrome.browserAction.onClicked.addListener(function (tab) {

  var doInject=function () {
    if(injectedTabId!==tab.id) {
      injectedTabId = tab.id
      chrome.tabs.executeScript(tab.id, {
        file: 'inject.js'
      });
    }
    else{
      injectedTabId=undefined
    }
  }
  if(injectedTabId){
    chrome.tabs.sendMessage(injectedTabId,{closeWallet:true},function () {
      doInject()
    })
  }
  else{
    doInject()
  }

});