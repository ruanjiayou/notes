const { QueryRecordingRequest } = require('@huaweicloud/huaweicloud-sdk-ivs');
const { BasicCredentials, } = require('@huaweicloud/huaweicloud-sdk-core');
const { LiveClient, ShowTranscodingsTemplateRequest, ListPublishTemplateRequest, CreateTranscodingsTemplateRequest, StreamTranscodingTemplate, CreateRecordCallbackConfigRequest, RecordCallbackConfigRequest, CreateRecordRuleRequest, RecordRuleRequest, ListRecordCallbackConfigsRequest, ListRecordRulesRequest, RunRecordRequest, RecordControlInfo, UpdateRecordRuleRequest, UpdateStreamForbiddenRequest, StreamForbiddenSetting, UpdateTranscodingsTemplateRequest, DeleteStreamForbiddenRequest, ListStreamForbiddenRequest, ListLiveStreamsOnlineRequest, UpdateRecordCallbackConfigRequest } = require('@huaweicloud/huaweicloud-sdk-live');
const { MpcClient, CreateTranscodingTaskRequest, CreateTranscodingReq, CreateThumbnailsTaskRequest, WatermarkRequest, ImageWatermark, CreateExtractTaskRequest, CreateExtractTaskReq, ObsObjInfo } = require('@huaweicloud/huaweicloud-sdk-mpc');

const ak = ''
const sk = ''
const project_id = '';
const endpoint = 'https://live.ap-southeast-3.myhuaweicloud.com';
const bucket = '';
const region = 'ap-southeast-3';

// 配置客户端
const credential = new BasicCredentials().withAk(ak).withSk(sk).withProjectId(project_id);

const liveClient = LiveClient.newBuilder().withCredential(credential).withEndpoint(endpoint).build();
const mpcClient = MpcClient.newBuilder().withCredential(credential).withEndpoint(`https://mpc.ap-southeast-3.myhuaweicloud.com`).build();

(async () => {
  const result = await mpcClient.createExtractTask(
    new CreateExtractTaskRequest()
      .withBody(
        new CreateExtractTaskReq()
          .withInput(new ObsObjInfo(bucket, region, '/mp/temp-test/test-0ff80ff6bd719d9cb06e0e6c59704301_1080.mp4'))
          .withSync(1)
      )
  );
  console.log(JSON.stringify(result));
})();