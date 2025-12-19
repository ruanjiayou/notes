const { IamClient, KeystoneListProjectsRequest } = require('@huaweicloud/huaweicloud-sdk-iam');
const { BasicCredentials } = require('@huaweicloud/huaweicloud-sdk-core');
const { MpcClient, CreateTranscodingTaskRequest, CreateThumbnailsTaskRequest, ListTranscodingTaskRequest, ListThumbnailsTaskRequest } = require('@huaweicloud/huaweicloud-sdk-mpc');
const ObsClient = require('esdk-obs-nodejs');
const util = require('util');
const fs = require('fs');

const ak = ''
const sk = ''
const project_id = '';//'0710ad3b8f80260b0f2dc0083dd6d480'
const endpoint = 'obs.ap-southeast-3.myhuaweicloud.com';
const bucket = '';
const region = 'ap-southeast-3';


const part_fail = {
  "event_type": "TranscodeComplete",
  "transcode_info": {
    "task_id": "12680",
    "status": "SUCCEEDED",
    "create_time": "20251024025242",
    "start_time": "20251024025242",
    "end_time": "20251024025316",
    "input": {
      "bucket": "fengshows-media-prod",
      "location": "ap-southeast-3",
      "object": "mp/temp-test/test-0ff80ff6bd719d9cb06e0e6c59704301.mp4"
    },
    "output": {
      "bucket": "fengshows-media-prod",
      "location": "ap-southeast-3",
      "object": "mp/temp-test"
    },
    "user_data": "subscription:attachment_video:test-0ff80ff6bd719d9cb06e0e6c59704301",
    "error_code": "MPC.10218",
    "description": "The task has completed.",
    "media_detail": {
      "features": [
        "TRANSCODE"
      ],
      "origin_para": {
        "duration": 83,
        "duration_ms": 83105,
        "file_format": "MOV,MP4,M4A,3GP,3G2,MJ2",
        "size": 12376,
        "size_byte": 12674018,
        "video": {
          "width": 540,
          "height": 960,
          "bitrate": 1189,
          "bitrate_bps": 1189419,
          "frame_rate": 30,
          "codec": "H264",
          "dynamic_range": "SDR",
          "peak_bitrate": 0,
          "duration": "83",
          "duration_ms": "83105",
          "rotate": 0
        },
        "audio": {
          "codec": "AAC",
          "sample": 8000,
          "channels": 2,
          "sky_switch": 0,
          "bitrate": 26,
          "bitrate_bps": 26919,
          "file_size": 0,
          "duration": "83",
          "duration_ms": "83085",
          "embed_video": 0
        },
        "audios": []
      },
      "output_video_paras": [
        {
          "template_id": 556809,
          "size": 4411,
          "duration": 83,
          "duration_ms": 83100,
          "md5": "ef3da307520b3bbca84c8e8ce07b37e7",
          "size_byte": 4517340,
          "pack": "MP4",
          "video": {
            "width": 360,
            "height": 640,
            "bitrate": 402,
            "bitrate_bps": 402192,
            "frame_rate": 30,
            "codec": "H264",
            "dynamic_range": "SDR",
            "peak_bitrate": 0,
            "duration": "83",
            "duration_ms": "83100",
            "rotate": 0,
            "output_policy": "transcode"
          },
          "audio": {
            "codec": "AAC",
            "sample": 22050,
            "channels": 2,
            "sky_switch": 0,
            "bitrate": 26,
            "bitrate_bps": 26042,
            "file_size": 0,
            "duration": "83",
            "duration_ms": "83285",
            "embed_video": 0,
            "output_policy": "transcode"
          },
          "audios": [],
          "file_name": "test-0ff80ff6bd719d9cb06e0e6c59704301_360.mp4",
          "conver_duration": 83,
          "transcode_duration": 83,
          "convert_resource_spec_code": "mpc.duration.standard.h264.sd",
          "origin_resource_spec_code": "mpc.duration.standard.h264.sd",
          "features": [
            "TRANSCODE"
          ],
          "output": {
            "bucket": "fengshows-media-prod",
            "location": "ap-southeast-3",
            "object": "mp/temp-test"
          }
        },
        {
          "template_id": 556810,
          "size": 8512,
          "duration": 83,
          "duration_ms": 83100,
          "md5": "b09bfed8eddc04f9dc423a75040cec59",
          "size_byte": 8716573,
          "pack": "MP4",
          "video": {
            "width": 480,
            "height": 854,
            "bitrate": 806,
            "bitrate_bps": 806408,
            "frame_rate": 30,
            "codec": "H264",
            "dynamic_range": "SDR",
            "peak_bitrate": 0,
            "duration": "83",
            "duration_ms": "83100",
            "rotate": 0,
            "output_policy": "transcode"
          },
          "audio": {
            "codec": "AAC",
            "sample": 22050,
            "channels": 2,
            "sky_switch": 0,
            "bitrate": 26,
            "bitrate_bps": 26042,
            "file_size": 0,
            "duration": "83",
            "duration_ms": "83285",
            "embed_video": 0,
            "output_policy": "transcode"
          },
          "audios": [],
          "file_name": "test-0ff80ff6bd719d9cb06e0e6c59704301_480.mp4",
          "conver_duration": 83,
          "transcode_duration": 83,
          "convert_resource_spec_code": "mpc.duration.standard.h264.sd",
          "origin_resource_spec_code": "mpc.duration.standard.h264.sd",
          "features": [
            "TRANSCODE"
          ],
          "output": {
            "bucket": "fengshows-media-prod",
            "location": "ap-southeast-3",
            "object": "mp/temp-test"
          }
        }
      ],
      "output_image_sprite_paras": [],
      "output_thumbnail_paras": []
    },
    "xcode_error": {
      "error_code": "mWorker.Template.Video.Resolution",
      "error_msg": "template 556812's Resolution 0 X 1080 is bigger than input resolution, template 556811's Resolution 0 X 720 is bigger than input resolution"
    }
  }
}
async function getProjectId(ak, sk, region) {
  // 初始化IAM客户端，使用默认区域
  const iamClient = IamClient.newBuilder()
    .withCredential(new BasicCredentials().withAk(ak).withSk(sk))
    .withEndpoint(`https://iam.${region}.myhuaweicloud.com`)
    // .withRegion(region)
    .build();

  try {
    const request = new KeystoneListProjectsRequest();
    const response = await iamClient.keystoneListProjects(request);
    if (!response.projects || response.projects.length === 0) {
      throw new Error('未找到任何项目，请检查AK/SK权限');
    }

    // 3. 通常返回第一个项目，或者根据名称筛选
    const projects = response.projects;
    console.log('获取到的项目信息:', projects.filter(p => p.name === 'ap-southeast-3'));

    return;
  } catch (error) {
    console.error('获取项目ID失败:', error);
    throw error;
  }
}

async function createTranscodeByTemplateGroup() {
  const client = MpcClient.newBuilder()
    .withCredential(new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id))
    .withEndpoint(`https://mpc.${region}.myhuaweicloud.com`)
    .build();
  const request = new CreateTranscodingTaskRequest();

  const body = {
    input: {
      bucket,   // 输入文件所在桶名
      location: region,
      object: 'mp/temp-test/test-0ff80ff6bd719d9cb06e0e6c59704301.mp4',     // 输入文件的路径
    },
    output: {
      bucket,  // 输出文件所在桶名
      location: region,
      object: 'mp/temp-test',             // 输出文件目录，可以留空或以'/'结尾
    },
    trans_template_list: [
      { template_id: '556812', output_filename: 'test-0ff80ff6bd719d9cb06e0e6c59704301_1080.mp4' },
      { template_id: '556811', output_filename: 'test-0ff80ff6bd719d9cb06e0e6c59704301_720.mp4' },
      { template_id: '556810', output_filename: 'test-0ff80ff6bd719d9cb06e0e6c59704301_480.mp4' },
      { template_id: '556809', output_filename: 'test-0ff80ff6bd719d9cb06e0e6c59704301_360.mp4' },
      // { template_id: '556813', output_filename: '21c5de80-8704-11f0-b046-bb761fc628be.mp3' },
    ],
    // watermarks: [
    //   { template_id: '196906', input: { bucket, location: region, object: 'mp/watermark/1080.png' } },
    // ],
    thumbnail: {
      params: {
        type: 'DOTS',
        dots: [0],
        output_filename: "test-0ff80ff6bd719d9cb06e0e6c59704301.jpg"
      }
    },
    // 可选：用户自定义数据，回调时会原样返回
    user_data: "test:attachment_video:test-0ff80ff6bd719d9cb06e0e6c59704301" //JSON.stringify({ service: 'subscription', type: 'attachment', _id: 'test-0ff80ff6bd719d9cb06e0e6c59704301' })
  };

  request.body = body;

  try {
    const response = await client.createTranscodingTask(request);
    console.log('转码任务提交成功！');
    console.log('任务ID:', response);
    return response;
  } catch (error) {
    console.error('转码任务提交失败：', error);
    throw error;
  }
}

async function queryTaskDetail(id) {
  const client = MpcClient.newBuilder()
    .withCredential(new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id))
    .withEndpoint(`https://mpc.${region}.myhuaweicloud.com`)
    .build();
  const req = new ListTranscodingTaskRequest();
  req.taskId = id;

  const result = await client.listTranscodingTask(req);
  console.log(JSON.stringify(result, null, 2));
}

async function createThumbnail() {
  const client = MpcClient.newBuilder()
    .withCredential(new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id))
    .withEndpoint(`https://mpc.${region}.myhuaweicloud.com`)
    .build();
  const request = new CreateThumbnailsTaskRequest();
  const body = {
    input: {
      bucket: bucket,
      location: region,
      object: 'mp/v/2025/10/31/9f198070-b621-11f0-ab44-25e2bfbb0b5b.mp4'
    },
    output: {
      bucket: bucket,
      location: region,
      object: 'mp/v/2025/10/31/'
    },
    sync: 0,
    original_dir: 1,
    thumbnail_para: {
      type: 'TIME',
      time: 1,
      start_time: 0,
      duration: 10,
      format: 1,
      output_filename: `9f198070-b621-11f0-ab44-25e2bfbb0b5b`
    },
  }
  request.body = body;

  try {
    const response = await client.createThumbnailsTask(request);
    console.log('截图任务提交成功！');
    console.log('任务ID:', response);
    return response;
  } catch (error) {
    console.error('截图任务提交失败：', error);
    throw error;
  }
}
async function queryThumbnailTask() {
  const client = MpcClient.newBuilder()
    .withCredential(new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id))
    .withEndpoint(`https://mpc.${region}.myhuaweicloud.com`)
    .build();
  const result = await client.listThumbnailsTask(
    new ListThumbnailsTaskRequest()
      .withTaskId(['4280012'])
  );
  console.log(result);
}

(async () => {
  try {
    // const resp = await getProjectId(ak, sk, region);
    await createTranscodeByTemplateGroup();
    // await queryTaskDetail(5294)
    // await createThumbnail()
    // await queryThumbnailTask();

    // const obsClient = new ObsClient({
    //   access_key_id: ak,
    //   secret_access_key: sk,
    //   server: `https://obs.${region}.myhuaweicloud.com`,
    // });
    // obsClient.deleteObject({
    //   Bucket: bucket, Key: 'mp/temp-test/21c5de80-8704-11f0-b046-bb761fc628be.jpg',
    // }, (result, err) => {
    //   console.log(result, err)
    // })

    //   const result = await util.promisify(obsClient.putObject).bind(obsClient)({ Bucket: bucket, Key: 'mp/temp-test/test.html', Body: fs.createReadStream(__dirname + '/play.html') })
    //   console.log(result)
  } catch (e) {
    console.log(e)
  }
})();