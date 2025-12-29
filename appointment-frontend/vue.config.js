let path = require('path')
module.exports = {
  lintOnSave: false,
  
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      alias: {
        'vue': path.resolve('./node_modules/vue'),
        '$assets': path.resolve('./src/assets/')
      }
    }
  },
  
  chainWebpack: config => {
    config.plugins.delete('progress')
    
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .include.add(/node_modules/)
      .end()
      .type('javascript/auto')
  },
  
  transpileDependencies: [
    'vuetify', 
    'vuex-persist',
    'keycloak-js'
  ],
  
  css: {
    loaderOptions: {
      scss: {
        additionalData: `@import "@/assets/scss/theme.scss";`
      }
    }
  },
  
  devServer: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
