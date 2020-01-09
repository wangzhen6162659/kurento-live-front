import io from 'socket.io-client'
import { MessageBox, Message } from 'element-ui'
import store from './store'
import router from './router'

let socket = null

const errorHandler = err => {
  Message.error(err.message)
}
const hostname = '192.168.1.124:8443'
// 全局的socket， 一直存在，用来接收电话(call)请求,发送拒绝和接收
const startGlobalSocket = () => {

  var ws = new WebSocket('wss://' + hostname + '/call');
  return ws
}

const stopGlobalSocket = () => {

}

const getGlobalSocket = _ => {
  if (socket) return socket
}

const getNewSocket = _ => {
  const socket = io(url,{
    reconnection: false,
    path: '/call',
    transports:['websocket','xhr-polling','jsonp-polling']
  });
  socket.on('connect_error', errorHandler)
  socket.on('error', errorHandler)
  return socket
}

export { startGlobalSocket, stopGlobalSocket, getGlobalSocket, getNewSocket }
