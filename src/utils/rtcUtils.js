import { iceServers } from '@/config/webrtc'
import kurentoUtils from 'kurento-utils'
import { getNewSocket } from '@/socket'
var EventEmitter = require('events').EventEmitter

window.setRtcUtils = function () {
  // that = this
  var RtcUtils = {}
  RtcUtils.notice = new EventEmitter();
  RtcUtils.hostname = this.window.location.hostname
  RtcUtils.ws = new WebSocket('wss://' + RtcUtils.hostname + '/websocket/socketServer');
  RtcUtils.video
  RtcUtils.webRtcPeer = null
  RtcUtils.iceservers={
    "iceServers":[
      {
        urls:"turn:106.54.254.212:3478",
        username:"kurento",
        credential: "kurento"
      }
    ]
  }
  RtcUtils.constraints = {
    audio: true,
    video: {
      width: 720,
      height: 480,
      framerate: 1024
    }
  }

  RtcUtils.ws.onmessage = function(message) {
    var parsedMessage = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (parsedMessage.id) {
      case 'presenterResponse':
        RtcUtils.presenterResponse(parsedMessage);
        RtcUtils.notice.emit('living', 1)
        break;
      case 'viewerResponse':
        RtcUtils.viewerResponse(parsedMessage);
        RtcUtils.notice.emit('living', 1)
        break;
      case 'iceCandidate':
        RtcUtils.webRtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
          if (error)
            return console.error('Error adding candidate: ' + error);
        });
        break;
      case 'stopCommunication':
        RtcUtils.dispose();
        break;
      case 'interactionResponse':
        RtcUtils.notice.emit('interactionAdd', parsedMessage);
        break;
      default:
        console.error('Unrecognized message', parsedMessage);
    }
  }

  RtcUtils.onload = function() {
    console = new Console();
    RtcUtils.video = document.getElementById('video');
    RtcUtils.disableStopButton();
  }

  RtcUtils.onbeforeunload = function() {
    RtcUtils.ws.close();
  }
  RtcUtils.presenterResponse = function(message) {
    var that = this
    if (message.response != 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknow error';
      console.info('Call not accepted for the following reason: ' + errorMsg);
      that.dispose();
    } else {
      that.webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
        if (error)
          return console.error(error);
      });
    }
  }

  RtcUtils.viewerResponse = function(message) {
    var that = this
    if (message.response != 'accepted') {
      var errorMsg = message.message ? message.message : 'Unknow error';
      console.info('Call not accepted for the following reason: ' + errorMsg);
      RtcUtils.dispose();
    } else {
      that.webRtcPeer.processAnswer(message.sdpAnswer, function(error) {
        if (error)
          return console.error(error);
      });
    }
  }

  RtcUtils.presenter = function() {
    if (!RtcUtils.isHaveRoomId()){
      return
    }
    if (!RtcUtils.webRtcPeer) {
      RtcUtils.showSpinner(RtcUtils.video);

      var that = this
      var options = {
        localVideo : RtcUtils.video,
        onicecandidate : RtcUtils.onIceCandidate,
        configuration: RtcUtils.iceservers,
        mediaConstraints: RtcUtils.constraints
      }
      RtcUtils.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
        function(error) {
          if (error) {
            return console.error(error);
          }
          that.webRtcPeer.generateOffer(that.onOfferPresenter);
        });

      RtcUtils.enableStopButton();
    }
  }

  RtcUtils.onOfferPresenter = function(error, offerSdp) {
    if (error)
      return console.error('Error generating the offer');
    console.info('Invoking SDP offer callback ' + location.host);
    var message = {
      id : 'presenter',
      sdpOffer : offerSdp
    }
    RtcUtils.sendMessage(message);
  }

  RtcUtils.viewer = function(){
    if (!RtcUtils.isHaveRoomId()){
      return
    }
    if (!RtcUtils.webRtcPeer) {


      var options = {
        remoteVideo : RtcUtils.video,
        onicecandidate : RtcUtils.onIceCandidate,
        configuration: RtcUtils.iceservers,
        mediaConstraints: RtcUtils.constraints
      }
      RtcUtils.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error) {
          if (error) {
            return console.error(error);
          }
          this.generateOffer(RtcUtils.onOfferViewer);
        });

      RtcUtils.enableStopButton();
    }
  }

  RtcUtils.onOfferViewer = function (error, offerSdp) {
    if (error)
      return console.error('Error generating the offer');
    console.info('Invoking SDP offer callback ' + location.host);
    var message = {
      id : 'viewer',
      sdpOffer : offerSdp
    }
    RtcUtils.sendMessage(message);
  }

  RtcUtils.onIceCandidate = function (candidate) {
    console.log("Local candidate" + JSON.stringify(candidate));

    var message = {
      id : 'onIceCandidate',
      candidate : candidate
    };

    RtcUtils.sendMessage(message);
  }

  RtcUtils.stop = function () {
    var message = {
      id : 'stop'
    }
    RtcUtils.sendMessage(message);
    RtcUtils.dispose();
  }

  RtcUtils.dispose = function () {
    if (RtcUtils.webRtcPeer) {
      RtcUtils.webRtcPeer.dispose();
      RtcUtils.webRtcPeer = null;
    }
    RtcUtils.hideSpinner(RtcUtils.video);
    RtcUtils.notice.emit('stop')

    RtcUtils.disableStopButton();
  }

  RtcUtils.disableStopButton = function() {
    RtcUtils.enableButton('#presenter', 'presenter()');
    RtcUtils.enableButton('#viewer', 'viewer()');
    RtcUtils.disableButton('#stop');
  }

  RtcUtils.enableStopButton = function () {
    RtcUtils.disableButton('#presenter');
    RtcUtils.disableButton('#viewer');
    RtcUtils.enableButton('#stop', 'stop()');
  }

  RtcUtils.disableButton = function (id) {
    $(id).attr('disabled', true);
    $(id).removeAttr('onclick');
  }

  RtcUtils.enableButton = function (id, functionName) {
    $(id).attr('disabled', false);
    $(id).attr('onclick', functionName);
  }

  RtcUtils.isHaveRoomId = function () {
    if (!RtcUtils.getRoomId()){
      alert("请选择直播间！")
      return false;
    }
    return true;
  }

  RtcUtils.getRoomId = function () {
    return parseInt(localStorage.getItem("liveId"));
  }

  RtcUtils.sendMessage = function (message){
    var liveId = RtcUtils.getRoomId();

    message.liveId = liveId;
    message.token = localStorage.getItem("token");
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    RtcUtils.ws.send(jsonMessage);
  }

  RtcUtils.showSpinner = function() {
    for (var i = 0; i < arguments.length; i++) {
      arguments[i].poster = './img/transparent-1px.png';
      arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
  }

  RtcUtils.hideSpinner = function() {
    for (var i = 0; i < arguments.length; i++) {
      arguments[i].src = '';
      arguments[i].poster = './img/webrtc.png';
      arguments[i].style.background = '';
    }
  }
  RtcUtils.init = function(){
    RtcUtils.notice = new EventEmitter();
  }
  //功能拓展
  //发弹幕
  RtcUtils.interaction = function (msg) {
    var message = {
      id : 'interaction',
      msg : msg
    }
    RtcUtils.sendMessage(message);
  }
  //滚弹幕
  RtcUtils.wordMove = function(msg){
    let container = document.getElementsByClassName("container-video")[0];
    let span = document.createElement("span"); // 创建一个新的span
    span.innerHTML = msg; // 将文本框中的内容赋值给这个新的span
    let speend = RtcUtils.random(1, 3); // 获取一个5-10的随机速度
    span.style.position = 'absolute';
    span.className = 'tm';
    span.style.left = RtcUtils.video.offsetWidth + RtcUtils.video.width + "px"; // 设置新span的出场left值
// 设置新span的出场top值在(video.offsetTop+10)以及(totalHeight-15)的范围内
    span.style.top = RtcUtils.random(20, 150) + "px";
// 将新的span添加到页面上面去
    container.appendChild(span);
// 开启定时器函数
    let stopTimer = setInterval(function () {
      span.style.left = parseFloat(span.style.left) - speend + "px"; // 不断变化span的left值
// 如果span的left值小于0 停止计时器函数 删除span
      if (parseInt(span.style.left) < 0 - span.offsetWidth) {
        clearInterval(stopTimer);
        container.removeChild(span);
      }
    }, 10);
  },
  RtcUtils.random = function (start, end) {
    return Math.floor(Math.random() * (end - start) + start);
  }

  window.RtcUtils = RtcUtils;
}
// Last time updated at Sep 23, 2014, 08:32:23

// Latest file can be found here: https://cdn.webrtc-experiment.com/Screen-Capturing.js

// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
// Documentation - https://github.com/muaz-khan/Chrome-Extensions/tree/master/Screen-Capturing.js
// Demo          - https://www.webrtc-experiment.com/Screen-Capturing/

// ___________________
// Screen-Capturing.js

// Source code: https://github.com/muaz-khan/Chrome-Extensions/tree/master/desktopCapture
// Google AppStore installation path: https://chrome.google.com/webstore/detail/screen-capturing/ajhifddimkapgcifgcodmmfdlknahffk

// This JavaScript file is aimed to explain steps needed to integrate above chrome extension
// in your own webpages

// Usage:
// getScreenConstraints(function(screen_constraints) {
//    navigator.webkitGetUserMedia({ video: screen_constraints }, onSuccess, onFailure );
// });

// First Step: Download the extension, modify "manifest.json" and publish to Google AppStore
//             https://github.com/muaz-khan/Chrome-Extensions/tree/master/desktopCapture#how-to-publish-yourself

// Second Step: Listen for postMessage handler
// postMessage is used to exchange "sourceId" between chrome extension and you webpage.
// though, there are tons other options as well, e.g. XHR-signaling, websockets, etc.
window.addEventListener('message', function(event) {
  if (event.origin != window.location.origin) {
    return;
  }

  onMessageCallback(event.data);
});

// and the function that handles received messages

function onMessageCallback(data) {
  // "cancel" button is clicked
  if (data == 'PermissionDeniedError') {
    chromeMediaSource = 'PermissionDeniedError';
    if (screenCallback) return screenCallback('PermissionDeniedError');
    else throw new Error('PermissionDeniedError');
  }

  // extension notified his presence
  if (data == 'rtcmulticonnection-extension-loaded') {
    chromeMediaSource = 'desktop';
  }

  // extension shared temp sourceId
  if (data.sourceId && screenCallback) {
    screenCallback(sourceId = data.sourceId);
  }
}

// global variables
var chromeMediaSource = 'screen';
var sourceId;
var screenCallback;

// this method can be used to check if chrome extension is installed & enabled.
function isChromeExtensionAvailable(callback) {
  if (!callback) return;

  if (chromeMediaSource == 'desktop') return callback(true);

  // ask extension if it is available
  window.postMessage('are-you-there', '*');

  setTimeout(function() {
    if (chromeMediaSource == 'screen') {
      callback(false);
    } else callback(true);
  }, 2000);
}

// this function can be used to get "source-id" from the extension
function getSourceId(callback) {
  if (!callback) throw '"callback" parameter is mandatory.';
  if(sourceId) return callback(sourceId);

  screenCallback = callback;
  window.postMessage('get-sourceId', '*');
}

var isFirefox = typeof window.InstallTrigger !== 'undefined';
var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !isOpera;

function getChromeExtensionStatus(extensionid, callback) {
  if (isFirefox) return callback('not-chrome');

  if (arguments.length != 2) {
    callback = extensionid;
    extensionid = 'ajhifddimkapgcifgcodmmfdlknahffk'; // default extension-id
  }

  var image = document.createElement('img');
  image.src = 'chrome-extension://' + extensionid + '/icon.png';
  image.onload = function() {
    chromeMediaSource = 'screen';
    window.postMessage('are-you-there', '*');
    setTimeout(function() {
      if (chromeMediaSource == 'screen') {
        callback(extensionid == extensionid ? 'installed-enabled' : 'installed-disabled');
      } else callback('installed-enabled');
    }, 2000);
  };
  image.onerror = function() {
    callback('not-installed');
  };
}

// this function explains how to use above methods/objects
window.getScreenConstraints = (callback) => {
  var firefoxScreenConstraints = {
    mozMediaSource: 'window',
    mediaSource: 'window'
  };

  if(isFirefox) return callback(null, firefoxScreenConstraints);

  // this statement defines getUserMedia constraints
  // that will be used to capture content of screen
  var screen_constraints = {
    mandatory: {
      chromeMediaSource: chromeMediaSource,
      maxWidth: screen.width > 1920 ? screen.width : 1920,
      maxHeight: screen.height > 1080 ? screen.height : 1080
    },
    optional: []
  };

  // this statement verifies chrome extension availability
  // if installed and available then it will invoke extension API
  // otherwise it will fallback to command-line based screen capturing API
  if (chromeMediaSource == 'desktop' && !sourceId) {
    getSourceId(function() {
      screen_constraints.mandatory.chromeMediaSourceId = sourceId;
      callback(sourceId == 'PermissionDeniedError' ? sourceId : null, screen_constraints);
    });
    return;
  }

  // this statement sets gets 'sourceId" and sets "chromeMediaSourceId"
  if (chromeMediaSource == 'desktop') {
    screen_constraints.mandatory.chromeMediaSourceId = sourceId;
  }

  // now invoking native getUserMedia API
  callback(null, screen_constraints);
}
