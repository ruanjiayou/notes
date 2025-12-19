const { QueryRecordingRequest } = require('@huaweicloud/huaweicloud-sdk-ivs');
const { BasicCredentials, } = require('@huaweicloud/huaweicloud-sdk-core');
const { LiveClient, ShowTranscodingsTemplateRequest, ListPublishTemplateRequest, CreateTranscodingsTemplateRequest, StreamTranscodingTemplate, CreateRecordCallbackConfigRequest, RecordCallbackConfigRequest, CreateRecordRuleRequest, RecordRuleRequest, ListRecordCallbackConfigsRequest, ListRecordRulesRequest, RunRecordRequest, RecordControlInfo, UpdateRecordRuleRequest, UpdateStreamForbiddenRequest, StreamForbiddenSetting, UpdateTranscodingsTemplateRequest, DeleteStreamForbiddenRequest, ListStreamForbiddenRequest, ListLiveStreamsOnlineRequest, UpdateRecordCallbackConfigRequest, DefaultRecordConfig, MP4RecordConfig } = require('@huaweicloud/huaweicloud-sdk-live');
const { MpcClient, CreateTranscodingTaskRequest, CreateTranscodingReq, CreateThumbnailsTaskRequest, WatermarkRequest, ImageWatermark } = require('@huaweicloud/huaweicloud-sdk-mpc');

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
  const domain = 'push-huawei.fengshows.cn'

  // play-huawei.fengshows.cn push-huawei.fengshows.cn
  // 创建转码模板
  // const resp2 = await liveClient.createTranscodingsTemplate(
  //   new CreateTranscodingsTemplateRequest()
  //     .withBody(
  //       new StreamTranscodingTemplate(domain, 'fs', [{ quality: 'lhd', bitrate: 3000 },])
  //         .withTransType('publish')
  //     )
  // );
  // console.log(resp2); // { httpStatusCode: 201 }

  // 修改直播码流模板
  // const resp2_new = await liveClient.updateTranscodingsTemplate(
  //   new UpdateTranscodingsTemplateRequest()
  //     .withBody(
  //       new StreamTranscodingTemplate(domain, 'fs', [
  //         { quality: 'lld', bitrate: 600 },
  //         { quality: 'lsd', bitrate: 1000 },
  //         { quality: 'lhd', bitrate: 2000 },
  //         { quality: 'lud', bitrate: 3000 },
  //       ])
  //     )
  // );
  // console.log(resp2_new);

  // 查询转码模板
  // const resp = await liveClient.showTranscodingsTemplate(new ShowTranscodingsTemplateRequest(domain))
  // console.log(JSON.stringify(resp, null, 2)) // push_domain: 'push-huawei.fengshows.cn', app_name fs

  // 创建录制规则
  // const resp3 = await liveClient.createRecordRule(
  //   new CreateRecordRuleRequest()
  //     .withBody(new RecordRuleRequest()
  //       .withPublishDomain(domain)
  //       .withApp('fs')
  //       .withRecordType('COMMAND_RECORD')
  //       .withStream('*')
  //       .withDefaultRecordConfig({
  //         record_format: ['MP4'],
  //         obs_addr: {
  //           bucket,
  //           location: region,
  //           object: ''
  //         },
  //         mp4_config: {
  //           record_cycle: 0,
  //           record_prefix: 'live_record/{app}_{stream}/{file_start_time}/{file_start_time}'
  //         },
  //       })
  //     )
  // )
  // console.log(resp3) //

  // 修改录制规则
  // await liveClient.updateRecordRule(
  //   new UpdateRecordRuleRequest('50faafc66aeae355d1c5a0738ccec650d7ac14ea786fcf7e038cde31547b9023')
  //     .withBody(
  //       new RecordRuleRequest()
  //         .withPublishDomain(domain)
  //         .withApp('fs')
  //         .withRecordType('COMMAND_RECORD')
  //         .withStream('*')
  //         .withDefaultRecordConfig({
  //           record_format: ['MP4'],
  //           obs_addr: {
  //             bucket,
  //             location: region,
  //             object: ''
  //           },
  //           mp4_config: {
  //             record_cycle: 0,
  //             record_max_duration_to_merge_file: 600,
  //             record_prefix: 'live_record/{app}_{stream}/{file_start_time}-{file_end_time}'
  //           },
  //         })
  //     )
  // )
  // const resp3_detail = await liveClient.listRecordRules(new ListRecordRulesRequest()
  //   .withApp('fs')
  //   .withPublishDomain(domain)
  //   .withRecordType('COMMAND_RECORD')
  // );
  // console.log(JSON.stringify(resp3_detail, null, 2))

  // 配置录制回调
  // const resp4 = await liveClient.createRecordCallbackConfig(new CreateRecordCallbackConfigRequest()
  //   .withBody(new RecordCallbackConfigRequest()
  //     .withApp('fs')
  //     .withNotifyCallbackUrl('https://ump-api.phoenixtv.com/liveBroadcast/live_event')
  //     .withNotifyEventSubscription(['RECORD_NEW_FILE_START', 'RECORD_FILE_COMPLETE', 'RECORD_OVER', 'RECORD_FAILED'])
  //     .withPublishDomain(domain)
  //     .withSignType('HMACSHA256')
  //   ))
  // console.log(resp4)

  // const resp_update = await liveClient.updateRecordCallbackConfig(
  //   new UpdateRecordCallbackConfigRequest('d65e2573b65060dfeec76e0bdea5a2917d042cd757a2511d97a61b5b11bd22ff')
  //     .withBody(
  //       new RecordCallbackConfigRequest()
  //         .withApp('fs')
  //         .withPublishDomain(domain)
  //         .withNotifyCallbackUrl('https://ump-api.phoenixtv.com/liveBroadcast/live_event')
  //         .withNotifyEventSubscription(['RECORD_NEW_FILE_START', 'RECORD_FILE_COMPLETE', 'RECORD_OVER', 'RECORD_FAILED'])
  //         .withSignType('HMACSHA256')
  //     )
  // )
  // console.log(resp_update)

  // const resp5 = await liveClient.listRecordCallbackConfigs(new ListRecordCallbackConfigsRequest()
  //   .withApp('fs')
  //   .withPublishDomain(domain)
  // );
  // console.log(resp5);

  // 开始录制/结束录制  START STOP
  // try {
  //   const action = await liveClient.runRecord(
  //     new RunRecordRequest('STOP')
  //       .withBody(
  //         new RecordControlInfo()
  //           .withApp('fs')
  //           .withPublishDomain(domain)
  //           .withStream('082aadc0-d240-11f0-9209-79d043f187b7')
  //       )
  //   );
  //   console.log(action);
  // } catch (e) {
  //   console.log(e, e.name);
  // }

  // 查询禁播流
  // const result = await liveClient.listStreamForbidden(new ListStreamForbiddenRequest(domain, 'fs', 'p1'));
  // console.log(result)

  // 查询直播流
  const result = await liveClient.listLiveStreamsOnline(new ListLiveStreamsOnlineRequest(domain));
  console.log(JSON.stringify(result, null, 2));

  // const constant = {
  //   WATERMARKS: [
  //     // 只用1080 不然会重叠
  //     { template_id: '196906', object: 'mp/watermark/1080.png', width: '329', height: '83', dx: '72', dy: '72' },
  //     { template_id: '196907', object: 'mp/watermark/720.png', width: '232', height: '60', dx: '48', dy: '48' },
  //     { template_id: '196908', object: 'mp/watermark/480.png', width: '152', height: '42', dx: '32', dy: '32' },
  //     { template_id: '196909', object: 'mp/watermark/360.png', width: '129', height: '33', dx: '24', dy: '24' },
  //   ]
  // }
  // const watermark = constant.WATERMARKS[1];
  // // 提交视频转码
  // const result = await mpcClient.createTranscodingTask(
  //   new CreateTranscodingTaskRequest()
  //     .withBody(
  //       new CreateTranscodingReq()
  //         .withInput({ bucket, location: region, object: '/mp/temp-test/test-0ff80ff6bd719d9cb06e0e6c59704301_1080.mp4' })
  //         .withOutput({ bucket, location: region, object: '/mp/temp-test' })
  //         // .withThumbnail({ out: { bucket, location: region, object: '/mp/v/2025/11/11/' }, params: { type: 'DOTS', dots: [0], output_filename: '1fa91ba0-bec0-11f0-9479-2b33cb14fdf6_cap.jpg' } })
  //         .withTransTemplateId([
  //           // 556812,
  //           556811,
  //           556810,
  //           556809
  //         ])
  //         .withOutputFilenames([
  //           // "1fa91ba0-bec0-11f0-9479-2b33cb14fdf6_1080.mp4",
  //           "watermark_1080-720.mp4",
  //           "watermark_1080-480.mp4",
  //           "watermark_1080-360.mp4"
  //         ])
  //         .withUserData('test:video:test')
  //         .withWatermarks([
  //           // {
  //           //   template_id: '196909',
  //           //   width: 129,
  //           //   height: 33,
  //           //   input: {
  //           //     bucket, location: region, object: 'mp/watermark/360.png'
  //           //   }
  //           // },
  //           new WatermarkRequest()
  //             .withTemplateId(watermark.template_id)
  //             .withInput({ bucket: bucket, location: region, object: watermark.object })
  //           // .withImageWatermark(
  //           //   new ImageWatermark()
  //           //     .withWidth(watermark.width)
  //           //     .withHeight(watermark.height)
  //           //     .withDx(watermark.dx)
  //           //     .withDy(watermark.dy)
  //           //     .withReferpos('TopRight')
  //           // ),
  //         ])
  //     )
  // )
  // console.log(result);

  // const result = await mpcClient.createTranscodingTask(
  //   new CreateTranscodingTaskRequest()
  //     .withBody(
  //       new CreateTranscodingReq()
  //         .withInput({ bucket, location: region, object: '/mp/v/2025/11/11/a2983650-be79-11f0-8669-39a192f749a9.mp4' })
  //         .withOutput({ bucket, location: region, object: '/mp/v/2025/11/11/a2983650-be79-11f0-8669-39a192f749a9.mp4' })
  //         .withOutputFilenames([
  //           "a2983650-be79-11f0-8669-39a192f749a9_128.mp3"
  //         ])
  //         .withUserData('subscription:audio:a2983650-be79-11f0-8669-39a192f749a9')
  //         .withTransTemplateId([
  //           "556813"
  //         ])
  //     )
  // )
  // console.log(result);

  // const result = await mpcClient.createThumbnailsTask(new CreateThumbnailsTaskRequest()
  //   .withBody({
  //     input: {
  //       bucket,
  //       location: region,
  //       object: '/mp/v/2025/11/10/4e8cd810-be36-11f0-af5b-4397f9db468c.mp4'
  //     },
  //     output: {
  //       bucket: bucket,
  //       location: region,
  //       object: '/mp/s/2025/11/10'
  //     },
  //     sync: 1,
  //     original_dir: 1,
  //     thumbnail_para: {
  //       type: 'DOTS',
  //       dots: [0],
  //       format: 1,
  //       output_filename: `924edd00-be6d-11f0-b05a-71b70b5c483e`
  //     },
  //   }))
  // console.log(result);

  // const result = await mpcClient.createTranscodingTask(
  //   new CreateTranscodingTaskRequest()
  //     .withBody({
  //       input: { bucket, location: region, object: '/mp/a/2025/11/13/212bd800-c055-11f0-85ee-51b266228b0f.mp3' },
  //       output: { bucket, location: region, object: '/mp/a/2025/11/13' },
  //       trans_template_id: ['556813'],
  //       output_filenames: ['212bd800-c055-11f0-85ee-51b266228b0f_128.mp3'],
  //       user_data: 'subscription:attach_audio:212bd800-c055-11f0-85ee-51b266228b0f',
  //       watermarks: []
  //     })
  // );
  // console.log(result);


})();