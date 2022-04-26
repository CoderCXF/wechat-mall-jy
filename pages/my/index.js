const WXAPI = require('apifm-wxapi')
const AUTH = require('../../utils/auth')
const TOOLS = require('../../utils/tools.js')

Page({
	data: {
    balance:0.00,  //余额
    freeze:0,      //冻结金额
    score:0,       //积分
    growth:0,      //成长值
    score_sign_continuous:0,
    rechargeOpen: false, // 是否开启充值[预存]功能

    // 用户订单统计数据
    count_id_no_confirm: 0,  //商家已发货，等待确认收货的订单
    count_id_no_pay: 0,    //未付款的订单
    count_id_no_reputation: 0,    //交易成功，等待评价的订单
    count_id_no_transfer: 0,    //等待发货的订单

    // 判断有没有用户详细资料
    userInfoStatus: 0 // 0 未读取 1 没有详细信息 2 有详细信息
  },
	onLoad() {
    this.readConfigVal()
    // 补偿写法
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
	},
  onShow() {
    const _this = this
    AUTH.checkHasLogined().then(isLogined => {
      if (isLogined) {
        _this.getUserApiInfo();  //获取用户信息
        _this.getUserAmount();   //获取用户金额
        _this.orderStatistics();  //获取用户订单统计信息
        _this.cardMyList();  //
        TOOLS.showTabBarBadge();
      } else {
        AUTH.authorize().then(res => {
          AUTH.bindSeller()
          _this.getUserApiInfo();
          _this.getUserAmount();
          _this.orderStatistics();
          _this.cardMyList();
          TOOLS.showTabBarBadge();
        })
      }
    })
    AUTH.wxaCode().then(code => {
      this.data.code = code
    })
  },
  readConfigVal() {
    this.setData({
      order_hx_uids: wx.getStorageSync('order_hx_uids'),
      cps_open: wx.getStorageSync('cps_open'),
      recycle_open: wx.getStorageSync('recycle_open'),  //回收订单
      show_3_seller: wx.getStorageSync('show_3_seller'),  //三级分销商
      show_quan_exchange_score: wx.getStorageSync('show_quan_exchange_score'),
      show_score_exchange_growth: wx.getStorageSync('show_score_exchange_growth'),
      show_score_sign: wx.getStorageSync('show_score_sign'),
    })
  },
  // 获取用户信息：WXAPI.userDetail
  async getUserApiInfo() {
    const res = await WXAPI.userDetail(wx.getStorageSync('token'))
    if (res.code == 0) {
      let _data = {}
      _data.apiUserInfoMap = res.data
      if (res.data.base.mobile) {
        _data.userMobile = res.data.base.mobile
      }
      // nick：昵称 avatarUrl：头像图片地址
      if (res.data.base.nick && res.data.base.avatarUrl) {
        _data.userInfoStatus = 2
      } else {
        _data.userInfoStatus = 1
      }
      if (this.data.order_hx_uids && this.data.order_hx_uids.indexOf(res.data.base.id) != -1) {
        _data.canHX = true // 具有扫码核销的权限
      }
      const adminUserIds = wx.getStorageSync('adminUserIds')
      if (adminUserIds && adminUserIds.indexOf(res.data.base.id) != -1) {
        _data.isAdmin = true
      }
      if (res.data.peisongMember && res.data.peisongMember.status == 1) {
        _data.memberChecked = false
      } else {
        _data.memberChecked = true
      }
      this.setData(_data);
    }
  },
  // TODO：？
  async memberCheckedChange() {
    const res = await WXAPI.peisongMemberChangeWorkStatus(wx.getStorageSync('token'))
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
    } else {
      this.getUserApiInfo()
    }
  },
  /* 获取用户资产信息：WXAPI.userAmount
  *  balance 可用余额
  * freeze 冻结金额
  * score 可用积分
  * growth 当前成长值
  * totleConsumed 累计消费金额
  */
  getUserAmount: function () {
    var that = this;
    WXAPI.userAmount(wx.getStorageSync('token')).then(function (res) {
      if (res.code == 0) {
        that.setData({
          balance: res.data.balance.toFixed(2),
          freeze: res.data.freeze.toFixed(2),
          score: res.data.score,
          growth: res.data.growth
        });
      }
    })
  },
  handleOrderCount: function (count) {
    return count > 99 ? '99+' : count;
  },
  /*
  * 用户订单统计：WXAPI.orderStatistics
  * count_id_no_confirm,
  * count_id_no_pay,
  * count_id_no_reputation,
  * count_id_no_transfer,
  */ 
  orderStatistics: function () {
    WXAPI.orderStatistics(wx.getStorageSync('token')).then((res) => {
      if (res.code == 0) {
        const {
          count_id_no_confirm,
          count_id_no_pay,
          count_id_no_reputation,
          count_id_no_transfer,
        } = res.data || {}
        this.setData({
          count_id_no_confirm: this.handleOrderCount(count_id_no_confirm),
          count_id_no_pay: this.handleOrderCount(count_id_no_pay),
          count_id_no_reputation: this.handleOrderCount(count_id_no_reputation),
          count_id_no_transfer: this.handleOrderCount(count_id_no_transfer),
        })
      }
    })
  },
  // 点击余额和冻结和常用功能的资金明细按钮，都会跳转至资产管理页面
  goAsset: function () {
    wx.navigateTo({
      url: "/pages/asset/index"
    })
  },
  // 点击积分，跳转至积分页面
  goScore: function () {
    wx.navigateTo({
      url: "/pages/score/index"
    })
  },
  // 代付款/待发货/待收货/待评价/售后都会跳转至"订单列表order-list"页面，显示所有的订单
  goOrder: function (e) {
    wx.navigateTo({
      url: "/pages/order-list/index?type=" + e.currentTarget.dataset.type
    })
  },
  // 扫码核销
  scanOrderCode(){
    wx.scanCode({
      onlyFromCamera: true,
      success(res) {
        wx.navigateTo({
          url: '/pages/order-details/scan-result?hxNumber=' + res.result,
        })
      },
      fail(err) {
        console.error(err)
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  // 微信一键登录
  updateUserInfo(e) {
    wx.getUserProfile({
      lang: 'zh_CN',
      desc: '用于完善会员资料',
      success: res => {
        console.log(res);
        this._updateUserInfo(res.userInfo)  //修改用户资料
      },
      fail: err => {
        console.log(err);
        wx.showToast({
          title: err.errMsg,
          icon: 'none'
        })
      }
    })
  },
  // 修改用户资料，当退出然后其他用户登录的时候，需要重新根据该用户的token值获取用户信息，即更新用户
  async _updateUserInfo(userInfo) {
    const postData = {
      token: wx.getStorageSync('token'),
      nick: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl,
      city: userInfo.city,
      province: userInfo.province,
      gender: userInfo.gender,
    }
    const res = await WXAPI.modifyUserInfo(postData)
    if (res.code != 0) {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      })
      return
    }
    wx.showToast({
      title: '登陆成功',
    })
    this.getUserApiInfo()
  },
  // 跳转至成长值页面，这个页面和score页面类似，并且都在/pages/score/目录下
  gogrowth() {
    wx.navigateTo({
      url: '/pages/score/growth',
    })
  },
  // TODO：会员卡，暂时没有该功能
  async cardMyList() {
    const res = await WXAPI.cardMyList(wx.getStorageSync('token'))
    if (res.code == 0) {
      const myCards = res.data.filter(ele => { return ele.status == 0 })
      if (myCards.length > 0) {
        this.setData({
          myCards: res.data
        })
      }
    }
  },
})