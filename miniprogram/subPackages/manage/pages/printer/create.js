const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    form: {
      name: '',
      provider: 'yly',
      model: '',
      code: '',
      hint: 'buzzer',
      voice: 2,
      note: '',
      priority: 0
    },
    models: {},
    rules: [{
      name: 'model',
      rules: [{
        required: true,
        message: '设备机型是必选项'
      }]
    }, {
      name: 'code',
      rules: [{
        required: true,
        message: '设备号码是必填项'
      }]
    }, {
      name: 'name',
      rules: [{
        required: true,
        message: '备注名称是必填项'
      }]
    }, {
      name: 'priority',
      rules: [{
        range: [0, 999],
        message: '优先级别的范围0~999'
      }]
    }],
    provider: {
      index: 0,
      options: [{
        value: 'yly',
        name: '易联云'
      }]
    },
    model: {
      index: -1,
      options: [
        [{
          value: 'K4',
          name: 'Eprt K4'
        }, {
          value: 'K5',
          name: 'Eprt K5'
        }, {
          value: 'K6',
          name: 'Eprt K6'
        }, {
          value: 'W1',
          name: 'Eprt W1'
        }, {
          value: 'M1',
          name: 'Eprt M1'
        }]
      ]
    }
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
    let value = e.detail.value
    if (/^[0-9]*$/.test(value)) {
      self.setData({
        [e.currentTarget.dataset.field]: Number(value)
      })
    }
    if (e.currentTarget.dataset.rule) {
      self.setData({
        [e.currentTarget.dataset.rule]: value
      })
    }
  },
  providerChange(e) {
    let self = this
    let index = e.detail.value
    self.setData({
      'model.index': -1,
      'form.model': '',
      'provider.index': index,
      'form.provider': self.data.provider.options[index].value
    })
  },
  modelChange(e) {
    let self = this
    let index = e.detail.value
    let model = self.data.model.options[self.data.provider.index][index].value
    self.setData({
      'model.index': index,
      'form.model': model,
      'models.model': model
    })
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
        data.create_sid = app.globalData.identity.staff._id
        data.create_time = db.serverDate()
        wx.showLoading({
          title: '正在保存',
          mask: true
        })
        db.collection('printer').add({
          data: data
        }).then(res=>{
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          })
          setTimeout(function () {
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