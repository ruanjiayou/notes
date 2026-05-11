module.exports = {
  apps: [
    {
      name: "test",
      script: "./test.ts",  // 直接运行 ts 文件
      interpreter: "bun",   // 关键：指定 Bun 作为解释器
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    // {
    //   name: "plan",
    //   cwd: "./plan-server",
    //   script: "bun",
    //   args: "run start",
    //   env: {
    //     PORT: 3366,
    //   },
    // },
  ]
}