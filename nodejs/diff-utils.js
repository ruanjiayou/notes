const fs = require('fs');
const path = require('path');
const { simplecc } = require('simplecc-wasm');
const { diffWordsWithSpace } = require('diff');

del('subtitles/step2-diff.txt');

// 标记符号
const SYMBOL = {
  SPLIT: '{|}',
  CONCAT: '{&}',
  MODIFY: '}-+{',
  DEL_ST: 'x{',
  DEL_ED: '}x',
}
// 相对路径转绝对路径
function rel(file) {
  return path.join(__dirname, file);
}
// 删除文件
function del(fullpath) {
  if (fs.existsSync(fullpath)) {
    fs.unlinkSync(fullpath);
  }
}

// 删除符号
function clear(str) {
  return str.replace(/[.,/#!$%^&*;:{}=_`~()'"\[\]?<>\\|@+-]/g, '').replace(/(“)|(”)|(《)|(》)|(\s*)/g, '');
}

function pure_diff(txt) {
  return txt.replace(/-\{(.+?)\}-/g, '').replace(/(\+\{)|(\}\+)/g, '')
}
function apply_diff(txt) {
  return txt.replace(/\+\{(.+?)\}\+/g, '').replace(/(-\{|()\}-)/g, '')
}

function read(filepath) {
  return fs.readFileSync(filepath, { encoding: 'utf-8' }).toString();
}

function write(filepath, txt) {
  fs.writeFileSync(path.join(__dirname, filepath), txt, { flag: 'a' })
}

function t2s(txt) {
  return simplecc(txt, 't2s');
}
// 字幕时间字符串转毫秒数
function t2n(srtTime) {
  const [hours, minutes, seconds] = srtTime.split(":");
  const [secs, millis] = seconds.split(",");

  const h = parseInt(hours, 10) * 3600000; // 小时 -> 毫秒
  const m = parseInt(minutes, 10) * 60000; // 分钟 -> 毫秒
  const s = parseInt(secs, 10) * 1000;     // 秒 -> 毫秒
  const ms = parseInt(millis, 10);         // 毫秒

  return h + m + s + ms;
}

function n2t(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const millis = milliseconds % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0").substring(0, 3)}`;
}


module.exports = function txt2srt(document, srt_list) {
  // 3.处理标点符号空格并转简体
  const document_str_arr = document.split('\n');
  const document_dealed_arr = document_str_arr.map(line => clear(t2s(line.trim())));

  let srt_dealed = '';
  const srt_obj_arr = [];
  srt_list.forEach(item => {
    const simple = clear(item.text)
    srt_obj_arr.push({
      start: item.start,
      end: item.end,
      sentence: item.text,
      s: simple,
    });
    srt_dealed += `${simple}\n`;
  });
  // 4.计算文本差异并生成符号
  let diffed_txt = '';
  const diffs = diffWordsWithSpace(document_dealed_arr.join('\n'), srt_dealed.trim());
  diffs.forEach((part, nth) => {
    // part {count,added,removed,value}
    if (part.added) {
      if (part.value.trim().includes('\n')) {
        // 多个换行说明这段需要删除
        // 首尾换行交换
        const start_br = part.value.startsWith('\n');
        const end_br = part.value.endsWith('\n');
        const txt = `${start_br ? '\n' : ''}x{${part.value.trim()}}x${end_br ? '\n' : ''}`;
        diffed_txt += txt;
        // write('subtitles/step2-diff.txt', txt);
      } else if (part.value === '\n') {
        // 多了个换行就是被分割了需要合并
        diffed_txt += '{&}\n'
        // write('subtitles/step2-diff.txt', `{&}\n`);
      } else if (part.value.includes('\n')) {
        const is_start = part.value.startsWith('\n')
        const txt = `${is_start && !diffs[nth - 1].value.endsWith('}-') ? '\n' : ''}+{${part.value.trim()}}+${is_start ? '' : '{&}\n'}`
        diffed_txt += txt;
        // write('subtitles/step2-diff.txt', txt);
      } else {
        const txt = `+{${part.value}}+`;
        diffed_txt += txt;
        // write('subtitles/step2-diff.txt', txt)
      }
    } else if (part.removed) {
      // 有换行就需要分割时间区间，一般应该只有一个换行在开头
      let real_value = part.value;
      let txt = '';
      if (part.value.startsWith('\n')) {
        txt += '{|}'
        real_value = part.value.replace(/^\n/, '')
        if (real_value && !real_value.endsWith('\n')) {
          txt += `-{${real_value}}-`;
          real_value = '';
        }
      }
      if (real_value.endsWith('\n')) {
        real_value = real_value.replace(/\n$/, '')
        if (real_value) {
          txt += `-{${real_value}}-`
          real_value = '';
        }
        txt += '{|}'
      }
      if (real_value) {
        txt += `-{${real_value}}-`
      }
      diffed_txt += txt;
      // write('subtitles/step2-diff.txt', txt)
    } else {
      // 原样输出
      diffed_txt += part.value;
      // write('subtitles/step2-diff.txt', part.value);
    }
  });

  const full_info_arr = diffed_txt
    .trim()
    .split('\n')
    .map((line, n) => ({
      diff: line,
      raw: srt_obj_arr[n].sentence,
      start: srt_obj_arr[n].start,
      end: srt_obj_arr[n].end,
    }));
  console.log('此时全量srt和符号srt的长度必定相同', full_info_arr.length, srt_obj_arr.length)

  // 生成最终字幕文件
  const dealed_arr = [];
  let deleted = '', deleted_str = '';
  let info = full_info_arr.shift();
  while (info) {
    if (info.diff.includes(SYMBOL.DEL_ST)) {
      deleted = true;
      deleted_str = info.diff.substring(0, info.diff.indexOf(SYMBOL.DEL_ST));
    }
    if (deleted || info.diff.replace(/\{\&\}$/, '').match(/^\+\{(.+)\}\+$/)) {
      // 多行和单行删除 跳过
    } else {
      if (info.diff.includes(SYMBOL.SPLIT)) {
        // 删除分割符拆分,分配时长,等待重新循环
        // 计算拆分的时长 acc_ts
        const segments = info.diff
          .split(SYMBOL.SPLIT)
          .map(diff_seg => {
            // 还原为文稿简体
            const original_txt = pure_diff(diff_seg);
            // 还原为字幕文本
            const dealed_txt = apply_diff(diff_seg);
            return {
              original_txt,
              dealed_txt,
              acc_ts: (info.end - info.start) * original_txt.length / info.raw.length,
            }
          });
        // 拆分后重新返回列表头部
        const additions = [];
        let st = info.start;
        segments.forEach(seg => {
          additions.push({
            diff: seg.dealed_txt,
            raw: seg.original_txt,
            start: st,
            end: st + seg.acc_ts,
          });
        });
        full_info_arr.unshift(...additions);
      } else if (info.diff.includes(SYMBOL.CONCAT)) {
        // 连接下一行,等待重新循环
        const next = full_info_arr.shift();
        const new_one = {
          diff: info.diff.replace(SYMBOL.CONCAT, '') + next.diff,
          raw: info.raw + next.raw,
          start: info.start,
          end: next.end,
        };
        full_info_arr.unshift(new_one);
      } else {
        // 已无分割合并符号,处理+-,完成一行
        const line = apply_diff(info.diff);
        dealed_arr.push({
          line,
          start: info.start,
          end: info.end,
        });
      }
    }

    if (info.diff.includes(SYMBOL.DEL_ED)) {
      info.diff = deleted_str + info.diff.substring(info.diff.indexOf(SYMBOL.DEL_ED) + SYMBOL.DEL_ED.length);
      deleted = false;
      deleted_str = '';
      // diff的小问题,删除在中间需要连接
      if (info.diff !== '') {
        full_info_arr.unshift(info);
      }
    }
    // 处理下一行 diff
    info = full_info_arr.shift();
  }

  // 处理diff算法的一个小问题,前一行末尾是删除,后一行是添加,本该是一行的
  document_dealed_arr.forEach(function (line, n) {
    const curr = dealed_arr[n];
    if (line === curr.line) {

    } else {
      const next = dealed_arr[n + 1];
      if (line === curr.line + next.line) {
        curr.line += next.line;
        curr.end = next.end;
        dealed_arr.splice(n + 1, 1);
      }
    }
  });
  console.log('处理后的字幕对象和原始文稿一样长', dealed_arr.length, document_str_arr.length);

  return dealed_arr.map((item, no) => {
    return `${no + 1}\n${n2t(item.start)} --> ${n2t(item.end)}\n${document_str_arr[no]}\n${item.line}\n`;
  }).join('\n');

}