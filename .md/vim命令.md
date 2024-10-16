
- 命令模式: ESC或Ctrl+[
- 编辑模式: i或insert
- 
- 命令模式

  移动
  - 移动光标到行首: ^
  - 移动光标到行尾: $
  - 上一页: ctrl+b
  - 下一页: ctrl+f
  - 移动到行尾: G
  - 移动到首行: 1G
  - 移动到文件头: gg
  - 移动文件末尾: GG 
  - 移动到当前窗口的首行: H
  - 移动到当前窗口的中间: M
  - 移动到当前窗口都末尾: L
  - 移动到下个单词都词首: w
  - 重复w2次: 2w
  - 移动到下个单词都词尾: e
  - 重复e5次: 5e
  - 移动到前一个单词都词首: b
  - 移动到下一句: )
  - 移动到上一句: (
  - 移动到下三句: 3)
  - 向上移动一个段落: {
  - 向下移动一个段落: }
  - 向下移动三个段落: }

  插入
  - i
  - I
  - a
  - A
  - o
  - O

  查找
  - 查找text(n键下一个,N键上一个): /text
  - 反向查找text(n键下一个,N键上一个): ?text
  
  替换命令
  - 

  跳行
  - :n 跳到第n行

  撤销
  - u
  - :undo

  删除
  - 删除当前光标后面的一个单词: dw
  - x
  - 3x
  - X
  - dl
  - dh
  - dd
  - 删除全部: `ggdG`, `%d`
  - dj
  - dk
  - 10d
  - D
  - d$
  - kdgg
  - jdG
  - :1,10d
  - :11,$d
  - J

  拷贝与粘贴
  - yw 复制一个单词
  - yy 复制一行
  - nyy
  - p
  - shift+p
  - :1,10 co 20
  - :1,$ to $
  - ddp
  - p
  - xp

  退出
  - :wq
  - :x
  - ZZ
  - :q!
  - :e!

- vim /usr/share/vim/.vimrc
- vim ~/.vimrc
```conf
" 设置编码 "
set fileencodings=utf-8,ucs-bom,gb18030,gbk,gb2312,cp936
set termencoding=utf-8
set encoding=utf-8
" 显示行号 "
set nu
" 主题配色 "
colorscheme moloki/jellybeans/Tomorrow-Night-Eighties/
syntax on
" 突出当前行 "
set cul
" 突出当前列 "
set cuc
" 启用鼠标 "
set mouse=a
set selection=exclusive
set selectmode=mouse,key
" 显示括号匹配 "
set showmatch
" 设置缩进 "
set tabstop=2
set shiftwidth=2
set autoindent
" 设置粘贴 "
set paste
" 显示状态栏和光标当前位置 "
set laststatus=2
set ruler
# vim配置变更立即生效 
autocmd BufWritePost $MYVIMRC source $MYVIMRC
```

https://segmentfault.com/a/1190000016330314

## 遇到的问题
- deepin中无法复制到系统的剪贴板: vim ~/.vimrc << set paste