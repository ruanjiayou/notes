const core = require("@huaweicloud/huaweicloud-sdk-core");
const cdn = require("@huaweicloud/huaweicloud-sdk-cdn/v1/public-api");

async function updateCdnCache(urls) {
  if (urls.length <= 0) return;
  const credentials = new core.GlobalCredentials()
    .withAk(process.env.huawei_sg_ak)
    .withSk(process.env.huawei_sg_sk)
    .withDomainId(process.env.huawei_sg_domain_id)
  const endpoint = "https://cdn.myhuaweicloud.com";
  const client = cdn.CdnClient.newBuilder()
    .withCredential(credentials)
    .withEndpoint(endpoint)
    .build();
  const request = new cdn.CreateRefreshTasksRequest();
  const body = new cdn.RefreshTaskRequest();
  body.withRefreshTask(
    new cdn.RefreshTaskRequestBody()
      .withMode("all")
      .withType("file")
      .withUrls(urls));
  request.withBody(body);
  try {
    const result = await client.createRefreshTasks(request);
    if (result.httpStatusCode >= 400) throw new Error(`update cdn cache failed: ${JSON.stringify(result)}`)
  } catch (e) {
    logger.info(`update cache failed: ${e.toString()}`);
  }
}

console.log(process.env.name)