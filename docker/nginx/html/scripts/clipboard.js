function copy(str) {
  const node = document.createElement('textarea');
  node.value = str;
  node.setAttribute('readonly', '');
  node.style.position = 'absolute';
  node.style.left = '-9999px';
  document.body.appendChild(node);

  const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;

  node.select();
  document.execCommand('copy');
  document.body.removeChild(node);

  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}