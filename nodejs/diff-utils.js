const fs = require('fs');
const path = require('path');
const { simplecc } = require('simplecc-wasm');
const { diffWordsWithSpace } = require('diff');

// 标记符号
const F = {
  SPLIT: '|',
  CONCAT: '&',
  DEL_ST: '{',
  DEL_ED: '}',
  ADD: '+',
  REM: '-',
};
function read(filepath) {
  return fs.readFileSync(filepath, { encoding: 'utf-8' }).toString();
}
function write(filepath, txt) {
  fs.writeFileSync(path.join(__dirname, filepath), txt, { flag: 'a' })
}
// 删除标点符号
function clear(str) {
  return str.replace(/[\p{P}\p{S}\s]/gu, '');
}
// 暂存修改
function save_diff(txt) {
  return txt.replace(/-(.+?)-/g, '').replace(/\+/g, '')
}
// 撤销修改
function undo_diff(txt) {
  return txt.replace(/\+(.+?)\+/g, '').replace(/-/g, '')
}
// 繁体转简体
function t2s(txt) {
  return simplecc(txt, 't2s');
}
// 秒数转字幕时间
function n2t(seconds) {
  const millis = Math.round((seconds % 1) * 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  seconds = Math.floor((seconds % 60));
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0").substring(0, 3)}`;
}

/**
 * 唱词转srt
 * @param {string} libretto 唱词文件
 * @param {array} srt_list large-v2 生成的segments数组
 * @returns srt字符串
 */
function txt2srt(libretto, srt_list) {
  // 3.处理标点符号空格并转简体
  const libretto_str_arr = libretto.split('\n');
  const libretto_simple_text = libretto_str_arr.map(line => clear(t2s(line.trim()))).join('\n');
  const srt_simple_text = srt_list.map(a => a.text + '\n').join('').trim();

  // 4.计算文本差异并生成符号
  let diffed_txt = '';
  const diffs = diffWordsWithSpace(libretto_simple_text, srt_simple_text);
  diffs.forEach((part, nth) => {
    // part {count,added,removed,value}
    if (part.added) {
      if (part.value.trim().includes('\n')) {
        // 多个换行说明这段需要删除
        diffed_txt += F.DEL_ST + part.value.trim() + F.DEL_ED;
      } else if (part.value.includes('\n')) {
        diffed_txt += part.value.split('\n').map(v => v !== '' ? F.ADD + v + F.ADD : '').join(F.CONCAT + '\n')
      } else {
        diffed_txt += `${F.ADD}${part.value}${F.ADD}`;
      }
    } else if (part.removed) {
      diffed_txt += part.value.split('\n').map(v => v !== '' ? F.REM + v + F.REM : '').join(F.SPLIT);
    } else {
      // 原样输出
      diffed_txt += part.value;
    }
  });
  const diff_arr = diffed_txt.trim().split('\n');

  const full_info_arr = diff_arr.map((line, n) => ({
    diff: line,
    text: srt_list[n].text,
    start: srt_list[n].start,
    end: srt_list[n].end,
  }));
  console.log('此时全量srt和符号srt的长度必定相同', full_info_arr.length, srt_list.length)

  // 生成最终字幕文件
  const dealed_arr = [];
  let deleted = '', deleted_str = '';
  let info = full_info_arr.shift();
  while (info) {
    if (info.diff.includes(F.DEL_ST)) {
      deleted = true;
      deleted_str = info.diff.substring(0, info.diff.indexOf(F.DEL_ST));
    }
    if (deleted || info.diff.match(/^\+([^-\+]+?)\+(\&)?$/)) {
      // 多行和单行删除 跳过
    } else {
      if (info.diff.includes(F.SPLIT)) {
        // 删除分割符拆分,分配时长,等待重新循环
        const segments = info.diff
          .split(F.SPLIT)
          .map(diff_seg => {
            // 还原为文稿简体
            const original_txt = save_diff(diff_seg);
            // 还原为字幕文本
            const dealed_txt = undo_diff(diff_seg);
            return {
              original_txt,
              dealed_txt,
              acc_ts: (info.end - info.start) * original_txt.length / info.text.length,
            }
          });
        // 拆分后重新返回列表头部
        const additions = [];
        let st = info.start;
        segments.forEach(seg => {
          additions.push({
            diff: seg.dealed_txt,
            text: seg.original_txt,
            start: st,
            end: st + seg.acc_ts,
          });
          st += seg.acc_ts;
        });
        full_info_arr.unshift(...additions);
      } else if (info.diff.includes(F.CONCAT)) {
        // 连接下一行,等待重新循环
        const next = full_info_arr.shift();
        const new_one = {
          diff: info.diff.replace(F.CONCAT, '') + next.diff,
          text: info.text + next.text,
          start: info.start,
          end: next.end,
        };
        full_info_arr.unshift(new_one);
      } else {
        // 已无分割合并符号,处理+-,完成一行
        dealed_arr.push({
          text: undo_diff(info.diff),
          start: info.start,
          end: info.end,
        });
      }
    }

    if (info.diff.includes(F.DEL_ED)) {
      info.diff = deleted_str + info.diff.substring(info.diff.indexOf(F.DEL_ED) + F.DEL_ED.length);
      deleted = false;
      deleted_str = '';
      // diff的小问题,删除在中间需要连接
      info.diff && full_info_arr.unshift(info);
    }
    // 处理下一行 diff
    info = full_info_arr.shift();
  }
  console.log(dealed_arr.length, libretto_str_arr.length)
  console.log('处理后的字幕对象和原始文稿一样长', dealed_arr.length, libretto_str_arr.length);

  return dealed_arr.map((item, no) => {
    return `${no + 1}\n${n2t(item.start)} --> ${n2t(item.end)}\n${libretto_str_arr[no]}\n\n`;
  }).join('\n');
}

module.exports = txt2srt;