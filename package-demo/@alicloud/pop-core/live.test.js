
const Core = require('@alicloud/pop-core');
const config = {
  ali_live: {  // 阿里直播服务
    accessKeyId: '',
    accessKeySecret: '',
    endpoint: 'https://live.aliyuncs.com',
    apiVersion: '2016-11-01',
    groupName: '阿里云', // 前缀  ali_(有下划线)
    appName: 'fs', // 直播app_name
    playKey: '', // 播流鉴权key
    pushKey: '', // 推流鉴权key
    playExpires: 1800, // 有效期  秒
    pushExpires: 43200, // 有效期  秒
    streamNamePrefix: '', // channelName前缀
  },
};

const client = new Core({
  accessKeyId: config.ali_live.accessKeyId,
  accessKeySecret: config.ali_live.accessKeySecret,
  endpoint: config.ali_live.endpoint,
  apiVersion: config.ali_live.apiVersion,
});

async function queryLiveStreams({ AppName, DomainName }) {
  const res = await client.request('DescribeLiveStreamsOnlineList', {
    AppName,
    // StreamName: 'p1',
    DomainName,
  }, { method: 'POST' }, { timeout: 10000 });
  console.log(JSON.stringify(res, null, 2));
  // {
  //   "TotalNum": 2,
  //   "RequestId": "3EE0C4FB-7A30-5C68-B202-FB2964B88108",
  //   "TotalPage": 1,
  //   "PageNum": 1,
  //   "PageSize": 2000,
  //   "OnlineInfo": {
  //     "LiveStreamOnlineInfo": [
  //       {
  //         "PublishUrl": "rtmp://pce2live.fengshows.cn/fs/p3",
  //         "FrameRate": 30,
  //         "DomainName": "ce2live.fengshows.cn",
  //         "TranscodeId": "hd,ld,sd,ud",
  //         "ServerIp": "49.67.74.103",
  //         "TranscodeDrm": "no,no,no,no",
  //         "ClientIp": "112.95.228.195",
  //         "PublishType": "edge",
  //         "AppName": "fs",
  //         "StreamName": "p3",
  //         "PlayDomain": "ce2live.fengshows.cn",
  //         "PublishDomain": "pce2live.fengshows.cn",
  //         "Transcoded": "no",
  //         "Height": 720,
  //         "PublishTime": "2025-07-08T02:05:40Z",
  //         "AudioCodecId": 10,
  //         "PushDomain": "pce2live.fengshows.cn",
  //         "Width": 1280,
  //         "VideoCodecId": 7
  //       },
  //       {
  //         "PublishUrl": "rtmp://pce2live.fengshows.cn/fs/p3_sd",
  //         "FrameRate": 25,
  //         "DomainName": "ce2live.fengshows.cn",
  //         "TranscodeId": "sd",
  //         "TranscodeDrm": "no",
  //         "ClientIp": "33.97.6.170",
  //         "PublishType": "center",
  //         "AppName": "fs",
  //         "StreamName": "p3_sd",
  //         "PlayDomain": "ce2live.fengshows.cn",
  //         "PublishDomain": "pce2live.fengshows.cn",
  //         "Transcoded": "yes",
  //         "Height": 432,
  //         "PublishTime": "2025-07-08T02:05:48Z",
  //         "AudioCodecId": 10,
  //         "PushDomain": "pce2live.fengshows.cn",
  //         "Width": 768,
  //         "VideoCodecId": 7
  //       }
  //     ]
  //   }
  // }
}
async function queryRecordFiles({ AppName, DomainName, StreamName, StartTime, EndTime }) {
  const res = await client.request('DescribeLiveStreamRecordIndexFiles', {
    AppName,
    DomainName,
    StreamName,
    StartTime,
    EndTime
  });
  console.log(res.RecordIndexInfoList);
  // 包含 FileUrl、Duration、RecordId
  // {
  //   RecordIndexInfo: [
  //     {
  //       EndTime: '2025-07-07T03:37:01Z',
  //       DomainName: 'ce2live.fengshows.cn',
  //       CreateTime: '2025-07-07T03:41:29Z',
  //       OssBucket: 'fengshows-sh',
  //       StartTime: '2025-07-07T02:02:44Z',
  //       Duration: 5656.52,
  //       AppName: 'fs',
  //       StreamName: 'p10',
  //       Format: 'mp4',
  //       RecordUrl: 'http://fengshows-sh.oss-cn-shanghai.aliyuncs.com/event_vod/p10_2025-07-07-10-02-48_2025-07-07-11-37-00.mp4',
  //       OssEndpoint: 'oss-cn-shanghai.aliyuncs.com',
  //       OssObject: 'event_vod/p10_2025-07-07-10-02-48_2025-07-07-11-37-00.mp4',
  //       Height: 1080,
  //       RecordId: '7d57b18f-ac79-432f-a659-7f1078913ca2',
  //       Width: 1920
  //     }
  //   ]
  // }
}
async function queryOpHistory({ AppName, DomainName, StartTime, EndTime }) {
  const rs = await client.request('DescribeLiveStreamsControlHistory', {
    AppName,
    DomainName,
    StartTime,
    EndTime
  }, { method: 'POST' }, { timeout: 10000 });
  console.log(JSON.stringify(rs));
  // {
  //   "RequestId": "4FDD4102-ED1B-5B93-880F-32A3F812CA12",
  //   "ControlInfo": {
  //     "LiveStreamControlInfo": [
  //       {
  //         "Action": "forbid",
  //         "StreamName": "ce2live.fengshows.cn/fs/p10",
  //         "ClientIP": "33.14.137.215",
  //         "TimeStamp": "2025-07-07T03:37:02Z"
  //       },
  //       {
  //         "Action": "resume",
  //         "StreamName": "ce2live.fengshows.cn/fs/p8",
  //         "ClientIP": "11.0.159.152",
  //         "TimeStamp": "2025-07-07T06:48:52Z"
  //       }
  //     ]
  //   }
  // }
}
async function queryRecordRules({ RegionId, AppName = 'fs', DomainName, PageNum = 1, PageSize = 20 }) {
  // DescribeLiveRecordVodConfigs
  const res = await client.request('DescribeLiveRecordConfig', {
    RegionId,
    // AppName,
    DomainName,
    // PageNum,
    // PageSize,
  });
  console.log(JSON.stringify(res, null, 2));
  // {
  //   "Order": "asc",
  //     "TotalNum": 1,
  //       "RequestId": "6FA126BA-5614-58FB-9758-6EE643172C90",
  //         "PageNum": 1,
  //           "PageSize": 10,
  //             "TotalPage": 1,
  //               "LiveAppRecordList": {
  //     "LiveAppRecord": [
  //       {
  //         "StreamName": "*",
  //         "OssEndpoint": "oss-ap-southeast-1.aliyuncs.com",
  //         "DomainName": "ev2live.fengshows.cn",
  //         "CreateTime": "2025-10-24T02:38:50Z",
  //         "TranscodeTemplates": {
  //           "Templates": []
  //         },
  //         "OssBucket": "fengshows-sg",
  //         "DelayTime": 180,
  //         "RecordFormatList": {
  //           "RecordFormat": [
  //             {
  //               "Format": "mp4",
  //               "CycleDuration": 21600,
  //               "OssObjectPrefix": "record/fs/{StreamName}/{EscapedStartTime}_{EscapedEndTime}"
  //             }
  //           ]
  //         },
  //         "OnDemond": 0,
  //         "TranscodeRecordFormatList": {
  //           "RecordFormat": []
  //         },
  //         "AppName": "fs"
  //       }
  //     ]
  //   }
  // }
};

(async () => {
  // 查在线流列表
  // await queryLiveStreams({
  //   AppName: 'fs',
  //   DomainName: 'ev2live.fengshows.cn'
  // })

  // 录制文件查询
  // await queryRecordFiles({
  //   DomainName: 'ev2live.fengshows.cn',
  //   AppName: 'fs',
  //   StreamName: 'p11',
  //   StartTime: '2025-11-14T00:00:00Z',
  //   EndTime: '2025-11-15T23:59:59Z',
  // });

  // 查询直播流操作历史
  // await queryOpHistory({
  //   AppName: 'fs',
  //   StartTime: '2025-11-14T03:00:00Z',
  //   EndTime: '2025-11-15T16:00:00Z',
  //   DomainName: 'ev2live.fengshows.cn',
  // })

  // 删除录制模板
  // const test = await client.request('DeleteLiveAppRecordConfig', {
  //   "DomainName": "ev2live.fengshows.cn",
  //   "AppName": "fs"
  // });
  // console.log(test);

  // 添加录制模板
  // const response = await client.request('AddLiveAppRecordConfig', {
  //   "DomainName": "ev2live.fengshows.cn",
  //   "AppName": "fs",
  //   "OssEndpoint": "oss-ap-southeast-1.aliyuncs.com",
  //   "OnDemand": 7,
  //   "StreamName": "*",
  //   "OssBucket": "fengshows-sg",
  //   "RecordFormat": [{
  //     "Format": "mp4",
  //     "CycleDuration": 21600,
  //     "OssObjectPrefix": "event_vod/{StreamName}_{EscapedStartTime}_{EscapedEndTime}"
  //   }],
  //   "DelayTime": 180,
  // })
  // console.log(response)

  // 更新手动录制规则
  // const response = await client.request('UpdateLiveAppRecordConfig', {
  //   "DomainName": "ev2live.fengshows.cn",
  //   "AppName": "fs",
  //   "OssEndpoint": "oss-ap-southeast-1.aliyuncs.com",
  //   "OnDemand": 7,
  //   "StreamName": "*",
  //   "OssBucket": "fengshows-sg",
  //   "RecordFormat": [{
  //     "Format": "mp4",
  //     "CycleDuration": 21600,
  //     "OssObjectPrefix": "record/fs/{StreamName}/{EscapedStartTime}_{EscapedEndTime}"
  //   }],
  //   "DelayTime": 180,
  // })
  // console.log(response)

  // 查询录制规则
  await queryRecordRules({ RegionId: 'ap-southeast-1', DomainName: 'ev2live.fengshows.cn' })
})();

const res = {
  "RequestId": "F921A687-9AB3-5A59-9514-318D85CA9175",
  "ControlInfo": {
    "LiveStreamControlInfo": [
      { "Action": "resume", "StreamName": "ce2live.fengshows.cn/fs/p10", "ClientIP": "11.0.159.153", "TimeStamp": "2024-01-15T03:00:15Z" },
      { "Action": "forbid", "StreamName": "ce2live.fengshows.cn/fs/p10", "ClientIP": "11.0.159.152", "TimeStamp": "2024-01-15T03:40:31Z" },
      { "Action": "resume", "StreamName": "ce2live.fengshows.cn/fs/p9", "ClientIP": "11.0.140.255", "TimeStamp": "2024-01-15T04:36:33Z" },
      { "Action": "forbid", "StreamName": "ce2live.fengshows.cn/fs/p2", "ClientIP": "11.0.141.0", "TimeStamp": "2024-01-15T08:14:13Z" },
      { "Action": "resume", "StreamName": "ce2live.fengshows.cn/fs/p1", "ClientIP": "11.0.141.0", "TimeStamp": "2024-01-16T05:12:59Z" }
    ]
  }
}
