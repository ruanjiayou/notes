# exceljs

1. 创建工作簿
  ```js
    const workbook = new ExcelJS.Workbook();
    // 设置工作簿属性
    workbook.creator = 'ruan';
    workbook.lastModifiedBy = 'ruan';
    workbook.created = new Date(1985, 8, 30);
    workbook.modified = new Date();
    workbook.lastPrinted = new Date(2016, 9, 27);
  ```
2. 添加工作表
  ```js
  const sheet = workbook.addWorksheet('矩阵统计', {
    headerFooter: {
      firstHeader: "fengshows",
      firstFooter: "2024-05-24"
    },
    views: [{ state: 'frozen', xSplit: 4, ySplit: 3 }]
  });
  ```
3. 处理单个单元格
  1. 合并单元格
   ```js
  worksheet.mergeCells('A1:B3');
  worksheet.mergeCells('C1:D3');
  const cell = worksheet.getCell('A1');
  cell.value = '分类';
  ```
  2. 重复行
   ```js
  // 该行将重复复制第一行两次，但将替换第二行和第三行
  // 如果第三个参数为 true，则它将插入2个新行，其中包含行 “One” 的值和样式
  ws.duplicateRow(1,2,false)
  ```
  3. 验证
   ```js
   // 指定有效值的列表（One，Two，Three，Four）。
   // Excel 将提供一个包含这些值的下拉列表。
   worksheet.getCell('A1').dataValidation = {
     type: 'list',
     allowBlank: true,
     formulae: ['"One,Two,Three,Four"']
   };   
   // 指定范围内的有效值列表。
   // Excel 将提供一个包含这些值的下拉列表。
   worksheet.getCell('A1').dataValidation = {
     type: 'list',
     allowBlank: true,
     formulae: ['$D$5:$F$5']
   };
  ```
4. 样式
```js
// 为单元格分配样式
ws.getCell('A1').numFmt = '0.00%';

// 将第3列设置为“货币格式”
ws.getColumn(3).numFmt = '"£"#,##0.00;[Red]\-"£"#,##0.00';

// 将第2行设置为 Comic Sans。
ws.getRow(2).font = { name: 'Comic Sans MS', family: 4, size: 16, underline: 'double', bold: true };
```
4.1 数字
```js
// 显示为“ 1.60％”
ws.getCell('B1').value = 0.016;
ws.getCell('B1').numFmt = '0.00%';
```
  2. 字体
  ```js
  ws.getCell('A2').font = {
    name: 'Arial Black',
    color: { argb: 'FF00FF00' },
    family: 2,
    size: 14,
    italic: true,
    vertAlign: 'superscript' // 垂直对齐
  };
  ```
  | 字体属性  | 描述                             | 示例值                                                                          |
  |-----------|--------------------------------|---------------------------------------------------------------------------------|
  | name      | 字体名称。                        | 'Arial', 'Calibri', etc.                                                        |
  | family    | 备用字体家族。整数值。             | 1 - Serif, 2 - Sans Serif, 3 - Mono, Others - unknown                           |
  | scheme    | 字体方案。                        | 'minor', 'major', 'none'                                                        |
  | charset   | 字体字符集。整数值。               | 1, 2, etc.                                                                      |
  | size      | 字体大小。整数值。                 | 9, 10, 12, 16, etc.                                                             |
  | color     | 颜色描述，一个包含 ARGB 值的对象。 | { argb: 'FFFF0000'}                                                             |
  | bold      | 字体 粗细                        | true, false                                                                     |
  | italic    | 字体 倾斜                        | true, false                                                                     |
  | underline | 字体 下划线 样式                 | true, false, 'none', 'single', 'double', 'singleAccounting', 'doubleAccounting' |
  | strike    | 字体 删除线                      | true, false                                                                     |
  | outline   | 字体轮廓                         | true, false                                                                     |
  | vertAlign | 垂直对齐                         | 'superscript', 'subscript'                                                      |

 3. 对齐
  ```js
  ws.getCell('B1').alignment = {
    // 居中
    vertical: 'middle',
    horizontal: 'center',
    // 换行
    wrapText: true,
    // 缩进1
    indent: 1,
    // 文本旋转
    textRotation: 30  
  };
  ```
  | 水平的  | 垂直        | 文本换行 | 自适应 | 缩进    | 阅读顺序 | 文本旋转  |
  |---------|-------------|----------|--------|---------|----------|-----------|
  | left    | top         | true     | true   | integer | rtl      | 0 to 90   |
  | center  | middle      | false    | false  |         | ltr      | -1 to -90 |
  | right   | bottom      | vertical |        |         |          |           |
  | fill    | distributed |          |        |         |          |           |
  | justify | justify     |          |        |         |          |           |
4.4 边框
```js
ws.getCell('A3').border = {
  bottom: { style: 'double', color: { argb: 'FF00FF00' } },
  right: { style: 'double', color: { argb: 'FF00FF00' } }
};
```
thin
dotted
dashDot
hair
dashDotDot
slantDashDot
mediumDashed
mediumDashDotDot
mediumDashDot
medium
double
thick
4.5 填充
```js
// 从左到右用蓝白蓝渐变填充A3
ws.getCell('A3').fill = {
  type: 'gradient',
  gradient: 'angle',
  degree: 0,
  fgColor:{argb:'FFFFFF00'},
  bgColor:{argb:'FF0000FF'},
  stops: [
    {position:0, color:{argb:'FF0000FF'}},
    {position:0.5, color:{argb:'FFFFFFFF'}},
    {position:1, color:{argb:'FF0000FF'}}
  ]
};
```