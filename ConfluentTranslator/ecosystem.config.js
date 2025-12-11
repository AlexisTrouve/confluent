module.exports = {
  apps: [{
    name: 'confluent-translator',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/debian/.pm2/logs/confluent-translator-error.log',
    out_file: '/home/debian/.pm2/logs/confluent-translator-out.log',
    log_file: '/home/debian/.pm2/logs/confluent-translator-combined.log',
    time: true
  }]
};
