const Queue = require('bull');
const spawn = require('child_process').spawn;
const exec = require('child_process').execSync;
const readline = require('readline');

/**
 * 执行命令监控(获取进度和最终结果)
 * @param {string} arg 要执行的命令
 * @param {function} DealLine line 处理含税
 * @param {function} cb 最终结果回调
 */
function videoProcess(arg, DealLine, cb) {
  const [cmd, ...args] = arg.split(' ');
  const std = spawn(cmd, args);
  const rl1 = readline.createInterface({
    input: std.stdout,
    crlfDelay: Infinity, // Handle all types of newlines
  });
  rl1.on('line', DealLine);
  const rl2 = readline.createInterface({
    input: std.stderr,
    crlfDelay: Infinity, // Handle all types of newlines
  });
  rl2.on('line', DealLine);
  std.on('exit', code => cb(code.toString() === '0'));
}

const QTranscoding = new Queue('transcoding', {
  prefix: 'transcoding',
  redis: {
    host: '10.0.15.240',
    port: '6379'
  }
});

QTranscoding.process('video', 1, function (job, done) {
  console.log('deal job', job.data);
  const data = job.data;
  // 获取视频时长
  const str = exec(`ffprobe -v quiet -show_format -print_format json -show_entries stream=index,codec_name,codec_tag_string,codec_type,profile,level,bit_rate,tags,nb_frames,avg_frame_rate,sample_rate,channels,width,height,duration ${data.path}`, { encoding: 'utf-8', cwd: process.cwd() });
  const info = JSON.parse(str);
  const duration = parseFloat(info.format.duration);

  videoProcess(`ffmpeg -i ${data.path} -c:v libx264 -c:a aac ${data.dist} -y`, line => {
    // 获取处理进度
    if (line.startsWith('frame=')) {
      const match = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})\s/);
      let totalMilliseconds = 0;
      if (match) {
        const [, hours, minutes, seconds, milliseconds] = match.map(Number);
        totalMilliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds * 10;
      }
      console.log((totalMilliseconds / (duration * 1000)).toFixed(2), `Line: ${line}`);
    }
  }, (isSuccess) => {
    // 命令完成后回调状态
    console.log('success', isSuccess);
    done(isSuccess ? null : '失败');
  });
});

// test example
QTranscoding.add('video', { path: 'data/output.mp4', dist: 'data/test.mp4' }, {
  priority: 3,
  attempts: 3,
  removeOnComplete: true,
});
QTranscoding.getJobCounts().then(total => {
  console.log(total);
});