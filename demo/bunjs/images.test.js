const inputPath = "3界面可配置.png";
const outputPath = "output-3.png";

async function transform(filepath, output) {
  // 2. 使用 Bun.write 配合 Bun.file 转换
  await Bun
    .file(filepath)
    .image()
    .resize(450, 300, { fit: "fill" })
    .png({})
    .write(output);
}

// await transform('1酷炫按钮.png', 'output-1.png')
// await transform('2第三方账号登录.png', 'output-2.png')
// await transform('3界面可配置.png', 'output-3.png')
await transform('login.png', 'output-login.png')

console.log("图片压缩完成！");
// https://jiayou.work/gw/user/sns/weibo/callback