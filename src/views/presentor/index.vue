<template>
  <div class="page-live flex justify-center">
    <div class="container-video flex justify-center flex-col items-center bg-black p-2 relative radius" style="overflow: hidden;">

      <video id="video" :src="src" class="" ref="video" autoplay
        poster="@/assets/webrtc.png" muted
      ></video>
      <div class="living-controls-wrapper mt-2 flex w-full items-center">
        <span class="text-white mr-auto">状态: {{statusText}}</span>
        <!-- <el-input v-model="liveDesc" class="live-input" placeholder="请输入直播号" size="mini"></el-input> -->
        <el-button type="primary" @click="setVideo">播放影片</el-button>
        <el-button type="primary" @click="start" v-if="status=='initial'">开始直播</el-button>
        <el-button type="danger" class="ml-3" @click="stop" v-else-if="status!='starting'">停止直播</el-button>
      </div>
    </div>
    <div class="container-message rounded ml-4 flex flex-col justify-between bg-gray-200 radius">
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
            <span class="interaction-text">{{message.user.nickname}}:</span>
            <span class="interaction-text">{{message.msg}}</span>
          </div>
        </template>
      </div>
      <div class="wrapper-input mx-auto p-2" v-if="true" radius>
        <input v-model="msg" type="text" class="border h-8 rounded">
        <el-button  @click="send" placeholder="输入发送内容" size="small" type="warning" style="margin-left: 5px;">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import Presentor from './presentor'
import { getMyLive } from '@/api'
let presentor = null

export default {
  name: 'page-presentor',
  data () {
    return {
      src: null, // 'http://vt1.doubanio.com/201903181816/4191665522bbfd3a842c307fd67f0b25/view/movie/M/402410829.mp4',
      status: 'initial',
      liveId: null,
      interactions: [
        // {
        //   user: 111,
        //   msg: '111',
        //   time: '****'
        // }
      ],
      msg: '',
      messages: [
        // {
        //   type: 'start'
        // },
        // {
        //   type: 'stop'
        // },
        // {
        //   type: 'viewer-entry',
        //   from: { nickname: '虚幻', avatar: 'https://via.placeholder.com/150' },
        //   time: '12:12:12'
        // },
        // {
        //   type: 'viewer-leave',
        //   from: { nickname: '虚幻', avatar: 'https://via.placeholder.com/150' },
        //   time: '12:12:12'
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
    async start () {
      // this.status = 'starting'
      // presentor = new Presentor(this.$refs.video)
      // console.log(presentor)
      // presentor.on('start', () => {
      //   this.status = 'living'
      //   this.messages.push({
      //     type: 'start'
      //   })
      // })
      // presentor.on('error', error => {
      //   console.log(error)
      //   this.stop()
      // })
      // presentor.on('message', message => {
      //   console.log('received message:', message)
      //   this.messages.push(message)
      // })
      // presentor.start()
      const { data } = await getMyLive()
      if (data && data.id) {
        this.liveId = data.id
      }
      if (!this.liveId) {
        this.$message.error('您还未开通直播间');
        return;
      }
      RtcUtils.video = document.getElementById('video');
      RtcUtils.videoOutput = document.getElementById('video2');
      localStorage.setItem("liveId", this.liveId)
      RtcUtils.presenter()
    },
    setVideo(){
      var video = document.getElementById("video");
      if (!this.src){
        this.src = "@/assets/test.mp4"
      }
      video.play();
      video.parsed = false
    },
    init() {
      var vm = this
      RtcUtils.init();
      RtcUtils.notice.on('living', function () {
        vm.status = 'living'
        vm.interactions.push({
          type: 'start'
        })
      })
      RtcUtils.notice.on('interactionAdd', function (data) {
        vm.interactions.push(data);
        RtcUtils.wordMove(data.msg);
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
      RtcUtils.stop()
      this.status = 'initial'
      this.interactions.push({
        type: 'stop'
      })
    }
  },
  mounted() {
    this.init();
  }
}
</script>

<style lang="less" scoped>
.page-live {
  height: 540px;
  max-height: 540px;
  .wrapper-messages {
    height: 500px;
  }
  .container-video {
    // height: 540px;
    // width: 660px;
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
.live-input{
  margin-right: 25px;
  width: 30%;
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
