# debian

## 安装软件
- [docker](https://www.idcspy.com/32737.html)
  - sudo apt update
  - 安装通过HTTPS添加新存储库所需的软件包: `sudo apt install apt-transport-https ca-certificates curl software-properties-common gnupg2`
  - 使用以下curl命令导入存储库的GPG密钥: `curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -`
  - 将稳定的Docker APT存储库添加到系统的软件存储库列表中: `sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"`
  - 更新apt软件包列表并安装最新版本的Docker CE: `sudo apt update`, `sudo apt install docker-ce`
  - 安装完成后，Docker服务将自动启动。验证: `sudo systemctl status docker`
  - docker -v
- [node npm]
  - sudo apt install node npm
- 防火墙
  - sudo apt install ufw
- nginx
  - sudo apt install nginx