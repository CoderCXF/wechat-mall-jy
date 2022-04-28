// pages/shareDetails/index.js
const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')

const app = getApp()
Page({
  data: {
    shippingCarInfo: {}
  },
  onLoad: function () {

  },
  onShow(){
    this.shippingCarInfo()
  },
  async shippingCarInfo() {
    const token = wx.getStorageSync('token')
    if (!token) {
      return
    }
    var res = await WXAPI.shippingCarInfo(token)
    if (res.code == 0) {
      res.data.items.forEach(ele => {
        if (!ele.stores || ele.status == 1) {
          ele.selected = false
        }
      })
      this.setData({
        shippingCarInfo: res.data
      })
    } else {
      this.setData({
        shippingCarInfo: null
      })
    }
  },
  // 点击跳转至商品详情页面
  clkToDetail(e){
    let goodsId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/goods-details/index?id=' + goodsId
    })
  }
})