module.exports = {
  apps: [{
    name: 'bartertap',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/home/u726371272/bartertap.az/logs/app-error.log',
    out_file: '/home/u726371272/bartertap.az/logs/app-out.log',
    merge_logs: true,
    time: true
  }]
};