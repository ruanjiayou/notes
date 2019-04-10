## mac
- 安装: brew install nmap
- 查看本地路由与接口: nmap --iflist
- 扫描网络在线主机: nmap 192.168.1.1/24
- 扫描指定主机上的端口: nmap -p 443 192.168.1.11
- 检测指定主机的操作系统版本: nmap -O 192.168.1.11
- 扫描指定主机防火墙开启状态: nmap -sA 192.168.1.11
- 

## nmap
- 获取ip:
  - host 网址
  - host 域名
  - dig 域名
- 是否存活:
  - ping ip
  - nmap -sP -script discovery
- 扫描在线主机: nmap -sP 11.11.11.*
- 探测IP协议: nmap -PO ip
- 获取系统概况: nmap -A ip (暴力形式容易被发现)
- 探测防火墙:
  - 探测是否有防火墙: nmap -PN ip
  - 探测防火墙规则: nmap -sA ip
  - TCP window扫描: nmap -sw ip
  - FIN扫描: nmap -sF ip (FIN扫描方式用于识别端口是否关闭)
- TCP扫描:
  - nmap -sT -p -pn ip
  - nmap -sT -p -Pn 11.11.11.1-254 (所有子网,费时)
  - nmap -sL 192.168.1.0/24
- SYN扫描:
  - nmap -sS -p -Pn ip
- UDP扫描: nmap -sU ip (UDP扫描费时,所以去掉-p-,默认扫描)
- Xmas扫描: nmap -sX-p-Pn ip
- Null扫描: nmap -sN -p-Pn ip
- 绕开鉴权: nmap -script=auth 192.168.1.*
- 探测操作系统: nmap -O ip
- 探测软件版本: nmap -sTV-p--Pn ip
- 探查局域网内更多服务: nmap -n --script=broadcase ip

- 扫描计划:
  - 碎片化
    - nmap -f ip
    - nmap -mtu 16 ip
  - 诱饵:
    - nmap -D rnd:10 TARGET
    - nmap -D decoy1,decoy2,decoy3 target
  - MAC地址欺骗:
    - nmap -sT -PN -spoof-mac aa:bb:cc:dd:ee:ff target
    - nmap -spoof-mac Scisio ip (-spoof-mac可以根据厂商名字伪造不同mac地址)
  - 发送间隔时间控制: nmap -scan_delay 5ms ip
  - 发送错误校验: nmap -badsum target
  - Http方法: nmap -p 80,443 --script http-methods scanme.nmap.org
  - 发现文件: nmap -sV--script http-enum ip
  - 判断是否使用默认端口: nmap -sV-script=smtp-strangeport ip
  - 利用第三方数据库: nmap --script external ip

### 参考
- https://blog.csdn.net/u012318074/article/details/73187420