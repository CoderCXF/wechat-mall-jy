const WXAPI = require('apifm-wxapi')
const TOOLS = require('../../utils/tools.js')
const AUTH = require('../../utils/auth')

// 通过该函数可以实现在当前页面获取app.js,总而获取app.js中定义的全局数据
const APP = getApp()

Page({
  data: {
    inputVal: "", // 搜索框内容
    goodsRecommend: [], // 推荐商品
    kanjiaList: [], //砍价商品列表
    pingtuanList: [], //拼团商品列表
    loadingHidden: false, // loading
    selectCurrent: 0,
    categories: [],  //商品分类
    goods: [],   //所有商品列表
    goodsLess: [], // 每一个分类显示6张图片
    loadingMoreHidden: true,
    coupons: [],  //优惠券列表
    curPage: 1,  //当前页
    pageSize: 20  //页面显示的商品数量
  },
  // 商品分类点击事件
  tabClick(e) {
    const category = this.data.categories.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })
    if (category.vopCid1 || category.vopCid2) {
      wx.navigateTo({
        url: '/pages/goods/list-vop?cid1=' + (category.vopCid1 ? category.vopCid1 : '') + '&cid2=' + (category.vopCid2 ? category.vopCid2 : ''),
      })
    } else {
      wx.setStorageSync("_categoryId", category.id)
      wx.switchTab({
        url: '/pages/category/category',
      })
    }
  },
  // 文章分类点击
  tabClickCms(e) {
    const category = this.data.cmsCategories[e.currentTarget.dataset.idx]
    wx.navigateTo({
      url: '/pages/cms/list?categoryId=' + category.id,
    })
  },
  // 秒杀商品点击事件前往商品详情页
  toDetailsTap: function(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id
    const supplytype = e.currentTarget.dataset.supplytype
    const yyId = e.currentTarget.dataset.yyid
    if (supplytype == 'cps_jd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-jd?id=${id}`,
      })
    } else if (supplytype == 'vop_jd') {
      wx.navigateTo({
        url: `/pages/goods-details/vop?id=${yyId}&goodsId=${id}`,
      })
    } else if (supplytype == 'cps_pdd') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-pdd?id=${id}`,
      })
    } else if (supplytype == 'cps_taobao') {
      wx.navigateTo({
        url: `/packageCps/pages/goods-details/cps-taobao?id=${id}`,
      })
    } else {
      wx.navigateTo({
        url: `/pages/goods-details/index?id=${id}`,
      })
    }
  },
  tapBanner: function(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  adClick: function(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({
        url
      })
    }
  },
  bindTypeTap: function(e) {
    this.setData({
      selectCurrent: e.index
    })
  },
  onLoad: function(e) {
    wx.showShareMenu({
      withShareTicket: true,
    })
    const that = this
    // 读取分享链接中的邀请人编号
    if (e && e.inviter_id) {
      wx.setStorageSync('referrer', e.inviter_id)
    }
    // 读取小程序码中的邀请人编号
    if (e && e.scene) {
      const scene = decodeURIComponent(e.scene)
      if (scene) {        
        wx.setStorageSync('referrer', scene.substring(11))
      }
    }
    // 静默式授权注册/登陆
    AUTH.checkHasLogined().then(isLogined => {
      if (!isLogined) {
        AUTH.authorize().then( aaa => {
          AUTH.bindSeller()
          TOOLS.showTabBarBadge()
        })
      } else {
        AUTH.bindSeller()
        TOOLS.showTabBarBadge()
      }
    })
    // 加载轮播图
    this.initBanners()
    // 获取所有分类
    this.categories()
    this.cmsCategories()
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    // 获取推荐商品
    WXAPI.goodsv2({
      recommendStatus: 1
    }).then(res => {
      if (res.code === 0){  // code===0 表示获取成功
        that.setData({
          goodsRecommend: res.data.result
        })
      }      
    })
    // // 获取优惠券
    // that.getCoupons()
    // 获取公告
    that.getNotice()
    // 获取砍价商品
    that.kanjiaGoods()
    // 获取拼团商品
    that.pingtuanGoods()
    // 获取广告位信息-首页弹窗广告
    this.adPosition()
    // 读取系统参数
    this.readConfigVal()
    getApp().configLoadOK = () => {
      this.readConfigVal()
    }
  },
  // 读取系统参数
  readConfigVal() {
    wx.setNavigationBarTitle({
      title: wx.getStorageSync('mallName')
    })
    this.setData({
      mallName:wx.getStorageSync('mallName')?wx.getStorageSync('mallName'):'',
      show_buy_dynamic: wx.getStorageSync('show_buy_dynamic')
    })
  },
  // 获取所有的秒杀商品
  async miaoshaGoods(){
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.goodsv2({
      miaosha: true
    })
    if (res.code == 0) {
      res.data.result.forEach(ele => {
        const _now = new Date().getTime()
        if (ele.dateStart) {
          ele.dateStartInt = new Date(ele.dateStart.replace(/-/g, '/')).getTime() - _now
        }
        if (ele.dateEnd) {
          ele.dateEndInt = new Date(ele.dateEnd.replace(/-/g, '/')).getTime() -_now
        }
      })
      this.setData({
        miaoshaGoods: res.data.result
      })
    }
  },
  // 读取banner轮播图
  async initBanners(){
    const _data = {}
    // 读取头部轮播图
    const res1 = await WXAPI.banners({
      type: 'index'  //这里的index是标识的图片类型，表示banner加载的是index类型的图像，因为在banner管理中存在其他类型的图像，比如score、livelist和app
    })
    if (res1.code == 700) { // 700表示出错
      wx.showModal({
        title: '提示',
        content: '请在后台添加 banner 轮播图片，自定义类型填写 index',
        showCancel: false
      })
    } else {
      _data.banners = res1.data // 保存banners至_data对象中
    }
    this.setData(_data)
  },
  onShow: function(e){
    this.setData({
      navHeight: APP.globalData.navHeight,
      navTop: APP.globalData.navTop,
      windowHeight: APP.globalData.windowHeight,
      menuButtonObject: APP.globalData.menuButtonObject //小程序胶囊信息
    })
    this.setData({
      shopInfo: wx.getStorageSync('shopInfo')    //门店信息，这里并没有设置
    })
    // 获取购物车数据，显示TabBarBadge
    TOOLS.showTabBarBadge()
    this.goodsDynamic()
    this.miaoshaGoods()
    const refreshIndex = wx.getStorageSync('refreshIndex')
    if (refreshIndex) {
      this.onPullDownRefresh()
      wx.removeStorageSync('refreshIndex')
    }
  },
  // 读取最近的成交信息，在首页轮播图中渲染：WXAPI.goodsDynamic
  async goodsDynamic(){
    const res = await WXAPI.goodsDynamic(0)
    if (res.code == 0) {
      this.setData({
        goodsDynamic: res.data
      })
    }
  },
  // 获取所有分类：WXAPI.goodsCategory
  async categories(){
    const res = await WXAPI.goodsCategory()
    let categories = [];
    if (res.code == 0) {
      const _categories = res.data.filter(ele => {
        return ele.level == 1
      })
      categories = categories.concat(_categories)
    }
    this.setData({
      categories: categories,
      curPage: 1
    });

    this.getGoodsList(0);  //参数0代表查找所有的商品
    this.getGoodsLess();
  },
  // 获取指定分类下的所有商品
  async getGoodsLess() {
    let goodsLessArr = []
    let numsPush = 0

    for(let j = 0; j < this.data.categories.length;j++){
      let arr = []
      let obj = {
        name: '',
        data: [],
        categoryId: 0
      }
      let cid = this.data.categories[j].id
      let cname = this.data.categories[j].name
      const res = await WXAPI.goodsv2({
        categoryId: cid
      })
      // console.log(res)
      if(res.code == 404 || res.code == 700){
        continue
      }
      obj.name = cname
      obj.categoryId = cid
      numsPush = Math.min(6, res.data.result.length)
      for(let i = 0; i < numsPush; i++){
        obj.data.push(res.data.result[i])
      }
      goodsLessArr.push(obj)
    }
    this.setData({
      goodsLess: goodsLessArr
    })
  },
  // 获取指定分类下的所有商品列表：WXAPI.goodsv2
  async getGoodsList(categoryId, append) {
    if (categoryId == 0) {
      categoryId = "";
    }
    wx.showLoading({
      "mask": true
    })
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.goodsv2({
      categoryId: categoryId,
      page: this.data.curPage,
      pageSize: this.data.pageSize
    })
    wx.hideLoading()
    if (res.code == 404 || res.code == 700) { // 错误；404-接口不存在；700-暂无数据
      let newData = {
        loadingMoreHidden: false
      }
      if (!append) {
        newData.goods = []
      }
      this.setData(newData);
      return
    }
    let goods = [];
    if (append) {
      goods = this.data.goods
    }
    for (var i = 0; i < res.data.result.length; i++) {
      goods.push(res.data.result[i]);
    }
    this.setData({
      loadingMoreHidden: true,
      goods: goods, //获得所有商品
    });
  },
  // 获取优惠券：WXAPI.coupons()
  getCoupons: function() {
    var that = this;
    WXAPI.coupons().then(function (res) {
      if (res.code == 0) {
        that.setData({
          coupons: res.data
        });
      }
    })
  },
  // 生命周期函数
  // 监听用户点击右上角菜单的「转发」按钮时触发的事件
  onShareAppMessage: function() {    
    return {
      title: '"' + wx.getStorageSync('mallName') + '" ' + wx.getStorageSync('share_profile'),
      path: '/pages/index/index?inviter_id=' + wx.getStorageSync('uid')   //跳转到邀请的用户（转发至的用户）的首页
    }
  },
  // 获取公告信息：WXAPI.noticeList
  getNotice: function() {
    var that = this;
    WXAPI.noticeList({pageSize: 5}).then(function (res) {
      if (res.code == 0) {
        that.setData({
          noticeList: res.data
        });
      }
    })
  },
  // 页面底部加载下一页
  onReachBottom: function() {
    this.setData({
      curPage: this.data.curPage + 1  //下一页
    });
    this.getGoodsList(0, true)  //获取下一页商品
  },
  // 声明周期函数：下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      curPage: 1
    });
    this.getGoodsList(0)
    wx.stopPullDownRefresh()
  },
  // 获取砍价商品：WXAPI.goodsv2(kanjia)
  async kanjiaGoods(){
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    const res = await WXAPI.goodsv2({
      kanjia: true
    });
    if (res.code == 0) {
      const kanjiaGoodsIds = []
      res.data.result.forEach(ele => {
        kanjiaGoodsIds.push(ele.id)
      })
      const goodsKanjiaSetRes = await WXAPI.kanjiaSet(kanjiaGoodsIds.join())
      if (goodsKanjiaSetRes.code == 0) {
        res.data.result.forEach(ele => {
          const _process = goodsKanjiaSetRes.data.find(_set => {
            return _set.goodsId == ele.id
          })
          if (_process) {
            ele.process = 100 * _process.numberBuy / _process.number
            ele.process = ele.process.toFixed(0)
          }
        })
        this.setData({
          kanjiaList: res.data.result
        })
      }
    }
  },
  // 前往优惠券页面，这里使用的函数是switchTab,因为是tabbar页面
  // goCoupons: function (e) {
  //   wx.switchTab({
  //     url: "/pages/coupons/index"
  //   })
  // },
  // 获取拼团商品：WXAPI.goodsv2(pingtuan)
  pingtuanGoods(){ 
    const _this = this
    // https://www.yuque.com/apifm/nu0f75/wg5t98
    WXAPI.goodsv2({
      pingtuan: true
    }).then(res => {
      if (res.code === 0) {
        _this.setData({
          pingtuanList: res.data.result
        })
      }
    })
  },
  // 前往搜索页面
  goSearch(){
    wx.navigateTo({
      url: '/pages/search/index'
    })
  },
  // 前往公告详情页面
  goNotice(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/notice/show?id=' + id,
    })
  },
  // 广告位管理，在CMS中有相应设置
  async adPosition() {
    let res = await WXAPI.adPosition('indexPop') // 广告位广告图
    if (res.code == 0) {
      this.setData({
        adPositionIndexPop: res.data
      })
    }
    res = await WXAPI.adPosition('index-live-pic') // 直播广告图
    if (res.code == 0) {
      this.setData({
        adPositionIndexLivePic: res.data
      })
    }
  },
  clickAdPositionIndexLive() {
    if (!this.data.adPositionIndexLivePic || !this.data.adPositionIndexLivePic.url) {
      return
    }
    wx.navigateTo({
      url: this.data.adPositionIndexLivePic.url,
    })
  },
  closeAdPositionIndexPop() {
    this.setData({
      adPositionIndexPop: null
    })
  },
  clickAdPositionIndexPop() {
    const adPositionIndexPop = this.data.adPositionIndexPop
    this.setData({
      adPositionIndexPop: null
    })
    if (!adPositionIndexPop || !adPositionIndexPop.url) {
      return
    }
    wx.navigateTo({
      url: adPositionIndexPop.url,
    })
  },
  async cmsCategories() {
    // https://www.yuque.com/apifm/nu0f75/slu10w
    const res = await WXAPI.cmsCategories()
    if (res.code == 0) {
      const cmsCategories = res.data.filter(ele => {
        return ele.type == 'index' // 只筛选类型为 index 的分类
      })
      this.setData({
        cmsCategories //ES6的简洁语法，如果key和value的值一样的话，只写一个就可以
      })
    }
  },
  // 处理点击更多事件
  handleMore(e){
    const category = this.data.categories.find(ele => {
      return ele.id == e.currentTarget.dataset.id
    })
    console.log(category)
    wx.setStorageSync("_categoryId", category.id)
    wx.switchTab({
      url: '/pages/category/category',
    })
  }
})

  // // 商品分类点击事件
  // tabClick(e) {
  //   const category = this.data.categories.find(ele => {
  //     return ele.id == e.currentTarget.dataset.id
  //   })
  //   if (category.vopCid1 || category.vopCid2) {
  //     wx.navigateTo({
  //       url: '/pages/goods/list-vop?cid1=' + (category.vopCid1 ? category.vopCid1 : '') + '&cid2=' + (category.vopCid2 ? category.vopCid2 : ''),
  //     })
  //   } else {
  //     wx.setStorageSync("_categoryId", category.id)
  //     wx.switchTab({
  //       url: '/pages/category/category',
  //     })
  //   }
  // },
