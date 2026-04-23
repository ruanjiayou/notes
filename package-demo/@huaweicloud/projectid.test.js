const { IamClient, KeystoneListProjectsRequest } = require('@huaweicloud/huaweicloud-sdk-iam');
const { BasicCredentials } = require('@huaweicloud/huaweicloud-sdk-core');

const ak = process.env.huawei_sg_ak
const sk = process.env.huawei_sg_sk;
const project_id = process.env.huawei_sg_project_id;
const bucket = process.env.huawei_sg_bucket;
const region = process.env.huawei_sg_region;

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

console.log(await getProjectId(ak, sk, region));