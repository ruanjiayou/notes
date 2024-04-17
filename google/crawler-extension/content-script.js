console.log('content-script.js', window)
function createElement(tag, { style = {}, ...props }) {
  const element = document.createElement(tag);
  Object.keys(style).forEach(k => {
    element.style[k] = style[k];
  });
  Object.keys(props).forEach(k => {
    element[k] = props[k];
  });
  return element;
}

let whilte_hosts = ['localhost', '127.0.0.1', '192.168.0.124'];
const CONSTANT = {
  BASE_URL: 'https://192.168.0.124',
  // 边界间距
  MARGIN: 15,
  // 本身尺寸大小
  SIZE: 32,
  // 任务状态
  LOADING: 'LOADING',
  NOMATCH: 'NOMATCH',
  MATCHED: 'MATCHED',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  ERRORED: 'ERRORED',
  IMAGES: {
    'LOADING': '<svg t="1711618051244" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3449" width="200" height="200"><path d="M384 128A64 64 13680 1 0 640 128 64 64 13680 1 0 384 128zM655.53 240.47A64 64 13680 1 0 911.53 240.47 64 64 13680 1 0 655.53 240.47zM832 512A32 32 13680 1 0 960 512 32 32 13680 1 0 832 512zM719.53 783.53A32 32 13680 1 0 847.53 783.53 32 32 13680 1 0 719.53 783.53zM448.002 896A32 32 13680 1 0 576.002 896 32 32 13680 1 0 448.002 896zM176.472 783.53A32 32 13680 1 0 304.472 783.53 32 32 13680 1 0 176.472 783.53zM144.472 240.47A48 48 13680 1 0 336.472 240.47 48 48 13680 1 0 144.472 240.47zM56 512A36 36 13680 1 0 200 512 36 36 13680 1 0 56 512z" fill="#000000" p-id="3450"></path></svg>',
    'NOMATCH': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668675516561" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2437" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M828.704099 196.575729C744.096116 112.384034 631.648434 66.016073 512 66.016073s-232.1288 46.367961-316.736783 130.559656C110.624271 280.800108 64 392.831501 64 512c0 119.199462 46.624271 231.199892 131.232254 315.424271 84.607983 84.191695 197.088348 130.559656 316.736783 130.559656s232.1288-46.367961 316.704099-130.559656c84.67163-84.255342 131.295901-196.288456 131.263217-315.455235C959.967316 392.800538 913.375729 280.800108 828.704099 196.575729zM736.00086 544.00086 544.00086 544.00086l0 192c0 17.695686-14.336138 32.00086-32.00086 32.00086s-32.00086-14.303454-32.00086-32.00086L479.99914 544.00086 288.00086 544.00086c-17.664722 0-32.00086-14.336138-32.00086-32.00086s14.336138-32.00086 32.00086-32.00086l192 0L480.00086 288.00086c0-17.664722 14.336138-32.00086 32.00086-32.00086s32.00086 14.336138 32.00086 32.00086l0 192 192 0c17.695686 0 32.00086 14.336138 32.00086 32.00086S753.696546 544.00086 736.00086 544.00086z" p-id="2438"></path></svg>',
    'MATCHED': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668678519444" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="8890" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667s-191.018667 426.666667-426.666667 426.666667S85.333333 747.648 85.333333 512 276.352 85.333333 512 85.333333z m0 128a298.666667 298.666667 0 1 0 0 597.333334 298.666667 298.666667 0 0 0 0-597.333334z" fill="#000000" fillOpacity=".05" p-id="8891"></path><path d="M813.696 813.696c166.613333-166.613333 166.613333-436.778667 0-603.392-166.613333-166.613333-436.778667-166.613333-603.392 0A64 64 0 0 0 300.8 300.8a298.666667 298.666667 0 1 1 422.4 422.4 64 64 0 0 0 90.496 90.496z" fill="#000000" p-id="8892"></path></svg>',
    'MORE': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668676061297" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3140" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M223.962372 607.897867c-52.980346 0-95.983874-43.003528-95.983874-95.983874s43.003528-95.983874 95.983874-95.983874 95.983874 43.003528 95.983874 95.983874S276.942718 607.897867 223.962372 607.897867z" p-id="3141"></path><path d="M511.913993 607.897867c-52.980346 0-95.983874-43.003528-95.983874-95.983874s43.003528-95.983874 95.983874-95.983874 95.983874 43.003528 95.983874 95.983874S564.894339 607.897867 511.913993 607.897867z" p-id="3142"></path><path d="M800.037628 607.897867c-52.980346 0-95.983874-43.003528-95.983874-95.983874s43.003528-95.983874 95.983874-95.983874 95.983874 43.003528 95.983874 95.983874S852.84596 607.897867 800.037628 607.897867z" p-id="3143"></path></svg>',
    'SYNCING': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668737203871" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="23675" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 0 1 755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 0 0 3 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l0.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92 282.7 92 96.3 275.6 92 503.8a8 8 0 0 0 8 8.2h60c4.4 0 7.9-3.5 8-7.8z m756 7.8h-60c-4.4 0-7.9 3.5-8 7.8-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 0 1 512.1 856a342.24 342.24 0 0 1-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 0 0-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-0.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 0 0-8-8.2z" p-id="23676"></path></svg>',
    'SUCCESS': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668675733182" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2715" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M512 65.983389c-245.919634 0-446.016611 200.095256-446.016611 446.016611 0 245.952318 200.064292 446.016611 446.016611 446.016611S958.016611 757.952318 958.016611 512C958.016611 266.080366 757.952318 65.983389 512 65.983389zM727.231286 438.432254 471.00766 697.439161c-0.063647 0.063647-0.192662 0.096331-0.25631 0.192662-0.096331 0.063647-0.096331 0.192662-0.192662 0.25631-2.048757 1.983389-4.575729 3.19957-6.944443 4.544765-1.183497 0.672598-2.143368 1.696116-3.392232 2.176052-3.839484 1.536138-7.904314 2.33603-11.967424 2.33603-4.095794 0-8.224271-0.799892-12.096439-2.399677-1.279828-0.543583-2.303346-1.632469-3.519527-2.303346-2.368714-1.343475-4.832039-2.528692-6.880796-4.544765-0.063647-0.063647-0.096331-0.192662-0.159978-0.25631-0.063647-0.096331-0.192662-0.096331-0.25631-0.192662l-126.016611-129.503454c-12.320065-12.672705-12.032791-32.928047 0.639914-45.248112 12.672705-12.287381 32.895364-12.063755 45.248112 0.639914l103.26354 106.112189 233.279613-235.839269c12.416396-12.576374 32.704421-12.703669 45.248112-0.25631C739.520387 405.600538 739.647682 425.85588 727.231286 438.432254z" p-id="2716"></path></svg>',
    'ERRORED': '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg t="1668675706282" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2576" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200"><path d="M512 64c-247.00852 0-448 200.960516-448 448S264.960516 960 512 960c247.00852 0 448-200.960516 448-448S759.039484 64 512 64zM694.752211 649.984034c12.480043 12.54369 12.447359 32.768069-0.063647 45.248112-6.239161 6.208198-14.399785 9.34412-22.591372 9.34412-8.224271 0-16.415858-3.135923-22.65674-9.407768l-137.60043-138.016718-138.047682 136.576912c-6.239161 6.14455-14.368821 9.247789-22.496761 9.247789-8.255235 0-16.479505-3.168606-22.751351-9.504099-12.416396-12.576374-12.320065-32.800753 0.25631-45.248112l137.887703-136.384249-137.376804-137.824056c-12.480043-12.512727-12.447359-32.768069 0.063647-45.248112 12.512727-12.512727 32.735385-12.447359 45.248112 0.063647l137.567746 137.984034 138.047682-136.575192c12.54369-12.447359 32.831716-12.320065 45.248112 0.25631 12.447359 12.576374 12.320065 32.831716-0.25631 45.248112L557.344443 512.127295 694.752211 649.984034z" p-id="2577"></path></svg>',
  }
};
const RUNTIME = {
  status: 'LOADING',
  resource_id: '',
  setStatus(s) {
    RUNTIME.status = s;
    oStatus.innerHTML = CONSTANT.IMAGES[s];
    oStatus.className = [CONSTANT.SYNCING, CONSTANT.LOADING].includes(s) ? 'spin' : '';
  },
}
const oContainer = createElement('div', {
  id: 'crawler-tool',
  className: 'crawler-tool',
  style: {
    right: '20px', top: '20px', width: '32px', height: '32px',
  }
});
const oStatus = createElement('span', { style: {} })

RUNTIME.setStatus('LOADING')

async function detect() {
  try {
    let url = window.location.href;
    RUNTIME.setStatus(CONSTANT.LOADING);
    const resp = await fetch(CONSTANT.BASE_URL + '/gw/admin/v1/admin/spider/detect?url=' + encodeURIComponent(url), {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await resp.json();
    setFrom(_.get(body, 'data.rule.config.from', 'url'))
    if (body.code === 1002) {
      RUNTIME.setStatus(CONSTANT.SUCCESS);
    } else if (body.code === -1 || body.code === 1004) {
      RUNTIME.setStatus(CONSTANT.ERRORED);
    } else if (body.code === 1000) {
      RUNTIME.setStatus(CONSTANT.NOMATCH)
    } else if (body.code === 1001) {
      rule_id = body.data.rule._id;
      RUNTIME.setStatus(CONSTANT.MATCHED);
    } else if (body.code === 1003) {
      RUNTIME.setStatus(CONSTANT.SYNCING)
    }
  } catch (e) {
    RUNTIME.setStatus(CONSTANT.ERRORED)
  } finally {
  }
}

function crawl() {

}

function main() {
  // 事件部分
  // 解除限制
  document.body.oncontextmenu = null;
  document.body.style.userSelect = 'auto';

  // 插入文档和拖拽
  if (!document.getElementById('crawler-tool')) {
    oContainer.appendChild(oStatus);
    document.body.appendChild(oContainer);
    // 开始拖拽
    let mouse = {};
    function move(event) {
      // 盒子的位置 = 鼠标与页面之间的距离 - 鼠标与盒子之间的距离
      oContainer.style.left = event.pageX - mouse.x + "px";
      oContainer.style.top = event.pageY - mouse.y + "px";
    }
    oContainer.onmousedown = function (event) {
      // 记录鼠标与盒子之间的距离
      mouse = {
        x: event.offsetX,
        y: event.offsetY
      }
      document.addEventListener('mousemove', move);
    }
    // 拖拽结束
    document.onmouseup = function (event) {
      document.removeEventListener('mousemove', move)
    }
  }

  // 寻找 m3u8
  (function () {
    let i = 0;
    let timer = setInterval(() => {
      i++
      const files = window.performance.getEntries('resource');
      files.forEach(file => {
        if (file.initiatorType === 'xmlhttprequest' && file.name.includes('.m3u8')) {
          console.log(file.name);
          clearInterval(timer);
          timer = null;
        }
      });
      if (i > 20) {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  })();

  // websocket 通信
  const ws = new WebSocket('ws://localhost:3000');
  ws.onopen = function (e) {
    console.log('ws open');
  };
  ws.onclose = function (e) {
    console.log('ws close');
  };
  ws.onmessage = function (e) {
    try {
      const data = JSON.parse(e.data);
      if (data.type === 'resource_change') {
        RUNTIME.setStatus(data.status);
      }
    } finally {

    }
  };
  if (chrome) {
    if (chrome.runtime) {
      // url push 事件
      chrome.runtime.onMessage.addListener(function (request, sender, sendReponse) {
        if (request.type === 'url') {
          // matchCrawler(request.url);
          console.log(request.url, 'changeed')
        } else if (request.type === "contextmenu" && request.value === 'clear_white_hosts') {
          // 清空 Chrome 扩展中的存储数据
          chrome.storage.sync.clear(function () {
            alert("存储数据已清空");
          });
        }
      });
    }
    // 保存数据到本地存储
    function saveData(key, value) {
      chrome.storage.local.set({ [key]: value }, function () {
        console.log('Data saved: ' + key + ' - ' + value);
      });
    }

    // 从本地存储中读取数据
    function readData(key, callback) {
      chrome.storage.local.get(key, function (result) {
        console.log('Data read: ' + key + ' - ' + result[key]);
        callback(result[key]);
      });
    }
    if (chrome.storage) {
      readData('white_hosts', function (result) {
        if (!result) {
          saveData('white_hosts', JSON.stringify(whilte_hosts))
        } else {
          whilte_hosts = JSON.parse(result);
        }
      })
    }
  }
}

main();
// // 自定义事件
// const events = {
//   events: {},
//   emit: (event, data) => {
//     const e = new CustomEvent(event, { detail: data })
//     document.dispatchEvent(e);
//   },
//   on: (event, fn) => {
//     if (!events.events[event]) {
//       events.events[event] = [fn]
//     } else {
//       events.events[event].push(fn);
//     }
//     document.addEventListener(event, fn);
//   },
// }
// events.on('resource_change', (e) => {
//   const data = e.detail;
//   if (data.status) {
//     RUNTIME.setStatus(data.status);
//   }
// })

// ws处理

