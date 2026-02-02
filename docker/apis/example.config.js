module.exports = {
  apps: [
    {
      name: "demo",
      script: "./demo/server.js",
      watch: ["demo"],
      ignore_watch: [
        "node_modules",
        "logs",
        ".git",
        "temp"
      ],
      watch_options: {
        followSymlinks: false,
        usePolling: false,
        delay: 2000
      },
      env_production: {
        APP_VERSION: "1.0",
      }
    },
  ]
}