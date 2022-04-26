// 收货地址页面
const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')

const app = getApp()
Page({
  data: {

  },
  selectTap: function(e) {
    console.log(e);
    var id = e.currentTarget.dataset.id;
    WXAPI.updateAddress({
      token: wx.getStorageSync('token'),
      id: id,
      isDefault: 'true'
    }).then(function(res) {
      wx.navigateBack({})
    })
  },
  // 添加收货地址按钮事件，跳转至地址添加页面
  addAddess: function() {
    wx.navigateTo({
      url: "/pages/address-add/index"
    })
  },
  // 修改地址按钮事件，也是跳转至地址添加页面，在地址添加页面判断是添加还是修改，凭参数id进行判断
  editAddess: function(e) {
    console.log(e);
    
    wx.navigateTo({
      url: "/pages/address-add/index?id=" + e.currentTarget.dataset.id
    })
  },

  onLoad: function() {
  },
  onShow: function() {
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        this.initShippingAddress();
      } else {
        AUTH.login(this)
      }
    })
  },
  async initShippingAddress() {
    wx.showLoading({
      title: '',
    })
    // 获取所有的收货地址
    const res = await WXAPI.queryAddress(wx.getStorageSync('token'))
    wx.hideLoading({
      success: (res) => {},
    })
    if (res.code == 0) {
      this.setData({
        addressList: res.data
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    }
  },
  onPullDownRefresh() {
    this.initShippingAddress()
    wx.stopPullDownRefresh()
  },
})