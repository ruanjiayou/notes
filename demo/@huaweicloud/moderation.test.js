const core = require('@huaweicloud/huaweicloud-sdk-core');
const moderation = require("@huaweicloud/huaweicloud-sdk-moderation");

class ModerationClient {
  constructor(opts) {
    const credentials = new core.BasicCredentials()
      .withAk(opts.ak)
      .withSk(opts.sk)
      .withProjectId(opts.project_id);
    this.client = moderation.v3.ModerationClient.newBuilder()
      .withCredential(credentials)
      .withEndpoint(`https://moderation.${opts.region}.myhuaweicloud.com`)
      .build();
  }

  async verifyText(text, eventType, categories) {
    const request = new moderation.v3.RunTextModerationRequest();
    const body = new moderation.v3.TextDetectionReq();
    const databody = new moderation.v3.TextDetectionDataReq();
    databody.withText(text);
    body.withData(databody);
    body.withEventType(eventType);
    body.withCategories(categories);
    request.withBody(body);
    const result = await this.client.runTextModeration(request);
    if (result.httpStatusCode != 200) throw new Error(`request error: ${result.httpStatusCode}`);
    return result.result;
  }

  async verfyImages(images, eventType, categroies) {
    // const request = new moderation.v3.BatchCheckImageSyncRequest();
    // const body = new moderation.v3.ImageBatchSyncReq();
    // body.withCategories(categroies);
    // body.withEventType(eventType);
    // let count = 0;
    // let timestamp = Date.now();
    // const urls = images.map(img => {
    //     return  new moderation.ImageBatchSyncReqUrls(img, timestamp + count++);
    // }) 
    // body.withUrls(urls);
    // request.withBody(body);
    //  const result = await this.client.batchCheckImageSync(request);
    // 2025-09-15
    // why not use batch interface ? because ap-southeast-3 not support, keep code!
    let results = [];
    for (let i = 0; i < images.length; i++) {
      const request = new moderation.v3.CheckImageModerationRequest();
      const body = new moderation.v3.ImageDetectionReq();
      body.withEventType(eventType);
      body.withCategories(categroies);
      body.withUrl(images[i]);
      request.withBody(body);
      const result = await this.client.checkImageModeration(request);
      if (result.httpStatusCode != 200) throw new Error(`request error: ${result.httpStatusCode}`);
      result.result.url = images[i];
      results.push(result.result);
    }
    return results;
  }

  async createVideoJob(url) {
    const request = new moderation.v3.RunCreateVideoModerationJobRequest();
    const body = new moderation.v3.VideoCreateRequest();

    // 设置视频数据，支持 URL 或 OBS 对象
    body.withData({
      url,
    });

    // 设置审核分类：politics(政治), terrorism(暴恐), porn(色情) 等
    // body.withCategories(["politics", "terrorism", "porn", "ad"]);

    request.withBody(body);

    try {
      const result = await this.client.runCreateVideoModerationJob(request);
      console.log("任务创建成功，Job ID:", result.job_id);
      return result.job_id;
    } catch (error) {
      console.error("提交失败:", error);
    }
  }

  async getVideoAuditResult(jobId) {
    const request = new moderation.v3.RunQueryVideoModerationJobRequest();
    request.withJobId(jobId);

    try {
      const result = await this.client.runQueryVideoModerationJob(request);
      console.log("审核状态:", result.status); // created, running, finish, failed

      if (result.status === "finish") {
        console.log("最终结果:", result.result.suggestion); // block(违规), review(需人工复审), pass(通过)
        console.log("违规详情:", JSON.stringify(result.result.details));
      }
    } catch (error) {
      console.error("查询失败:", error);
    }
  }
}
// module.exports = ModerationClient;

function auditVideo() {
  new ModerationClient({
    ak: process.env.huawei_sg_ak,
    sk: process.env.huawei_sg_sk,
    region: process.env.huawei_sg_region,
    project_id: process.env.huawei_sg_project_id,
  })
    .createVideoJob("https://fengshows-media-prod.obs.ap-southeast-3.myhuaweicloud.com/mp/v/2026/01/01/f28d8de0-e6ce-11f0-bdb1-7f00eaf5aff6.mp4")
    .then(result => {

    })
    .catch(err => {
      console.log(err)
    });

}
function getResult(jobid) {
  new ModerationClient({
    ak: process.env.huawei_sg_ak,
    sk: process.env.huawei_sg_sk,
    region: process.env.huawei_sg_region,
    project_id: process.env.huawei_sg_project_id,
  })
    .getVideoAuditResult(jobid)
    .then(() => {

    })
    .catch(err => {
      console.log(err)
    })
}

auditVideo()