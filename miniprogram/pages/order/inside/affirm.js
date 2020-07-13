const app = getApp()
const db = wx.cloud.database()
const tools = require('../../../utils/tools.js')

Page({
  data: {
    config: {},
    cur_table: '',
    menu_ids: [],
    menu_data: {},
    order_list: [],
    seat_count: 0,
    seat_price: 0,
    order_remark: '',
    pack_money: 0,
    total_money: 0,
    payable_money: 0,
    remark: {
      index: null,
      dialog: false,
      content: '',
      keyword: [],
      buttons: [{
        text: '取消'
      },{
        text: '确认'
      }]
    }
  },
  onLoad(options) {
    let self = this
    let config = app.globalData.config
    self.setData({
      config: config,
      seat_count: config.inside.seat.count,
      seat_price: config.inside.seat.price,
      'remark.keyword': tools.toArray(config.inside.remark_items)
    })
    self.init()
  },
  init() {
    let self = this
    let table = wx.getStorageSync('cur_table')
    let order_list = wx.getStorageSync('temp_inside')
    let menu_data = app.globalData.rt_data.menu_data
    let menu_remain = app.globalData.rt_data.menu_remain
    let temp_list = []
    let menu_ids = []
    let menu_count = {}
    order_list.forEach(item1 => {
      let amount = item1.amount
      if (item1.type == 'combo') {
        let isOk = true
        item1.form.combo.forEach(item2 => {
          item2.forEach(item3 => {
            if (menu_remain.hasOwnProperty(item3.id)) {
              if (menu_count[item3.id]) {
                if (menu_remain[item3.id] < menu_count[item3.id] + amount) {
                  isOk = false
                }
              } else {
                if (menu_remain[item3.id] < amount) {
                  isOk = false
                }
              }
            }
          })
        })
        if (isOk) {
          if (menu_remain.hasOwnProperty(item1.id)) {
            if (menu_count[item1.id]) {
              if (menu_remain[item1.id] < menu_count[item1.id] + amount) {
                isOk = false
              }
            } else {
              if (menu_remain[item1.id] < amount) {
                isOk = false
              }
            }
          }
          if (isOk) {
            item1.form.combo.forEach(item2 => {
              item2.forEach(item3 => {
                if (menu_count[item3.id]) {
                  menu_count[item3.id] += amount
                } else {
                  menu_count[item3.id] = amount
                }
                menu_ids.push(item3.id)
              })
            })
            if (menu_count[item1.id]) {
              menu_count[item1.id] += amount
            } else {
              menu_count[item1.id] = amount
            }
            menu_ids.push(item1.id)
            temp_list.push(item1)
          }
        }
      } else {
        let isOk = true
        if (menu_remain.hasOwnProperty(item1.id)) {
          if (menu_count[item1.id]) {
            if (menu_remain[item1.id] < menu_count[item1.id] + amount) {
              isOk = false
            }
          } else {
            if (menu_remain[item1.id] < amount) {
              isOk = false
            }
          }
        }
        if (isOk) {
          if (menu_count[item1.id]) {
            menu_count[item1.id] += amount
          } else {
            menu_count[item1.id] = amount
          }
          menu_ids.push(item1.id)
          temp_list.push(item1)
        }
      }
    })
    self.setData({
      cur_table: table,
      menu_data: menu_data,
      order_list: temp_list,
      menu_ids: menu_ids
    })
    wx.setStorage({
      key: 'temp_inside',
      data: temp_list
    })
    self.statTotal()
  },
  statTotal() {
    let self = this
    let pack_money = 0
    let total_money = 0
    let payable_money = 0
    self.data.order_list.forEach(item => {
      let menu = self.data.menu_data[item.id]
      let price = 0
      if (item.type == 'vary') {
        price = item.form.price
      } else {
        price = menu.price
        if (item.form.raise) {
          price += item.form.raise
        }
      }
      if (item.form.pack) {
        if (menu.pack.mode == 'every') {
          pack_money += menu.pack.money * item.amount
        } else {
          pack_money += menu.pack.money
        }
      }
      total_money += price * item.amount
    })
    total_money += pack_money
    total_money += self.data.seat_price * self.data.seat_count
    payable_money = total_money
    self.setData({
      pack_money: pack_money,
      total_money: total_money,
      payable_money: payable_money
    })
  },
  addSeat() {
    let self = this
    self.setData({
      seat_count: ++self.data.seat_count
    })
    self.statTotal()
  },
  subSeat() {
    let self = this
    if (self.data.seat_count > 0) {
      self.setData({
        seat_count: --self.data.seat_count
      })
    }
    self.statTotal()
  },
  showRemark(e) {
    let self = this
    let index = e.currentTarget.dataset.index
    if (index == undefined) {
      self.setData({
        'remark.dialog': true,
        'remark.index': null,
        'remark.content': self.data.order_remark
      })
    } else {
      let item = self.data.order_list[index]
      self.setData({
        'remark.dialog': true,
        'remark.index': index,
        'remark.content': item.remark ? item.remark : ''
      })
    }
  },
  inputRemark(e) {
    this.setData({
      'remark.content': e.detail.value
    })
  },
  tagRemark(e) {
    let self = this
    let content = self.data.remark.content
    if (content.endsWith(' ')) {
      content += e.currentTarget.dataset.value
    } else {
      content += ' ' + e.currentTarget.dataset.value
    }
    self.setData({
      'remark.content': content
    })
  },
  tapRemark(e) {
    let self = this
    if (e.detail.index == 0) {
      self.setData({
        'remark.dialog': false
      })
    } else {
      let index = self.data.remark.index
      if (index == null) {
        self.setData({
          'remark.dialog': false,
          order_remark: self.data.remark.content
        })
      } else {
        let list = self.data.order_list
        let item = list[self.data.remark.index]
        item.remark = self.data.remark.content
        self.setData({
          'remark.dialog': false,
          order_list: list
        })
      }
    }
  },
  submitForm() {
    let self = this
    if (self.data.order_list.length == 0) {
      wx.showModal({
        title: '操作提示',
        content: '您选择的菜品已售罄，请重新选择菜品！',
        success(res) {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
      return
    }
    wx.showLoading({
      title: '正在提交',
      mask: true
    })
    if (!self.data.hold) {
      self.data.hold = true
      wx.cloud.callFunction({
        name: 'inside_order',
        data: {
          action: 'create_active',
          data: {
            mode: 'arrival',
            table: self.data.cur_table,
            list: self.data.order_list,
            remark: self.data.order_remark,
            seat_count: self.data.seat_count,
            menu_ids: self.data.menu_ids
          }
        }
      }).then(res => {
        self.data.hold = false
        let order = res.result.order
        if (res.result && res.result.errcode == 0) {
          try {
            db.collection('menu_assist').where({
              master: app.globalData.identity.uid
            }).remove()
            wx.removeStorage({
              key: 'temp_inside'
            })
          } catch (error) {}
          if (self.data.config.inside.arrival.payment) {
            self.payment(order)
          } else {
            wx.redirectTo({
              url: 'detail?id=' + order.order_id
            })
          }
        } else {
          wx.showToast({
            title: '系统繁忙',
            icon: 'none',
            duration: 2000
          })
        }
      }).catch(err => {
        wx.showToast({
          title: '系统繁忙',
          icon: 'none',
          duration: 2000
        })
      })
    }
  },
  payment(order) {
    let self = this
    wx.showLoading({
      title: '正在支付'
    })
    wx.cloud.callFunction({
      name: 'inside_order',
      data: {
        action: 'payment',
        id: order.order_id
      }
    }).then(res => {
      if (res.result && res.result.errcode == 0) {
        let payment = res.result.payment
        let payment_id = res.result.payment_id
        wx.requestPayment({
          timeStamp: payment.timeStamp,
          nonceStr: payment.nonceStr,
          package: payment.package,
          signType: payment.signType,
          paySign: payment.paySign,
          success(res) {
            wx.cloud.callFunction({
              name: 'inside_order',
              data: {
                action: 'payment_success',
                payment_id: payment_id
              }
            })
            let config = self.data.config
            if (config.inside.notify.active) {
              wx.hideLoading()
              wx.requestSubscribeMessage({
                tmplIds: [config.inside.notify.template.success, config.inside.notify.template.cancel, config.inside.notify.template.finish],
                success(res) {
                  wx.redirectTo({
                    url: 'detail?id=' + order.order_id
                  })
                },
                fail(err) {
                  wx.redirectTo({
                    url: 'detail?id=' + order.order_id
                  })
                }
              })
            } else {
              setTimeout(() => {
                wx.redirectTo({
                  url: 'detail?id=' + order.order_id
                })
              }, 2000)
            }
          },
          fail(res) {
            wx.showToast({
              title: '支付中止',
              icon: 'none',
              duration: 2000
            })
            setTimeout(() => {
              wx.redirectTo({
                url: 'detail?id=' + order.order_id
              })
            }, 2000)
          }
        })
      } else {
        wx.showToast({
          title: '系统繁忙',
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => {
          wx.redirectTo({
            url: 'detail?id=' + order.order_id
          })
        }, 2000)
      }
    }).catch(err => {
      wx.showToast({
        title: '系统繁忙',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.redirectTo({
          url: 'detail?id=' + order.order_id
        })
      }, 2000)
    })
  }
})