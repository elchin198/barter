module.exports = {
  apps: [{
    name: "bartertap",
    script: "dist/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 5000
    },
    instances: 1,
    exec_mode: "fork",
    watch: false,
    max_memory_restart: "500M",
    log_date_format: "YYYY-MM-DD HH:mm Z",
    error_file: "logs/error.log",
    out_file: "logs/out.log",
    merge_logs: true,
    time: true,
    autorestart: true
  }]
};