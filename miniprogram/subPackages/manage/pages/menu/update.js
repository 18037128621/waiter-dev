const app = getApp()
const db = wx.cloud.database()
const tools = require('../../../../utils/tools.js')
const uuid = require('../../../../utils/uuid.js')

Page({
  data: {
    config: null,
    detail: null,
    form: {
      cover: '',
      name: '',
      alias: '',
      type: 'single',
      column: {
        inside: [],
        outside: [],
      },
      intro: '',
      price: 0,
      price2: 0,
      statistics: {
        sales: 0
      },
      pack: {
        mode: 'every',
        money: 0
      },
      model: {
        active: false,
        list: []
      },
      option: {
        active: false,
        list: []
      },
      scope: [],
      note: '',
      visible: false,
      priority: 0,
      kitchen: '',
      sku: {
        active: false,
        count: 0,
        total: 0
      }
    },
    models: {},
    rules: [{
      name: 'name',
      rules: [{
        required: true,
        message: '菜品名称是必填项'
      }]
    }, {
      name: 'priority',
      rules: [{
        range: [0, 999],
        message: '优先级别的范围0~999'
      }]
    }],
    column: [],
    pack: {
      index: 0,
      options: [{
        value: 'every',
        name: '每份加收'
      }, {
        value: 'unlimit',
        name: '不限数量'
      }]
    },
    kitchen: {
      index: 0,
      options: [{
        name: '未指定厨房',
        value: ''
      }]
    }
  },
  onLoad() {
    let self = this
    let detail = tools.objCopy(app.globalData.temp_data)
    let column = app.globalData.rt_data.column.map(item => {
      return {
        name: item.name,
        value: item._id,
        scope: item.scope
      }
    })
    let kitchen_index = 0
    let kitchen_options = self.data.kitchen.options
    app.globalData.rt_data.kitchen.forEach((item, index) => {
      kitchen_options.push({
        name: item.name,
        value: item._id
      })
      if (item._id == detail.kitchen) {
        kitchen_index = index + 1
      }
    })
    let pack_index = 0
    let pack = tools.objCopy(detail.pack)
    pack.money = pack.money / 100
    self.data.pack.options.forEach((item, index) => {
      if (item.value == pack.mode) {
        pack_index = index
      }
    })
    self.setData({
      detail: detail,
      column: column,
      config: app.globalData.config,
      'form.cover': detail.cover,
      'form.name': detail.name,
      'form.alias': detail.alias,
      'form.type': detail.type,
      'form.column': tools.objCopy(detail.column),
      'form.intro': detail.intro,
      'form.price': detail.price / 100,
      'form.price2': detail.price2 / 100,
      'form.statistics': tools.objCopy(detail.statistics),
      'form.pack': pack,
      'form.model': tools.objCopy(detail.model),
      'form.option': tools.objCopy(detail.option),
      'form.scope': tools.objCopy(detail.scope),
      'form.visible': detail.visible,
      'form.note': detail.note,
      'form.priority': detail.priority,
      'form.kitchen': detail.kitchen,
      'pack.index': pack_index,
      'kitchen.index': kitchen_index,
      'kitchen.options': kitchen_options,
      'models.name': detail.name,
      'models.priority': detail.priority
    })
  },
  inputChange(e) {
    let self = this
    if (e.currentTarget.dataset.rule) {
      self.setData({
        [e.currentTarget.dataset.rule]: e.detail.value,
        [e.currentTarget.dataset.field]: e.detail.value
      })
    } else {
      self.setData({
        [e.currentTarget.dataset.field]: e.detail.value
      })
    }
  },
  inputNumber(e) {
    let self = this
    if (e.currentTarget.dataset.rule) {
      self.setData({
        [e.currentTarget.dataset.rule]: e.detail.value,
        [e.currentTarget.dataset.field]: Number(e.detail.value)
      })
    } else {
      self.setData({
        [e.currentTarget.dataset.field]: Number(e.detail.value)
      })
    }
  },
  inputDigit(e) {
    let self = this
    let value = e.detail.value
    if (value.charAt(value.length - 1) != '.') {
      if (e.currentTarget.dataset.rule) {
        self.setData({
          [e.currentTarget.dataset.rule]: e.detail.value,
          [e.currentTarget.dataset.field]: Number(value)
        })
      } else {
        self.setData({
          [e.currentTarget.dataset.field]: Number(value)
        })
      }
    } else {
      if (e.currentTarget.dataset.rule) {
        self.setData({
          [e.currentTarget.dataset.rule]: e.detail.value
        })
      }
    }
  },
  focusTextarea(e) {
    this.setData({
      [e.currentTarget.dataset.focus]: true
    })
  },
  blurTextarea(e) {
    this.setData({
      [e.currentTarget.dataset.focus]: false
    })
  },
  modelChange(e) {
    this.setData({
      'form.model.active': e.detail.active,
      'form.model.list': e.detail.list
    })
  },
  optionChange(e) {
    this.setData({
      'form.option.active': e.detail.active,
      'form.option.list': e.detail.list
    })
  },
  switchChange(e) {
    this.setData({
      [e.currentTarget.dataset.field]: e.detail.value
    })
  },
  scopeChange(e) {
    this.setData({
      'form.scope': e.detail.value
    })
  },
  coverChange() {
    let self = this
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        let temp = res.tempFilePaths[0]
        wx.showLoading({
          title: '正在上传',
          mask: true
        })
        let suffix = temp.substring(temp.lastIndexOf('.'), temp.length)
        wx.cloud.uploadFile({
          cloudPath: uuid.v1() + suffix,
          filePath: temp,
          success: res => {
            self.setData({
              'form.cover': res.fileID
            })
            wx.hideLoading()
          }
        })
      }
    })
  },
  packChange(e) {
    let self = this
    self.setData({
      'pack.index': e.detail.value,
      'form.pack.mode': self.data.pack.options[e.detail.value].value
    })
  },
  kitchenChange(e) {
    let self = this
    self.setData({
      'kitchen.index': e.detail.value,
      'form.kitchen': self.data.kitchen.options[e.detail.value].value
    })
  },
  columnChange(e) {
    let self = this
    if (e.detail.scope == 'inside') {
      self.setData({
        'form.column.inside': e.detail.value
      })
    } else {
      self.setData({
        'form.column.outside': e.detail.value
      })
    }
  },
  submitForm(e) {
    let self = this
    self.selectComponent('#form').validate((valid, errors) => {
      if (!valid) {
        const firstError = Object.keys(errors)
        if (firstError.length) {
          self.setData({
            error: errors[firstError[0]].message
          })
        }
      } else {
        let data = self.data.form
        data.price = parseInt(data.price * 100)
        data.price2 = parseInt(data.price2 * 100)
        data.pack.money = parseInt(data.pack.money * 100)
        data.update_sid = app.globalData.identity.staff._id
        data.update_time = db.serverDate()
        wx.showLoading({
          title: '正在保存',
          mask: true
        })
        db.collection('menu').doc(self.data.detail._id).update({
          data: data
        }).then(res=>{
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function() {
            wx.navigateBack()
          }, 2000)
          app.globalData.update = true
        }).catch(err=>{
          wx.showToast({
            title: '系统繁忙',
            icon: 'none',
            duration: 2000
          })
        })
      }
    })
  }
})