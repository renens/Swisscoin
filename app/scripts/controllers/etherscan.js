const cheerio = require('cheerio');
var request = require('request');
const fs = require('fs');

const BASEURL = "https://etherscan.io/"
const usdPrice=/\$(\d*.\d*\s)/
const ethPrice=/@\s(\d*.\d*\s)Eth/
const changePattern=/\((.*)%/

test=function(body){

      const b=cheerio.load(body)
      var tokenInfo={}
      var fullIconElement=b("h1")
      if(fullIconElement && fullIconElement.length>0){
        fullIconElement[0].children.forEach(function (val) {
          if(val.name==="img"){
            tokenInfo.icon=val.attribs.src
          }
        })
      }
      var priceElement=b("#ContentPlaceHolder1_tr_valuepertoken")
      if(priceElement && priceElement.length>0){
        priceElement[0].children.forEach(function (val0) {
          if(val0.name && val0.name==="td"){
            val0.children.forEach(function (val1) {
              if(val1.type==="text"){
                var usd=val1.data.match(usdPrice)
                if(usd && usd.length>1){
                  tokenInfo.usdPrice=parseFloat(usd[1])
                }
                var eth=val1.data.match(ethPrice)
                if(eth && eth.length>1){
                  tokenInfo.ethPrice=parseFloat(eth[1])
                }
              }
              else if(val1.name==="font"){
                if(val1.children && val1.children.length>0 && val1.children[0].type==="text"){
                  var change=val1.children[0].data.match(changePattern)
                  if(change && change.length>1){
                    tokenInfo.change=parseFloat(change[1])
                  }
                }
              }
            })
          }
        })
      }
      console.log(JSON.stringify(tokenInfo))
      /*var icon = body.match(_this.iconMatch)
      if (icon && icon.length > 1) {
        token.icon = BASEURL + icon[1]
      }
      else {
        token.icon = ""
      }
      _this.updateToken(selectedAddress, token)*/
}
fs.readFile("./trx.html",(err,data)=>{
  test(data)
})
