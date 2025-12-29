# Queue Management System - Setup & Troubleshooting Guide

## Overview
This guide documents the complete process for setting up and troubleshooting a Queue Management System with a Python Flask backend and Vue.js frontend on Ubuntu with Python 3.12.

---

## Backend Setup (Python Flask API)

### Issue: psycopg2 + Python 3.12 Compatibility Error

**Error Message:**
```
SystemError: type psycopg2.extensions.ReplicationConnection has the Py_TPFLAGS_HAVE_GC flag but has no traverse function
```

**Root Cause:**
psycopg2 has C extension compatibility issues with Python 3.12's garbage collection changes.

### Solution Steps:

#### 1. Navigate to API directory
```bash
cd /root/queue-management/api
```

#### 2. Clean existing virtual environment
```bash
rm -rf .venv
```

#### 3. Create new virtual environment with Python 3.11
```bash
# Install Python 3.11 if not available
apt-get update
apt-get install python3.11 python3.11-venv -y

# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate
```

#### 4. Install dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 5. Update wsgi.py to exclude psycopg2 from monkey patching
```python
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

import eventlet
# Exclude psycopg from monkey patching to avoid compatibility issues
eventlet.monkey_patch(psycopg=False)

from qsystem import application, socketio

if __name__ == "__main__":
    socketio.run(application, host="0.0.0.0", port=5000, debug=True)
```

#### 6. Run the backend
```bash
python3 wsgi.py
```

**Expected Output:**
```
(89908) wsgi starting up on http://0.0.0.0:5000
```

---

## Frontend Setup (Vue.js Appointment Booking)

### Issue 1: Vue/Vuetify Version Conflict

**Error Message:**
```
ERESOLVE unable to resolve dependency tree
peer vue@"^3.5.0" from vuetify@3.11.5
```

**Root Cause:**
Mismatch between installed Vuetify version and project requirements (Vue 2 project with Vuetify 3 in cache).

### Solution:

```bash
cd /root/queue-management/appointment-frontend

# Clean installation
rm -rf node_modules package-lock.json
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps
```

---

### Issue 2: Webpack Progress Plugin Error

**Error Message:**
```
ValidationError: Progress Plugin Invalid Options
```

**Root Cause:**
Vue CLI 5 uses webpack 5, which has different plugin configuration requirements.

### Solution:

Create/update `vue.config.js`:

```javascript
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
    // Remove the progress plugin that's causing issues
    config.plugins.delete('progress')
  },
  
  transpileDependencies: ['vuetify', 'vuex-persist']
}
```

---

### Issue 3: SCSS Import Path Errors

**Error Message:**
```
These dependencies were not found:
* $assets/scss/base.scss in ./src/plugins/vuetify.ts
```

**Root Cause:**
Custom `$assets` alias doesn't work properly with TypeScript SCSS imports.

### Solution:

Update `src/plugins/vuetify.ts` to use standard Vue alias:

```bash
sed -i "s|import '\$assets/scss/base.scss'|import '@/assets/scss/base.scss'|g" src/plugins/vuetify.ts
sed -i "s|import '\$assets/scss/layout.scss'|import '@/assets/scss/layout.scss'|g" src/plugins/vuetify.ts
sed -i "s|import '\$assets/scss/overrides.scss'|import '@/assets/scss/overrides.scss'|g" src/plugins/vuetify.ts
```

---

### Issue 4: Keycloak.js Module Parse Error

**Error Message:**
```
Module parse failed: Unexpected token (499:37)
const logoutMethod = options?.logoutMethod ?? kc.logoutMethod;
```

**Root Cause:**
Webpack cannot parse modern JavaScript syntax (optional chaining) in keycloak-js .mjs files.

### Solution:

Update `vue.config.js` to handle .mjs files:

```javascript
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
    
    // Fix keycloak-js parsing issue
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
    'keycloak-js'  // Add keycloak-js to transpile dependencies
  ]
}
```

---

### Issue 5: SCSS Undefined Variable

**Error Message:**
```
SassError: Undefined variable.
color: rgba($gray9, 0.8);
```

**Root Cause:**
SCSS variables from `theme.scss` not available in other SCSS files.

### Solution:

Update `vue.config.js` to globally import theme variables:

```javascript
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
  }
}
```

---

### Issue 6: Webpack Dev Server Invalid Options

**Error Message:**
```
ValidationError: webpack Dev Server Invalid Options
options should NOT have additional properties
```

**Root Cause:**
Outdated devServer configuration format for webpack-dev-server 4+.

### Solution:

Final working `vue.config.js`:

```javascript
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
```

---

### Issue 7: Missing Configuration File (Blank Page)

**Error in Browser:**
```
GET http://172.20.21.37:8081/undefinedconfig/configuration.json 404
```

**Root Cause:**
1. Missing `process.env.VUE_APP_PATH` environment variable
2. Missing `public/config/configuration.json` file

### Solution:

#### Step 1: Create environment file

```bash
cat > .env.development << 'EOF'
VUE_APP_PATH=/
NODE_ENV=development
EOF

cat > .env << 'EOF'
VUE_APP_PATH=/
NODE_ENV=production
EOF
```

#### Step 2: Create configuration file

```bash
mkdir -p public/config

cat > public/config/configuration.json << 'EOF'
{
  "VUE_APP_ROOT_API": "http://172.20.21.37:5000/api/v1/",
  "VUE_APP_FEEDBACK_API": "",
  "FEEDBACK_SERVICE_CHANNEL": "appointment-booking",
  "FEEDBACK_ENABLED": false,
  "VUE_APP_HEADER_MSG": "",
  "VUE_APP_HEADER_LINKS": [],
  "VUE_APP_FOOTER_MSG": "",
  "VUE_APP_FOOTER_LINKS": [],
  "disableSms": false
}
EOF
```

#### Step 3: Restart dev server

```bash
npm run serve
```

---

## Complete Setup Process (From Scratch)

### Backend Setup

```bash
# Navigate to API directory
cd /root/queue-management/api

# Clean and recreate virtual environment with Python 3.11
rm -rf .venv
python3.11 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Update wsgi.py (add psycopg=False to monkey_patch)
# See Backend Setup section above for code

# Start backend
python3 wsgi.py
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd /root/queue-management/appointment-frontend

# Clean installation
rm -rf node_modules package-lock.json
npm cache clean --force

# Install dependencies
npm install --legacy-peer-deps

# Create vue.config.js
# Copy the final working vue.config.js from Issue 6 above

# Fix SCSS imports in vuetify.ts
sed -i "s|import '\$assets/scss/base.scss'|import '@/assets/scss/base.scss'|g" src/plugins/vuetify.ts
sed -i "s|import '\$assets/scss/layout.scss'|import '@/assets/scss/layout.scss'|g" src/plugins/vuetify.ts
sed -i "s|import '\$assets/scss/overrides.scss'|import '@/assets/scss/overrides.scss'|g" src/plugins/vuetify.ts

# Create environment files
cat > .env.development << 'EOF'
VUE_APP_PATH=/
NODE_ENV=development
EOF

cat > .env << 'EOF'
VUE_APP_PATH=/
NODE_ENV=production
EOF

# Create configuration file
mkdir -p public/config
cat > public/config/configuration.json << 'EOF'
{
  "VUE_APP_ROOT_API": "http://YOUR_SERVER_IP:5000/api/v1/",
  "VUE_APP_FEEDBACK_API": "",
  "FEEDBACK_SERVICE_CHANNEL": "appointment-booking",
  "FEEDBACK_ENABLED": false,
  "VUE_APP_HEADER_MSG": "",
  "VUE_APP_HEADER_LINKS": [],
  "VUE_APP_FOOTER_MSG": "",
  "VUE_APP_FOOTER_LINKS": [],
  "disableSms": false
}
EOF

# Start frontend
npm run serve
```

---

## Verification

### Backend Verification

```bash
# Check if backend is running
curl http://localhost:5000/

# Expected: 404 (normal, no root route defined)
# Backend logs should show: "wsgi starting up on http://0.0.0.0:5000"
```

### Frontend Verification

```bash
# Check if frontend is serving
curl http://localhost:8081/

# Expected: HTML content with <div id="app"></div>

# Check config file is accessible
curl http://localhost:8081/config/configuration.json

# Expected: JSON configuration object
```

### Browser Verification

1. Open browser to `http://YOUR_SERVER_IP:8081/`
2. Open DevTools (F12)
3. Check Console tab - should have no errors
4. Check Network tab - all requests should return 200 OK
5. App UI should be visible and functional

---

## Common Issues & Quick Fixes

### Issue: "Cannot find module '@vue/eslint-config-standard'"
```bash
npm install --save-dev @vue/eslint-config-standard --legacy-peer-deps
```

### Issue: Node.js version incompatibility
```bash
# Install Node 16 (most stable for this setup)
nvm install 16
nvm use 16
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: Port already in use
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 8081)
lsof -ti:8081 | xargs kill -9
```

### Issue: SASS deprecation warnings
These are non-critical warnings. To fix:
```bash
# Change @import to @use in SCSS files
sed -i 's/@import "theme.scss";/@use "theme.scss";/g' src/assets/scss/overrides.scss
```

---

## Production Deployment Notes

### Backend
- Use `gunicorn` or `uwsgi` instead of the development server
- Set `debug=False` in `socketio.run()`
- Configure proper environment variables
- Use a process manager like `systemd` or `supervisor`

### Frontend
```bash
# Build for production
npm run build

# Serve with nginx or apache
# Built files will be in the dist/ directory
```

---

## System Requirements

- **OS:** Ubuntu 20.04+ (or similar Linux distribution)
- **Python:** 3.11 (3.12 has psycopg2 compatibility issues)
- **Node.js:** 16.x (most stable for Vue CLI 5)
- **npm:** 8.x+
- **Database:** PostgreSQL (required by psycopg2)

---

## Dependencies Overview

### Backend Key Dependencies
- Flask/Flask-SocketIO (web framework)
- eventlet (async/websocket support)
- psycopg2 (PostgreSQL adapter)
- SQLAlchemy (ORM)
- sqlalchemy-continuum (versioning)

### Frontend Key Dependencies
- Vue 2.6.14 (JavaScript framework)
- Vuetify 2.6.10 (UI component library)
- Vue Router 3.x (routing)
- Vuex 3.x (state management)
- keycloak-js 24.x (authentication - optional)
- axios (HTTP client)

---

## Troubleshooting Tips

1. **Always check both terminal outputs:** Backend and frontend logs provide different error contexts
2. **Use browser DevTools extensively:** Console and Network tabs reveal runtime issues
3. **Clear caches when in doubt:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   ```
4. **Check file permissions:** Ensure the user has read/write access to project directories
5. **Verify environment variables:** Use `echo $VARIABLE_NAME` or check `.env` files
6. **Test components individually:** Backend API separately from frontend UI

---

## Additional Resources

- [Vue CLI Documentation](https://cli.vuejs.org/)
- [Vuetify 2 Documentation](https://v2.vuetifyjs.com/)
- [Flask-SocketIO Documentation](https://flask-socketio.readthedocs.io/)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

---

## Document History

- **Created:** December 29, 2025
- **Issue Context:** Python 3.12 + psycopg2 compatibility, Vue CLI 5 + webpack 5 configuration
- **Environment:** Ubuntu Linux, Python 3.11, Node.js 16