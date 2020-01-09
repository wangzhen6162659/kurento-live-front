<template>
  <div class="page-live flex justify-center">
    <div class="container-video flex justify-center flex-col p-2 items-center bg-black relative radius" style="overflow: hidden;">
      <video id="video" :src="src" class="video w-full m-2" ref="video" autoplay
        poster="@/assets/webrtc.png"
      ></video>
      <div class="living-controls-wrapper m-1 pl-2 flex w-full items-center">
        <span class="text-white mr-auto">状态: {{statusText}}</span>
      </div>
    </div>
    <div class="container-message w-68 rounded ml-4 flex flex-col justify-between bg-gray-200 radius">
      <div class="wrapper-messages bg-gray-100 border p-2 overflow-y-auto radius">
        <template v-for="message in interactions">
          <div class="message-item flex justify-center py-1 items-center mb-2 text-sm bg-gray-500 text-center rounded-full"
               :key="message.id" v-if="message.type == 'start'">
            <span class="font-bold mr-1 text-yellow-300">直播已开始</span>
          </div>
          <div class="message-item flex justify-center py-1 items-center mb-2 text-sm bg-gray-500 text-center rounded-full"
               :key="message.id" v-if="message.type == 'viewer-entry'">
            <span>{{message.time}}</span>
            <img :src="message.from.avatar" alt="" class="w-6 mx-1 rounded-full">
            <span class="font-bold mr-1 text-blue-600">{{message.from.nickname}}</span>
            <span>已 <b>进入</b> 直播间</span>
          </div>
          <div class="message-item flex justify-center py-1 items-center mb-2 text-sm bg-red-300 text-center interaction-text-box"
               :key="message.id" v-if="message.type == 'viewer-leave'">
            <span>{{message.time}}</span>
            <img :src="message.from.avatar" alt="" class="w-6 mx-1 rounded-full">
            <span class="font-bold mr-1 text-blue-900">{{message.from.nickname}}</span>
            <span>已 <b>离开</b> 直播间</span>
          </div>
          <div class="message-item flex justify-center py-1 items-center mb-2 text-sm bg-red-600 text-center rounded-full"
               :key="message.id" v-if="message.type == 'stop'">
            <span class="font-bold mr-1 text-blue-900">直播已结束</span>
          </div>
          <div class="interaction-text-box"
               :key="message.id" v-if="message.type == 'interaction'">
            <span class="interaction-text">{{message.user}}:</span>
            <span class="interaction-text">{{message.msg}}</span>
          </div>
        </template>
      </div>
      <div class="wrapper-input mx-auto p-2" v-if="true" >
        <input v-model="msg" type="text" class="border h-8 rounded">
        <el-button  @click="send" placeholder="输入发送内容" size="small" type="warning" style="margin-left: 5px;">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import Viewer from './viewer'

let viewer = null

export default {
  name: 'page-live',
  data () {
    return {
      src: null, // 'http://vt1.doubanio.com/201903181816/4191665522bbfd3a842c307fd67f0b25/view/movie/M/402410829.mp4',
      status: 'initial',
      msg: '',
      isInit: false,
      interactions: [
        // {
        //   token: 111,
        //   msg: '111',
        //   time: '****'
        // }
      ]
    }
  },
  computed: {
    statusText () {
      const text = {
        initial: '未开始',
        starting: '准备中',
        living: '直播中',
        ending: '结束中',
        ended: '已结束'
      }
      return text[this.status]
    }
  },
  created () {
    window.addEventListener('unload', () => {
      this.stop()
    })
  },
  beforeDestroy () {
    console.log('before destroy')
    this.stop()
  },
  methods: {
    start () {
      var liveId = this.$route.params.liveId;
      RtcUtils.video = document.getElementById('video');
      localStorage.setItem("liveId", liveId)
      RtcUtils.viewer()
    },
    init () {
      var vm = this;
      RtcUtils.init();
      RtcUtils.notice.on('living', function () {
        vm.status = 'living'
        vm.interactions.push({
          type: 'start'
        })
      })
      RtcUtils.notice.on('interactionAdd', function (data) {
        vm.interactions.push(data);
        console.log(vm.interactions);
        RtcUtils.wordMove(data.msg);
      })
      RtcUtils.notice.on('stop', function (data) {
        vm.status = 'ended'
        vm.interactions.push({
          type: 'stop'
        })
      })
    },
    send () {
      if (!this.msg){
        return
      }
      RtcUtils.interaction(this.msg);
      this.msg = '';
    },
    stop () {
      RtcUtils.stop();
      this.status = 'initial';
    }
  },
  mounted() {
    this.start();
    this.init();
  }
}
</script>

<style lang="less" scoped>
.page-live {
  .wrapper-messages {
    height: 500px;
  }
  .container-video {
    // height: 520px;
    width: 660px;
    // video.video::-webkit-media-controls {
    //   position: absolute;
    //   bottom: 0;
    //   left: 0;
    //   right: 0;
    //   z-index: 5;
    //   width: 100%;
    //   height: 100px;
    // }
  }
}
.interaction-text {
  word-break: break-all;
}
.interaction-text-box {
  border-radius: 6px;
  background-color: #e9ebec;
  margin-bottom: 6px;
}
.toolbar-video{
  top: 90%;
  width: 85%;
  position: absolute;
}
.radius{
  border-radius: 10px;
}
/deep/.tm {
  user-select: none;
  position: absolute;
  white-space: pre;
  pointer-events: none;
  perspective: 500px;
  display: inline-block;
  will-change: transform;
  font-size: 25px;
  color: rgb(255, 255, 255);
  font-family: SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif;
  font-weight: bold;
  line-height: 1.125;
  opacity: 1;
  text-shadow: rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px;
  left: 50%;
  top: 0px;
}
</style>
