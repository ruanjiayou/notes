const ExcelJS = require('exceljs');

(async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ruan';
  workbook.lastModifiedBy = 'ruan';
  workbook.created = new Date(1985, 8, 30);
  workbook.modified = new Date();
  workbook.lastPrinted = new Date(2016, 9, 27);
  // 2.添加工作表
  const ws = workbook.addWorksheet('矩阵统计', {
    headerFooter: {
      firstHeader: "fengshows",
      firstFooter: "2024-05-24"
    },
    views: [{ state: 'frozen', xSplit: 4, ySplit: 3 }]
  });
  ws.columns = [
    { width: 10 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
    { width: 15.4 },
    { width: 18.6 },
    { width: 14.7 },
    { width: 15 },
    { width: 16 },
    { width: 30 },
    { width: 16 },
    { width: 16 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 13 },
    { width: 15 },
  ];
  ws.getRow(3).height = 60;
  function setCell(xy, attrs) {
    const cell = ws.getCell(xy);
    for (let k in attrs) {
      cell[k] = attrs[k];
    }
  }
  function setRange(range, attrs) {
    const [r1, c1, r2, c2] = range.split('');
    const rs = r1.charCodeAt(0);
    const re = r2.charCodeAt(0);
    const cs = parseInt(c1, 10)
    const ce = parseInt(c2, 10);
    for (let k = rs; k <= re; k++) {
      for (let m = cs; m <= ce; m++) {
        const r = Buffer.from([k]).toString('ascii');
        const cell = `${r}${m}`
        setCell(cell, attrs)
      }
    }
  }

  // 顶部冻结部分
  ws.mergeCells('A1:B3');
  ws.mergeCells('C1:D3');
  ws.mergeCells('E1:E3');
  ws.mergeCells('F1:F3');
  ws.mergeCells('G1:G3');
  ws.mergeCells('H1:H3');
  setRange('A1D3', {
    font: {
      size: 14, color: { theme: 0 }, name: '微软雅黑', charset: 134
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF122B49' },
      bgColor: { argb: 'FF0000FF' }
    },
  });
  setRange('E1H3', {
    font: {
      size: 12, color: { theme: 0 }, charset: 134
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF122B49' },
      bgColor: { argb: 'FF0000FF' }
    },
  });
  setRange('I1S3', {
    font: {
      size: 11, color: { theme: 0 }, name: '微软雅黑', charset: 134
    },
    border: {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF122B49' },
      bgColor: { argb: 'FF0000FF' }
    },
  });
  setRange('T1V3', {
    font: { size: 12, color: { theme: 0 } },
    border: {
      top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    },
    alignment: {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF122B49' },
      bgColor: { argb: 'FF0000FF' }
    },
  })
  ws.getCell('A1').value = '分类';
  ws.getCell('C1').value = '产品名称-平台';
  ws.getCell('E1').value = '用户数量';
  ws.getCell('F1').value = '上周数量';
  ws.getCell('G1').value = '7日变化量';
  ws.getCell('H1').value = '7日变化率';

  ws.mergeCells('I1:S1');
  ws.mergeCells('I2:L2');
  ws.mergeCells('N2:P2');
  ws.mergeCells('Q2:S2');
  ws.getCell('I1').value = '地理位置细分';
  ws.getCell('I2').value = '港澳台';
  ws.getCell('N2').value = '东南亚10国';
  ws.getCell('Q2').value = '主要一带一路国家';
  ws.getCell('I3').value = '香港用户数';
  ws.getCell('J3').value = '台湾用户数';
  ws.getCell('K3').value = '澳门用户数';
  ws.getCell('L3').value = '港澳台总用户规模7日变化量';
  ws.getCell('M3').value = '港澳台总用户规模7日变化率';
  ws.getCell('N3').value = '文莱、柬埔寨、印度尼西亚、老挝、马来西亚、缅甸、菲律宾、新加坡、泰国、越南';
  ws.getCell('O3').value = '东南亚总用户规模7日变化量';
  ws.getCell('P3').value = '东南亚总用户规模7日变化率';
  ws.getCell('Q3').value = '东南亚10国、土耳其、以色列、沙特阿拉伯、 阿联酋、印度、巴基斯坦、俄罗斯、波兰';
  ws.getCell('R3').value = '一带一路沿线国家总用户规模7日变化量';
  ws.getCell('S3').value = '一带一路沿线国家总用户规模7日变化率';

  ws.mergeCells('T1:U2');
  ws.mergeCells('V1:V2');
  ws.getCell('T1').value = '性别细分';
  ws.getCell('T3').value = '男性用户数';
  ws.getCell('U3').value = '女性用户数';
  ws.getCell('V1').value = '年龄细分';
  ws.getCell('V3').value = ' 18-34岁用户数';


  // 左侧冻结部分
  

  await workbook.xlsx.writeFile(__dirname + "/new.xlsx");
})();

