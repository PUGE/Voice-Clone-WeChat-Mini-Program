// index.js

Page({
  data: {
    openid: "",
    userID: "",
    audioPlayer: null,
    audioPath: null,
    recorder: null,
    countdown: 15,
    showModal: false,
    timer: null,
    tableData: [
    ]
  },
  onLoad() {
    // 登录
    wx.login({
      success: res => {
        if (res.code) {
          wx.request({
            url: 'https://user.lamp.run/getOpenId',
            method: 'POST',
            data: {
              code: res.code,
              appid: "wx714ee2ff68656092"
            },
            header: {
              'content-type': 'application/json'
            },
            success: res => {
              console.log('获取的 openid:', res.data.openid);
              this.setData({
                openid: res.data.openid,
                userID: res.data.userID
              });
              this.getUploadList()
              this.getOrderList()
            },
            fail: err => {
              console.error('请求失败:', err);
            }
          });
        }
      }
    });
    // 创建录音管理器
    this.recorder = wx.getRecorderManager();

    // 监听停止事件
    this.recorder.onStop((res) => {
      console.log('录音停止，临时路径为', res.tempFilePath);
      this.setData({
        audioPath: res.tempFilePath
      });
      this.formSubmit(res.tempFilePath)
    });
  },
  startRecording() {
    // 请求录音权限（仅首次需要）
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.showCountdown()
        this.recorder.start({
          duration: 15000, // 最长60秒
          sampleRate: 44100,
          numberOfChannels: 1,
          encodeBitRate: 192000,
          format: 'mp3' // 支持 mp3 或 aac
        });
        console.log('开始录音');
      },
      fail: () => {
        wx.showToast({
          title: '请授权录音权限',
          icon: 'none'
        });
      }
    });
  },
  formSubmit(filePath) {
    const that = this
    if (!filePath) {
      wx.showToast({ title: '请先录音', icon: 'none' });
      return;
    }

    // 上传录音文件
    wx.uploadFile({
      url: `https://cos.lamp.run/uploadFile?group=soundSynthesis&user=${this.data.userID}`, 
      filePath: filePath,
      name: 'file',
      formData: {
        "user": this.data.userID
      },
      success(res) {
        console.log('上传成功', res);
        wx.showToast({ title: '上传成功' });
        that.getUploadList()
      },
      fail(err) {
        console.error('上传失败', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  },
  showCountdown() {
    this.setData({
      countdown: 15,
      showModal: true,
    });

    const timer = setInterval(() => {
      let current = this.data.countdown;
      if (current <= 1) {
        clearInterval(this.data.timer);
        this.setData({
          showModal: false,
          countdown: 0,
        });
      } else {
        this.setData({
          countdown: current - 1
        });
      }
    }, 1000);

    this.setData({
      timer: timer
    });
  },

  stopCountdown() {
    clearInterval(this.data.timer);
    this.setData({
      showModal: false,
      countdown: 15
    });
    this.recorder.stop();
  },
  getOrderList() {
    wx.request({
      url: 'https://sound.lamp.run/getJob',
      method: 'POST',
      data: {
        user: this.data.userID
      },
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        console.log('请求成功：', res.data);
        // 这里可以处理响应数据
      },
      fail(err) {
        console.error('请求失败：', err);
      }
    });
    
  },
  getUploadList() {
    const that = this
    wx.request({
      url: `https://cos.lamp.run/uploadFileList?group=soundSynthesis&user=${this.data.userID}`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        console.log('请求成功：', res.data);
        // 这里可以处理响应数据
        function padZero(n) {
          return n < 10 ? '0' + n : n;
        }
        function formatTime(timestamp) {
          const date = new Date(timestamp); // 支持10位（需 *1000）或13位时间戳
          const Y = date.getFullYear();
          const M = padZero(date.getMonth() + 1);
          const D = padZero(date.getDate());
          const h = padZero(date.getHours());
          const m = padZero(date.getMinutes());
          const s = padZero(date.getSeconds());
          return `${Y}-${M}-${D} ${h}:${m}:${s}`;
        }
        res.data.result.forEach(element => {
          element.uploadTime = formatTime(element.uploadTime * 1000)
        });
        that.setData({
          "tableData": res.data.result
        });
      },
      fail(err) {
        console.error('请求失败：', err);
      }
    });
    
  },
  playMusic(e) {
    if (!this.audioPlayer) {
      // 创建并复用播放器实例
      this.audioPlayer = wx.createInnerAudioContext();
      this.audioPlayer.obeyMuteSwitch = false;
      this.audioPlayer.onPlay(() => {
        console.log("开始播放");
      });
  
      this.audioPlayer.onEnded(() => {
        console.log("播放完毕");
      });
  
      this.audioPlayer.onError((err) => {
        console.error("播放错误：", err.errMsg);
      });
    }
    const url = e.currentTarget.dataset.url
    // 先停止，避免正在播放的被中断
    this.audioPlayer.stop();

    // 重新设置 src（即使相同也设置一次，确保能重新加载）
    this.audioPlayer.src = "https://cunchu.site/" + url;
    console.log(`播放音乐:${this.audioPlayer.src}`)
    // 重新播放
    this.audioPlayer.play();
  }
})
