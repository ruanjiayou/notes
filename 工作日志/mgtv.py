# -*- coding: utf-8 -*
import requests
import json
import re
import time
import pandas as pd

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"
}

def getEpisode(channel, clip_id, video_id = ''):
    time.sleep(1)
    url = ''
    if channel == '2':
        url = "https://pcweb.api.mgtv.com/episode/list?_support=10000000&clip_id="+str(clip_id) + "&video_id="+str(video_id)
    elif channel == '1':
        url = "https://pcweb.api.mgtv.com/list/master?src=intelmgtv&abroad=0&_support=10000000&cid="+str(clip_id)+"&pn=1&ps=100&abroad=0&src=intelmgtv"
    episodes = []
    page_num = 1
    while 1:
        req_url = url + '&page=' + str(page_num)
        print(req_url)
        result = []
        response = requests.get(url=req_url, headers=headers)
        response.encoding = "utf-8"
        page_text = response.text
        json_obj = json.loads(page_text)
        list = json_obj['data']['list']
        total_page = json_obj['data']['total_page']
        total = json_obj['data']['total']
        for item in list:
            title = item['t1']
            result.append(title)
            result.append('')
            duration = "`" + str(item['time'])
            result.append(duration)
            desc = item['t2']
            result.append(desc)
            #  补齐行
            result.append('')
            result.append('')
            result.append('')
        episodes.append(result)
        if(total_page <= page_num):
            break
        page_num += 1
        
    return episodes, total

def getDetail(clip_id):
    time.sleep(1)
    url = "https://pcweb.api.mgtv.com/video/info?cid="+str(clip_id)+"&_support=10000000"
    print(url)
    response = requests.get(url=url, headers=headers)
    response.encoding = "utf-8"
    page_text = response.text
    json_obj = json.loads(page_text)
    detail = json_obj['data']['info']
    return detail
        

def get_iqy(year, channel_id):
    #  电影起始数量
    pagenum = 1


    
    # response=requests.get(url=url,headers=headers)
    # response.encoding="utf-8"
    # page_text=response.text
    # print(page_text)
    """
    """
    #
    temp_list = []  # 暂时存放单部电影的数据
    dataRes = []  # 每次循环把单部电影数据放到这个list
    hasNext = 1
    # channel_id = 2  #电视剧
    # for i in range(pagenum + 1, pagenum + 100):  # 循环100-1次
    count = 0
    while (hasNext != 0):
        time.sleep(3)
        # https://pcw-api.iqiyi.com/search/recommend/list?channel_id=1&data_type=1&market_release_date_level=2021&mode=24&page_id=4&ret_num=48&session=e76d98e79967fc20a6d7914efcfda2ee
        # url_0 = "https://pcw-api.iqiyi.com/search/recommend/list?channel_id="+str(channel_id)+"&data_type=1&mode=24&market_release_date_level="+str(year)+"&page_id=" + str(
        #     pagenum) + "&ret_num=48&session=ad1d98bb953b7e5852ff097c088d66f2"
        # https://pianku.api.mgtv.com/rider/list/pcweb/v4?platform=pcweb&channelId=2&pn=1&year=2009&pc=80&hudong=0&_support=10000000&kind=a1&area=a1&sort=c2&abroad=0&src=intelmgtv
        url_0 = "https://pianku.api.mgtv.com/rider/list/pcweb/v4?platform=pcweb&channelId="+str(channel_id)+"&pn="+str(pagenum)+"&year="+str(year)+"&pc=80&hudong=0&_support=10000000&kind=a1&area=a1&sort=c2&abroad=0&src=intelmgtv"
        pagenum = pagenum + 1
        # url_0 = url_0 + str(i) + "&ret_num=48&session=ad1d98bb953b7e5852ff097c088d66f2"
        print('url: ', url_0)  # 输出拼接好的url
        response = requests.get(url=url_0, headers=headers)
        response.encoding = "utf-8"
        page_text = response.text
        # 解析json对象
        json_obj = json.loads(page_text)
        total = json_obj['data']['totalHits']
        count += len(json_obj['data']['hitDocs'])
        print(total)
        if total <= count:
            hasNext = 0
        # hasNext = 0
        # print(hasNext)
        # 这里的异常捕获是因为     测试循环的次数有可能超过电影网站提供的电影数 为了防止后续爬到空的json对象报错
        try:
            json_list = json_obj['data']['hitDocs']
        except KeyError:
            return dataRes  # json为空 程序结束
        for j in json_list:  # 开始循环遍历json串
            # print(json_list)
            # 0 title
            print("clip_id: " + str(j['clipId']))
            detail = getDetail(j['clipId'])
            

            name = j['title']  # 找到电影名 title
            # print(name)
            temp_list.append(name)
            # 1 period
            try:
                period = j['year']
                temp_list.append(period)
            except KeyError:
                temp_list.append("iqy no period")

            try:
                duration = "`" + str(detail['time'])
                temp_list.append(duration)
            except KeyError:
                temp_list.append('')
            

            # 异常捕获，防止出现电影没有description
            # 2 description
            try:
                description = j['awards']  # description
                # print(score)
                temp_list.append(description)
            except KeyError:
                print("KeyError")
                temp_list.append("iqy no description")  # 替换字符串

            # link = j['categories']  # 找到categories
            # temp_list.append(link)
            try:
                kind = detail['detail']['kind']
                temp_list.append(kind)
            except KeyError:
                temp_list.append('')
                
            try:
                score = j['zhihuScore']  # description
                # print(score)
                temp_list.append(score)
            except KeyError:
                print("KeyError")
                temp_list.append("iqy暂无评分")  # 替换字符串

            # exclusive = j['exclusive']
            # temp_list.append(exclusive)

            # qiyiProduce = j['qiyiProduced']
            # temp_list.append(qiyiProduce)
            episodes = []
            if channel_id == '1' or channel_id == '2':
                episodes, total = getEpisode(channel_id, j['clipId'], detail['videoId'])
                temp_list.append(total)
            else:
                temp_list.append('')
            # print(temp_list)
            dataRes.append(temp_list)
            if 0 < len(episodes):
                dataRes += episodes
            
            # print(temp_list)
            temp_list = []
        # print('___________________________', len(json_list))

    return dataRes


if __name__ == '__main__':
    #
    yearList = [2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]
    # yearList = [2009]
    # 1 综艺, 2 电视剧 3 电影
    # channels = ['1', '2' '3']
    channels = ['2']


    for year in yearList:
        for channel in channels:
            movieResult = get_iqy(year, channel)
            # print(movieResult[0])
            title = []
            period = []
            durations = []
            description = []
            categories = []
            score=[]
            totals=[]
           
            for j in movieResult:  # 开始循环遍历json串
                for idx, val in enumerate(j):
                    if((idx+1) % 7 == 1):
                        title.append(val)
                    if ((idx + 1) % 7 == 2):
                        period.append(val)
                    if ((idx + 1) % 7 == 3):
                        durations.append(val)
                    if ((idx + 1) % 7 == 4):
                        description.append(val)
                    if ((idx + 1) % 7 == 5):
                        categories.append(val)
                    if ((idx + 1) % 7 == 6):
                        score.append(val)
                    if ((idx + 1) % 7 == 0):
                        totals.append(val)
                    
            print(len(title), len(period), len(description), len(score))
            # 字典中的key值即为csv中列名
            dataframe = pd.DataFrame({'title': title, 'period': period, 'duration': durations, 'description': description, 'kind': categories, 'score': score, 'total': totals})
            # 将DataFrame存储为csv,index表示是否显示行名，default=True
            dataframe.to_csv("./mgtv/movie_"+str(year)+"_channel_"+str(channel)+".csv", index=False, sep=',')
