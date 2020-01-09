const webpack = require('webpack')
var url = window.location.hostname
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
  publicPath: '/front/',
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
