const webpack = require('webpack')
var url = "wzroom.cn"
module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        $:"jquery",
        jQuery:"jquery",
        "windows.jQuery":"jquery"
      })
    ]
  },
  publicPath: '/kurento-live-front/',
  assetsDir: 'assets',
  devServer: {
    proxy: {
      // '^/socket.io': {
      //   target: 'https://webrtc.qwertyyb.cn',
      //   changeOrigin: true,
      //   ws: true
      // },
      // '^/api': {
      //   target: 'https://webrtc.qwertyyb.cn',
      //   changeOrigin: true
      // }
      '^/call': {
        target: url,
        changeOrigin: true,
        ws: true
      },
      '^/api': {
        target: url,
        changeOrigin: true
      }
    }
  }
}
