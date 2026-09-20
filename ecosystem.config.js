module.exports = {
  apps: [
    {
      name: "stelify-music",
      script: "node_modules/next/dist/bin/next",
      args: "dev",   // <--- KEMBALI KE DEV
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development", // <--- KEMBALI KE DEVELOPMENT
        PORT: 3000
      }
    }
  ]
};