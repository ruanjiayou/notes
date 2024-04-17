chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, { type: 'url', url: changeInfo.url });
  }
});
// 创建右键菜单
chrome.contextMenus.create({
  id: "clear_white_hosts",
  title: "清空插件数据",
  contexts: ["all"]
});

// 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "clear_white_hosts") {
    // 在这里编写右键菜单项被点击时的处理逻辑
    console.log("Sample Context Menu clicked!");
    chrome.tabs.sendMessage(tab.id, { type: 'contextmenu', value: 'clear_white_hosts' });
  }
});