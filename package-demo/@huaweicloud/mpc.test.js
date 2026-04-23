const { BasicCredentials, } = require('@huaweicloud/huaweicloud-sdk-core');
const { MpcClient, CreateTranscodingTaskRequest, CreateTranscodingReq, CreateThumbnailsTaskRequest, WatermarkRequest, ImageWatermark, CreateExtractTaskRequest, CreateExtractTaskReq, ObsObjInfo } = require('@huaweicloud/huaweicloud-sdk-mpc');

const ak = ''
const sk = ''
const project_id = '';
const bucket = 'fengshows-media-prod';
const region = 'ap-southeast-3';

// 配置客户端
const credential = new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id);

const mpcClient = MpcClient.newBuilder().withCredential(credential).withEndpoint(`https://mpc.ap-southeast-3.myhuaweicloud.com`).build();

const constant = {
  WATERMARK_MAP: {
    '360p': { template_id: '196909', object: 'mp/watermark/360.png', },
    '480p': { template_id: '196908', object: 'mp/watermark/480.png', },
    '720p': { template_id: '196907', object: 'mp/watermark/720.png', },
    '1080p': { template_id: '196906', object: 'mp/watermark/1080.png', },
    '1440p': { template_id: '239159', object: 'mp/watermark/1440.png', },
    '2160p': { template_id: '239160', object: 'mp/watermark/2160.png', },
  }
}

// 4k   https://fengshows-media-prod.obs.ap-southeast-3.myhuaweicloud.com/mp/v/2026/04/19/22749d70-3ba0-11f1-af3b-8f4e76891256.mp4
const watermark = constant.WATERMARK_MAP['1080p'];

(async () => {
  const result1 = await mpcClient.createTranscodingTask(
    new CreateTranscodingTaskRequest()
      .withBody(
        new CreateTranscodingReq()
          .withInput(new ObsObjInfo(bucket, region, "mp/temp-test/desktop.mov"))
          .withOutput(new ObsObjInfo(bucket, region, "mp/temp-test"))
          .withTransTemplateId([
            556812,
          ])
          .withWatermarks([new WatermarkRequest().withInput(new ObsObjInfo(bucket, region, "mp/watermark/1080.png")).withTemplateId('196906')])
          .withOutputFilenames([
            "desktop_1080.mp4",
          ])
          .withUserData("test:video:123123")
      )
  );
  console.log(result1);
})();
