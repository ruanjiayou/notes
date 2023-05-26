const mongoose = require('mongoose');
const cheerio = require('cheerio');
const got = require('got').default;

mongoose.connect('mongodb://root:123456@localhost:27016/test?authSource=admin&readPreference=primaryPreferred')
const projectModel = mongoose.model('house', new mongoose.Schema({
    _id: String,
    name: String,
    address: String,
    region: String,
    total: Number,
    available: Number,

    crawled: Boolean,
    status: String, // 在建,
    format: String, // 新建 翻新?
    product: String, // 开发商
    plan_start_date: Date,// 计划开工时间
    plan_finish_date: Date,// 计划竣工时间
    type: String, // 商品房
    area_land: Number,
    area_building: Number,
    plot_ratio: Number,
    green_ratio: Number,
}, { strict: false, collection: 'house' }));
const certificationModel = mongoose.model('certification', new mongoose.Schema({
    project_id: String,
    _id: String, //预售许可证号
    buildings: String,
    issue_date: String,
}, { strict: false, collection: 'certification' }));
const pages = 19;

function getList(html) {
    const results = [];
    const $ = cheerio.load(html, { decodeEntities: true });
    const tables = $('div>table');
    const main_table = tables.eq(6)
    const contain_table = $(main_table).find('table').eq(1);
    // $(main_table).remove($(main_table).find('marquee'))
    // console.log(contain_table.html());
    const trs = $(contain_table).find('table tr');
    trs.each((i, e) => {
        // console.log($(e).html(), '??')
        if (i > 1) {
            const tds = $(e).find('td');
            const href = $(tds[0]).find('a').attr('href');
            const _id = new URL('http://218.200.147.160:83/' + href).searchParams.get('DevProjectId');
            results.push({
                name: $(tds[0]).text().trim(),
                _id,
                address: $(tds[1]).text().trim(),
                region: $(tds[2]).text().trim(),
                total: parseInt($(tds[3]).text().trim()),
                available: parseInt($(tds[4]).text().trim()),
            })
        }
    });
    return results;
}
async function getDetail(_id) {
    const resp = await got.get(`http://218.200.147.160:83/Pub_lpxx.aspx?DevProjectId=${_id}`);
    if (resp.statusCode === 200) {
        const $ = cheerio.load(resp.body, { decodeEntities: true });
        const main_table = $('table').eq(4);
        const content_table = $(main_table).find('table').eq(1);
        const keys_table = $(main_table).find('table').eq(2);
        const certifications = [];
        $(keys_table).find('tr').each((i, e) => {
            const tds = $(e).find('td');
            if (i > 0) {
                certifications.push({
                    _id: $(tds[0]).text().trim(),
                    buildings: $(tds[1]).text().trim(),
                    issue_date: $(tds[2]).text().trim(),
                })
            }
        })
        const data = { crawled: true };
        $(content_table).find('tr').each((i, e) => {
            const tds = $(e).find('td');
            if (i === 0) {

            } else if (i == 1) {
                data.format = $(tds).eq(1).text().trim();
                data.product = $(tds).eq(3).text().trim();
            } else if (i == 2) {
                data.status = $(tds).eq(1).text().trim();
                data.type = $(tds).eq(3).text().trim();
            } else if (i == 3) {

            } else if (i == 4) {
                data.plan_start_date = $(tds).eq(1).text().trim();
                data.area_land = parseFloat($(tds).eq(3).text().replace('m²', '').trim());
            } else if (i == 5) {
                data.plan_finish_date = $(tds).eq(1).text().trim();
                data.area_building = parseFloat($(tds).eq(3).text().replace('m²', '').trim());
            } else if (i == 6) {
                data.plot_ratio = parseFloat($(tds).eq(1).text().trim());
                data.green_ratio = parseFloat($(tds).eq(3).text().replace('%', '').trim());
            }
        });
        // data, certifications
        if (certifications.length) {
            await certificationModel.bulkWrite(certifications.map(item => ({
                updateOne: {
                    filter: { _id: item._id, project_id: _id },
                    update: { $set: item },
                    upsert: true
                }
            })))
        }
        await projectModel.updateOne({ _id }, { $set: data });
    } else {
        console.error(`failed: ${_id}`)
    }
}
; (async () => {
    // for (let page = pages; page <= pages; page++) {
    //     const resp = await got.get('http://218.200.147.160:83/More_xm.aspx?page=' + page, { encoding: 'utf-8' });
    //     const items = getList(resp.body);
    //     console.log('page: ' + page + ' items: ' + items.length);
    //     if (items.length) {
    //         await projectModel.bulkWrite(items.map(item => ({
    //             updateOne: {
    //                 filter: { _id: item._id },
    //                 update: {
    //                     $set: item
    //                 },
    //                 upsert: true
    //             }
    //         })))
    //     }
    // }

    const cursor = projectModel.find({  }).cursor();
    let doc = null, i = 0;
    do {
        i++;
        doc = await cursor.next();
        if (doc) {
            doc = doc.toObject();
            // console.log(doc);
            // process.exit(0);
            console.log(i)
            // await getDetail(doc._id);
            await projectModel.updateOne({ _id: doc._id }, {
                $set: {
                    plan_finish_date: new Date(doc.plan_finish_date),
                    plan_start_date: new Date(doc.plan_start_date),
                    plot_ratio: parseFloat(doc.plot_ratio),
                    area_building: parseFloat(doc.area_building),
                    area_land: parseFloat(doc.area_land),
                    green_ratio: parseFloat(doc.green_ratio),
                }
            })
        }

    } while (doc);
    console.log('ended');
    process.exit(0);
})();

/**
 * 开发形式
 * 自行开发: 1,续建: 17, 新建: 511
 * 状态
 * 竣工: 1, 在建: 528
 * 区域
 * 高新区: 51, 温泉: 101, 咸安: 377
 * 类型
 * 其他: 2, 经济适用房: 1, 拆迁安置房: 5, 商品房: 521
 * 楼盘: 529, 预售许可证: 1439, 开发商: 197家
 * 总套数: 250782, 可售套数: 51662
 * 总人口: 303.61万 总建筑面积: 38858808.66㎡ 占地面积: 20181636.16
 */