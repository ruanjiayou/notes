
## 背景环境
`2019-01-03`,`macOS 10.3.0`, 
安装教程: [官方传送门](https://reactnative.cn/docs/getting-started.html)
- 安装xcode: 应用商店(6G+)
- 安装homebrew
- 安装node: `brew install node`
- 设置npm点源
  ```bash
  npm config set registry https://registry.npm.taobao.org --global
  npm config set disturl https://npm.taobao.org/dist --global
  ```
- `npm i -g yarn react-native-cli`

## 环境安装
- 第一个项目:
  ```bash
  `~$ react-native init firstRN`
  `~$ cd firstRN`
  `~$ react-native run-iso`
  ```
- 运行Android要模拟器,如genymotion
  下载virtualBox: https://www.virtualbox.org/wiki/Downloads
  下载AS: https://developer.android.com/studio/?hl=zh-cn
  注册genymotion
  安装genymotion: https://www.genymotion.com/download/
  下载模拟设备
  网络选择bridge 不要默认

  ```

  ```

- 关于测试
  刷新: cmd+r或rr
  ios中 cmd+i
  Android中 cmd+m 打开js-remote/living reload/hot reload/
- 请求API
  ```js
  fetch(url, {method})
    .then(response=>{
      // response 是个promise...
      return response.json()
    })
    .then(res=>{
      // 这才是body
      console.log(res);
    })
    .catch(err=>{
      console.log(err)
    })
  ```
- Button组件: 单标签,title是要显示的文字
- 点击事件: onPress
- 添加原生Java组件: https://reactnative.cn/docs/native-modules-android/
- 权限检查
  ```js
  PermissionsAndroid
    .request(PermissionsAndroid.PERMISSIONS.READ_SMS)
    .then(granted => {
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        //TODO:
      }
    })
    .catch(err=>{
      console.log(err);
    })
  ```
- 行内 transform 竟然是对象的数组
- 全屏: StatusBar组件
- mac测试安卓真机: 
  - 已经安装好Androidstudio
  - 下载配置好Android Sdk
  - 将android手机通过USB数据线连接Mac，打开终端输入system_profiler SPUSBDataType
  - 找到对应设备的Vendor ID
  - vim ~/.android/adb_usb.ini
  - 打开Android手机的开发者模式和usb调试，重新拔插usb
  - 打开AndroidStudio 运行一个正常的项目,选择真机设备
  - 再运行`react-native run-android`
- 编译apk: `$ cd android && ./gradlew installRelease`
  > No resource found that matches the given name 'android:TextAppearance.Material.Widget.Button.Colored'
  ```java
  subprojects {
    afterEvaluate {project ->
        if (project.hasProperty("android")) {
            android {
                compileSdkVersion 27
                buildToolsVersion '27.0.3'
            }
        }
    }
  }
  ```
- 没签名安装不了: 
  - android/app: `keytool -importkeystore -srckeystore my-release-key.keystore -destkeystore my-release-key.keystore -deststoretype pkcs12`
  - vim ~/.gradle/gradle.properties
    ```
    MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
    MYAPP_RELEASE_KEY_ALIAS=my-key-alias
    MYAPP_RELEASE_STORE_PASSWORD=7758258
    MYAPP_RELEASE_KEY_PASSWORD=7758258
    ```
  - 将签名添加到项目的gradle配置文件 android/app/build/gradle
- 上面的证书有问题改用AS自带的
  - bulid菜单 -> generate signed APK
  - create new 
  - key store path ~/Desktop/test.jks
  - password 123456
  - alias project
  - password 123456
  - android/gradle.properties 添加
    ```
    MYAPP_RELEASE_STORE_FILE=test.jks
    MYAPP_RELEASE_KEY_ALIAS=project
    MYAPP_RELEASE_STORE_PASSWORD=123456
    MYAPP_RELEASE_KEY_PASSWORD=123456
    ```
  - android/app/build.gradle中添加如下内容
    ```
    signingConfigs {
        release {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
    ```
  - buildTypes的release再加一行 `signingConfig signingConfigs.release`
    ```
    buildTypes {
        release {
            // minifyEnabled enableProguardInReleaseBuilds
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"

            signingConfig signingConfigs.release
        }
    }
    ```
  - 必须再项目根目录执行打包: `cd android && ./gradlew assembleRelease`
- gif图片显示: app/build.gradle 加上
  ```
  implementation 'com.facebook.fresco:fresco:1.10.0'
  implementation 'com.facebook.fresco:animated-gif:1.10.0' 
  ```
## 碰到的问题
- xcrun: error: unable to find utility "instruments", not a developer tool or in PATH
    > sudo xcode-select -s /Applications/Xcode.app/Contents/Developer/
- Could not install the app on the device, read the error above for details.
Make sure you have an Android emulator running or a device connected and have
set up your Android development environment
  > 设置adb的sdk位置? 莫名其妙自动好了
  > `javac -version`
  > `which javac`
- 不小心自动导入了cluster 就炸了, 删掉重装都不行 cmd+r 重启
  > 点下方的reloadJS就好了... WTF!
- android中fetch老是network request failed
  > 不要用localhost用局域网ip~~~
- state中的array不更新?
  > 用.map()生成新的数组!
- react-native-elements报错: 按提示来还是不行
  > 重启...好了
- 编译缓存: 安步骤来清缓存(加sudo),安装时不要加sudo...
- icon不出现: `react-native link react-native-vector-icons`
