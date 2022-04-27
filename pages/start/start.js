// 启动页面，也就是展示设置的三个启动图
// 显示完这三个页面之后才会进入首页
const WXAPI = require('apifm-wxapi')
const CONFIG = require('../../config.js')
//获取应用实例
var app = getApp();
Page({
  data: {
    banners:[],
    swiperMaxNumber: 0,
    swiperCurrent: 0   //当前轮播图的页面
  },
  // 启动展示页面：WXAPI:banner(type=app)
  onLoad:function(){
    const _this = this
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    let shopMod = wx.getStorageSync('shopMod')
    if (!shopMod) {
      shopMod = 0
    }
    const app_show_pic_version = wx.getStorageSync('app_show_pic_version')
    if (app_show_pic_version && app_show_pic_version == CONFIG.version) {
      if (shopMod==1) {
        wx.redirectTo({
          url: '/pages/shop/select',
        });
      } else {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }
    } else {}
    //   // 展示启动页
    //   WXAPI.banners({
    //     type: 'app'
    //   }).then(function (res) {
    //     if (res.code == 700) {
    //       if (shopMod==1) {
    //         wx.redirectTo({
    //           url: '/pages/shop/select',
    //         });
    //       } else {
    //         wx.switchTab({
    //           url: '/pages/index/index',
    //         });
    //       }
    //     } else {
    //       _this.setData({
    //         banners: res.data,
    //         swiperMaxNumber: res.data.length
    //       });
    //     }
    //   }).catch(function (e) {
    //     if (shopMod==1) {
    //       wx.redirectTo({
    //         url: '/pages/shop/select',
    //       });
    //     } else {
    //       wx.switchTab({
    //         url: '/pages/index/index',
    //       });
    //     }
    //   })
    // }
  },
  onShow:function(){
    
  },
  swiperchange: function (e) {
    console.log(e);
    //console.log(e.detail.current)
    this.setData({
      swiperCurrent: e.detail.current   //启动页面当前启动图
    })
  },
  // 点击进入店铺按钮事件：首页页面
  goToIndex: function (e) {
    let shopMod = wx.getStorageSync('shopMod')
    if (!shopMod) {
      shopMod = 0
    }
    if (app.globalData.isConnected) {
      wx.setStorage({
        key: 'app_show_pic_version',
        data: CONFIG.version
      })
      if (shopMod == 1) {
        wx.redirectTo({
          url: '/pages/shop/select',
        });
      } else {
        wx.switchTab({
          url: '/pages/index/index',
        });
      }
    } else {
      wx.showToast({
        title: '当前无网络',
        icon: 'none',
      })
    }
  },
  // 点击图片显示左滑进入，并不会进入商品页面
  imgClick(){
    if (this.data.swiperCurrent + 1 != this.data.swiperMaxNumber) {
      wx.showToast({
        title: '左滑进入',
        icon: 'none',
      })
    }
  }
});