const EventEmitter = require('events').EventEmitter
const semver = require('semver')
const extend = require('xtend')
const ObservableStore = require('obs-store')
const hardCodedNotices = require('../../notices/notices.json')
const uniqBy = require('lodash.uniqby')
var request = require('request');

module.exports = class NoticeController extends EventEmitter {

  constructor (opts) {
    super()
    this.noticePoller = null
    this.firstVersion = opts.firstVersion
    this.version = opts.version
    const initState = extend({
      noticesList: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.memStore = new ObservableStore({})
    this.store.subscribe(() => this._updateMemstore())
  }

  getNoticesList () {
    return this.store.getState().noticesList
  }

  getUnreadNotices () {
    const notices = this.getNoticesList()
    return notices.filter((notice) => notice.read === false)
  }

  getLatestUnreadNotice () {
    const unreadNotices = this.getUnreadNotices()
    return unreadNotices[unreadNotices.length - 1]
  }

  async setNoticesList (noticesList) {
    this.store.updateState({ noticesList })
    return true
  }

  markNoticeRead (noticeToMark, cb) {
    cb = cb || function (err) { if (err) throw err }
    try {
      var notices = this.getNoticesList()
      var index = notices.findIndex((currentNotice) => currentNotice.id === noticeToMark.id)
      notices[index].read = true
      notices[index].body = ''
      this.setNoticesList(notices)
      const latestNotice = this.getLatestUnreadNotice()
      cb(null, latestNotice)
    } catch (err) {
      cb(err)
    }
  }

  async updateNoticesList () {
    const newNotices = await this._retrieveNoticeData()
    const oldNotices = this.getNoticesList()
    const combinedNotices = this._mergeNotices(oldNotices, newNotices)
    const filteredNotices = this._filterNotices(combinedNotices)
    const result = this.setNoticesList(filteredNotices)
    this._updateMemstore()
    return result
  }

  startPolling () {
    if (this.noticePoller) {
      clearInterval(this.noticePoller)
    }
    this.noticePoller = setInterval(() => {
      this.noticeController.updateNoticesList()
    }, 300000)
  }

  _mergeNotices (oldNotices, newNotices) {
    return uniqBy(oldNotices.concat(newNotices), 'id')
  }

  _filterNotices (notices) {
    return notices.filter((newNotice) => {
      if ('version' in newNotice) {
        const satisfied = semver.satisfies(this.version, newNotice.version)
        return satisfied
      }
      if ('firstVersion' in newNotice) {
        const satisfied = semver.satisfies(this.firstVersion, newNotice.firstVersion)
        return satisfied
      }
      return true
    })
  }

  _mapNoticeIds (notices) {
    return notices.map((notice) => notice.id)
  }

  async _retrieveNoticeData () {
    return new Promise((resolve,reject) => {
      var ts=new Date().getTime()
      request('https://raw.githubusercontent.com/renens/Swisscoin/master/welcome.json?'+ts,(error, response, body)=>{
        if(error){
          reject(error)
        }
        else{
          var notices=[]
          var allData=JSON.parse(body)
          if(allData.topics && allData.topics.length>0) {
            notices.push({
              id: 1,
              type: 'topics',
              read: false,
              data: allData.topics
            })
          }
          if(allData.news && allData.news.length>0) {
            let last = allData.news.pop();
            notices.push({
              id: last.id,
              type: 'news',
              read: false,
              data: last
            })
          }
          if(allData.terms && allData.terms.length>0) {
            allData.terms.forEach((t)=>{
              notices.push({
                id: t.id,
                type: 'text',
                read: false,
                data: t
              })
            })
          }
          if(allData.links && allData.links.length>0) {
            allData.links.forEach((l)=>{
              notices.push({
                id: l.id,
                type: 'link',
                read: false,
                data: l
              })
            })
          }
          resolve(notices)
        }
      })
    })

  }

  _updateMemstore () {
    const lastUnreadNotice = this.getLatestUnreadNotice()
    const noActiveNotices = !lastUnreadNotice
    const unreadNoticeCount=this.getUnreadNotices().length
    this.memStore.updateState({ lastUnreadNotice, noActiveNotices,unreadNoticeCount })
  }

}
