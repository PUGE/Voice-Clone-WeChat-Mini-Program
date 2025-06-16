// index.js

Page({
  data: {
    openid: "",
    audioPath: null,
    recorder: null,
    innerAudioContext: null,
  },
  onLoad() {
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
                openid: res.data.openid
              });
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
    });

    // 创建音频播放对象
    this.innerAudioContext = wx.createInnerAudioContext();
  },

  startRecording() {
    // 请求录音权限（仅首次需要）
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorder.start({
          duration: 60000, // 最长60秒
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

  stopRecording() {
    this.recorder.stop();
  },

  playRecording() {
    if (this.data.audioPath) {
      this.innerAudioContext.src = this.data.audioPath;
      this.innerAudioContext.play();
    }
  },

  onUnload() {
    this.innerAudioContext.destroy();
  }
})
