(function() {

  // just place a div at top right
  var d=document.getElementById("app-content-iframe-2")
  if(!d) {
    var tint = document.createElement('div');
    tint.style.backgroundColor="#7c778c4d";
    tint.style.position="fixed";
    tint.style.top="0px";
    tint.style.left="0px";
    tint.style.right="0px";
    tint.style.bottom="0px";
    tint.style.zIndex="99999999";

    var wrapper = document.createElement('div');
    wrapper.id = 'app-wrapper';
    wrapper.style.boxShadow="rgba(0, 0, 0, 0.19) 0px 28px 78px -6px";
    wrapper.style.borderRadius="5px";
    wrapper.style.overflow="hidden";
    wrapper.style.position = 'fixed';
    wrapper.style.zIndex="99999999";
    wrapper.style.width="335px";
    wrapper.style.height="605px";
    wrapper.style.top = "20px";
    wrapper.style.right = "20px";
    var imageUrl=chrome.runtime.getURL("/images/loading.gif");
    console.warn("Home url "+imageUrl)
    wrapper.innerHTML = "<div style='position: absolute; width: 100%; z-index: -1;'><div style=' margin:auto; display:block; width: 100px; margin-top: 240px;' ><img style='width:100px' src='https://www.cryptokitties.co/images/ether-diamond.gif'></div></div>";

    wrapper.style.backgroundColor="#fff";
    var iframe = document.createElement('iframe');
    iframe.style.width="335px";
    iframe.style.height="605px";
    iframe.style.border="0px";
    iframe.src=chrome.runtime.getURL("popup.html")
    iframe.id = "app-content-iframe"
    document.body.appendChild(tint);
    document.body.appendChild(wrapper);
    wrapper.appendChild(iframe)
    // wrapper.onmouseout=function () {
    //   this.hidden=true
    // }
  }
  else{
    if(d.hidden){
      d.hidden=false
    }
  }
  chrome.runtime.onMessage.addListener(function (message) {
    if(message && message.closeWallet){
      tint.remove()
      wrapper.remove()
    }
  })
})();


