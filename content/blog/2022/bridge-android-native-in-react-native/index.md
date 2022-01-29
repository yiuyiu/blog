---
title: react-native中native侧相关实现-安卓篇(kotlin)
date: "2022-01-29"
description: 本文内容包括在安卓代码中如何添加react-native依赖；如何整个activity都用作react-native容器，以及部分fragment使用react-native；如何在js中调用native模块最后简单介绍了如何实现native ui模块以便在js侧使用。
---

完全按照官方的教程发现有点问题，所以这里做了些整理，另外官网的例子都是 java 的，本篇的代码都是 kotlin 的。

### 环境安装

根据官方[https://reactnative.dev/docs/environment-setup](https://reactnative.dev/docs/environment-setup) 里的到 **Creating a new application**部分的教程安装依赖即可

### 项目配置

1. 将 native 项目放入 android 文件夹，项目根目录是 node_modules 以及 package.json
2. 安装 react-native 以及对应的 react 版本，这里我安装的是 `react-native@0.66.4` 以及 `react@17.0.2`
3. **build.gradle(root)**里新增依赖找寻地址，完整配置如下

   ```groovy
   // Top-level build file where you can add configuration options common to all sub-projects/modules.
   buildscript {
       repositories {
           google()
           mavenCentral()
       }
       dependencies {
           classpath "com.android.tools.build:gradle:7.0.4"
           classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.20"

           // NOTE: Do not place your application dependencies here; they belong
           // in the individual module build.gradle files
       }
   }
   allprojects {
       repositories {
           google()
           mavenCentral()
           maven {
               // All of React Native (JS, Android binaries) is installed from npm
               url "$rootDir/../node_modules/react-native/android"
           }
           maven {
               // Android JSC is installed from npm
               url("$rootDir/../node_modules/jsc-android/dist")
           }
       }
   }

   task clean(type: Delete) {
       delete rootProject.buildDir
   }
   ```

4. **build.gradle(app)**里新增 `react-native` 以及 `android-jsc` 依赖，以及添加 autoLink 完整配置如下

   ```groovy
   plugins {
       id 'com.android.application'
       id 'kotlin-android'
   }

   android {
       compileSdk 31

       defaultConfig {
           applicationId "com.example.filepersistencetest"
           minSdk 21
           targetSdk 31
           versionCode 1
           versionName "1.0"

           testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
       }

       buildTypes {
           release {
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
           }
       }
       compileOptions {
           sourceCompatibility JavaVersion.VERSION_1_8
           targetCompatibility JavaVersion.VERSION_1_8
       }
       kotlinOptions {
           jvmTarget = '1.8'
       }
   }

   dependencies {

       implementation 'androidx.core:core-ktx:1.7.0'
       implementation 'androidx.appcompat:appcompat:1.4.0'
       implementation 'com.google.android.material:material:1.4.0'
       implementation 'androidx.constraintlayout:constraintlayout:2.1.2'
       testImplementation 'junit:junit:4.+'
       androidTestImplementation 'androidx.test.ext:junit:1.1.3'
       androidTestImplementation 'androidx.test.espresso:espresso-core:3.4.0'
       implementation "com.facebook.react:react-native:+" // From node_modules
       implementation "org.webkit:android-jsc:+"
   }
   apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
   ```

5. 更改 **settings.gradle** 里的设置，增加 autoLink 配置

   这里遇到了个问题 **Build was configured to prefer settings repositories over project repositories but repository 'maven' was added by build file 'build.gradle'，查了下是由于 android 引入了新方式定义 repositories，要想和上面的两个** .gradle 配合使用的话 **settings.gradle** 如下

   ```groovy
   //dependencyResolutionManagement {
   //    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
   //    repositories {
   //        google()
   //        mavenCentral()
   //        jcenter() // Warning: this repository is going to shut down soon
   //    }
   //}
   rootProject.name = "AndroidProjectName"
   apply from: file("../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesSettingsGradle(settings)
   include ':app'
   ```

### react-native 组件作为整个 activity 使用

1. native 测代码如下

   ```kotlin
   class MyReactActivity :  AppCompatActivity(), DefaultHardwareBackBtnHandler {
       private lateinit var mReactRootView: ReactRootView
       private lateinit var mReactInstanceManager: ReactInstanceManager
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           SoLoader.init(this, false)
           mReactRootView = ReactRootView(this)
           val packages: List<ReactPackage> = PackageList(application).packages
           mReactInstanceManager = ReactInstanceManager.builder()
               .setApplication(application)
               .setCurrentActivity(this)
               .setBundleAssetName("index.android.bundle")
               .setJSMainModulePath("index")
               .addPackages(packages)
               .setUseDeveloperSupport(BuildConfig.DEBUG)
               .setInitialLifecycleState(LifecycleState.RESUMED)
               .build()
   //        // The string here (e.g. "MyReactNativeApp") has to match
   //        // the string in AppRegistry.registerComponent() in index.js
           mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null)
           setContentView(mReactRootView)
       }
       override fun onPause() {
           super.onPause()
           mReactInstanceManager?.onHostPause(this)
       }

       override fun onResume() {
           super.onResume()
           mReactInstanceManager?.onHostResume(this, this)
       }

       override fun onDestroy() {
           super.onDestroy()
           mReactInstanceManager?.onHostDestroy(this)
           mReactRootView?.unmountReactApplication()
       }

       override fun onBackPressed() {
           if(mReactInstanceManager !=null){
               mReactInstanceManager.onBackPressed()
           }else{
               super.onBackPressed()
           }
       }

       override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
           if(keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null){
               mReactInstanceManager.showDevOptionsDialog()
               return true
           }
           return super.onKeyUp(keyCode, event)
       }
       override fun invokeDefaultOnBackPressed() {
           super.onBackPressed()
       }
   }
   ```

2. **AndroidManifest.xml** 配置如下

   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:tools="http://schemas.android.com/tools"
       package="com.example.filepersistencetest">

       <uses-permission android:name="android.permission.INTERNET" />

       <application xmlns:tools="http://schemas.android.com/tools"
           android:allowBackup="true"
           android:icon="@mipmap/ic_launcher"
           android:label="@string/app_name"
           android:roundIcon="@mipmap/ic_launcher_round"
           android:supportsRtl="true"
           android:theme="@style/Theme.FilePersistenceTest"
           xx
           tools:targetApi="28">
           <activity
               android:name=".MyReactActivity"
               android:exported="true"
               android:label="@string/app_name"
               android:theme="@style/Theme.AppCompat.Light.NoActionBar">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />

                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>
           </activity>
           <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
       </application>

   </manifest>
   ```

3. rn 测启动服务，android 测启动 app 即可，android 测目前我找不到设置端口的方式，可以通过在 android 里打开开发弹窗，设置 bundle 地址即可

### native 页面布局嵌套 react-native 组件

1. `Application` 类需要修改

   ```kotlin
   class MyApplication: Application(), ReactApplication {
       override fun onCreate() {
           super.onCreate()
           SoLoader.init(this, false)
       }
       private val mReactNativeHost = object: ReactNativeHost(this){
           override fun getUseDeveloperSupport(): Boolean {
               return BuildConfig.DEBUG
           }

           override fun getPackages(): MutableList<ReactPackage> {
               return PackageList(this).packages
           }
       }
       override fun getReactNativeHost(): ReactNativeHost {
           return mReactNativeHost
       }
   }

   ```

2. 修改 **AndroidManifest.xml** 中的 application name 为对应名称，这里是和上面的类名保持一致`android:name=".MyApplication"`
3. native 侧页面代码如下，通过点击事件将某个布局替换成 react-native 组件

   ```kotlin
   class ReactNativeFragment : AppCompatActivity(), DefaultHardwareBackBtnHandler {
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           setContentView(R.layout.activity_react_native_fragment)
           val mButton:Button = findViewById(R.id.replaceBtn)
           mButton.setOnClickListener {
               val reactNativeFragment = ReactFragment.Builder()
                   .setComponentName("MyReactNativeApp") //和AppRegistry要一致
                   .setLaunchOptions(getLauchOptions("test message"))
                   .build()
               supportFragmentManager.beginTransaction().add(R.id.reactNativeFragment, reactNativeFragment).commit()
           }
       }
   		// 用于向rn测传递props
       private fun getLauchOptions(message: String): Bundle{
           val initialProperties = Bundle()
           initialProperties.putString("message", message)
           return initialProperties
       }
       override fun invokeDefaultOnBackPressed() {
           super.onBackPressed();
       }
   }
   ```

4. 页面布局文件如下

   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:app="http://schemas.android.com/apk/res-auto"
       xmlns:tools="http://schemas.android.com/tools"
       android:layout_width="match_parent"
       android:layout_height="match_parent"
       android:orientation="vertical"
       tools:context=".ReactNativeFragment">
       <View
           android:layout_width="match_parent"
           android:layout_height="200dp"
           />
       <Button
           android:layout_width="wrap_content"
           android:layout_height="wrap_content"
           android:id="@+id/replaceBtn"
           android:text="替换react native 组件"
           />
       <FrameLayout
           android:layout_width="match_parent"
           android:layout_height="0dp"
           android:layout_weight="1"
           android:background="@color/teal_200"
           android:id="@+id/reactNativeFragment" />
   </LinearLayout>
   ```

在 native 页面中嵌套了 react-native 组件，这个组件还是运行在打包好的 bundle 里的，不过上面的配置是默认指向 **index.android.bundle** 文件的，如果项目是跑在 **index.js**上的就会报错

### react-native 调用 native 模块

1. native 侧模块类编写

   `@ReactMethod` 就是 rn 测调用的方法名， `getName` 返回的就是 react-native 侧从 `NativeModules` 里获取到的模块名

   ```kotlin
   class CalendarModule(context: ReactApplicationContext): ReactContextBaseJavaModule(context){
       override fun getName(): String {
           return "CalendarModule"
       }
       @ReactMethod
       fun createCalendarEvent(name: String, location: String) {
           Log.d(
               "CalendarModule", "Create event called with name: " + name
                       + " and location: " + location
           )
       }
   }
   ```

2. 注册 native 模块

   ```kotlin
   // 将native模块加入ReactPackage
   class MyAppPackage : ReactPackage {
       override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
           return emptyList()
       }

       override fun createNativeModules(
           reactContext: ReactApplicationContext
       ): List<NativeModule> {
           val modules: MutableList<NativeModule> = ArrayList()
           modules.add(CalendarModule(reactContext))
           return modules
       }
   }
   ```

3. 加入 reactNativeHost 的包里，这个 host 可以是整个 activity 就是文中的 react-native 组件作为整个 activity 使用部分。可以进行如下配置，注意看这里的 packages 就是在原先的 packages 上添加了我们自己定义的 package

   ```kotlin
   class MyReactActivity :  AppCompatActivity(), DefaultHardwareBackBtnHandler {
       private lateinit var mReactRootView: ReactRootView
       private lateinit var mReactInstanceManager: ReactInstanceManager
       override fun onCreate(savedInstanceState: Bundle?) {
           super.onCreate(savedInstanceState)
           SoLoader.init(this, false)
           mReactRootView = ReactRootView(this)
   				val packages = getPackages()
   				mReactInstanceManager = ReactInstanceManager.builder()
               .setApplication(application)
               .setCurrentActivity(this)
               .setBundleAssetName("index.android.bundle")
               .setJSMainModulePath("index")
               .addPackages(packages)
               .setUseDeveloperSupport(BuildConfig.DEBUG)
               .setInitialLifecycleState(LifecycleState.RESUMED)
               .build()
           mReactRootView.startReactApplication(mReactInstanceManager, "MyReactNativeApp", null)
           setContentView(mReactRootView)
       }
   		fun getPackages(): ArrayList<ReactPackage>{
          val packages = PackageList(application).packages
          packages.add(MyAppPackage())
          return packages
       }
   }
   ```

   另外如果是在 application 里做了配置，就是对应上面的 react-native 组件嵌套在 activity 中使用的可以进行如下配置

   ```kotlin
   class MyApplication: Application(), ReactApplication {
       override fun onCreate() {
           super.onCreate()
           SoLoader.init(this, false)
       }
       private val mReactNativeHost = object: ReactNativeHost(this){
           override fun getUseDeveloperSupport(): Boolean {
               return BuildConfig.DEBUG
           }

           override fun getPackages(): MutableList<ReactPackage> {
               val packages = PackageList(this).packages
   						packages.add(MyAppPackage())
   						return packages
           }
       }
       override fun getReactNativeHost(): ReactNativeHost {
           return mReactNativeHost
       }
   }
   ```

### react-native 使用 native ui 组件

rn 中我们调用的 `View` 以及 `ScrollView` 等其实是官方为我们封装好了的 native 组件。那我们改如何实现并且在 rn 中使用呢~

这里我以 `RecyclerView` 实现的 ui 组件为例

#### native 侧

1. ui 组件本身的逻辑如下

```kotlin
class ViewContainer(context: Context, attr: AttributeSet?): LinearLayout(context , attr) {
    init {
        LayoutInflater.from(context).inflate(R.layout.view_conainer, this)
        val rv: RecyclerView = findViewById(R.id.list)
        rv.layoutManager = LinearLayoutManager(context)
        rv.adapter = LinearAdapter()
    }
    inner class LinearAdapter: RecyclerView.Adapter<LinearAdapter.ViewHolder>(){
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val item = LayoutInflater.from(context)
                .inflate(R.layout.recyclerview_item, parent, false)
            return ViewHolder(item)
        }
        inner class ViewHolder(view: View): RecyclerView.ViewHolder(view){
            val textView: TextView = view.findViewById(R.id.text)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.textView.text = "item: $position"
        }

        override fun getItemCount(): Int {
           return 100
        }
    }
}
```

1. 构造 viewManager

viewManager 是管理 view 的，负责更新 view 的属性，以及将 native 的事件传递到 js 层。

其中 `getName` 就是组件在 js 层引入时候的名称。 `createViewInstance` 如其名称一样，构造实例。另外通过 `@ReactProp` 标签可以声明接受的 js 侧传入的 prop 值。

```kotlin
class FlowViewManager: SimpleViewManager<ViewContainer>() {
    override fun getName(): String {
        return "FlowView"
    }

    override fun createViewInstance(reactContext: ThemedReactContext): ViewContainer {
        return ViewContainer(reactContext, null)
    }
		@ReactProp(name="padding")
    fun setPadding(view: ViewContainer, padding: Int){
        view.setPadding(padding, padding, padding, padding)
    }
}
```

1. 在 package 中注册 viewManager

```kotlin
class ViewPackage: ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): MutableList<NativeModule> {
        return ArrayList()
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): MutableList<ViewManager<*,*>> {
        return mutableListOf(FlowViewManager())
    }
}
```

#### js 侧

js 侧则很简单，只是需要在利用 `requireNativeComponent` 引入即可。另外注意在组件上要设置 style，默认宽高都是 0.

```jsx
import {requireNativeComponent} from 'react-native'
const FLowView = requireNativeComponent('FlowView')
...
return (<FlowView padding=10 style={{width: '100%', height: 100}} />
```

### 参考链接

- [react-native 组件作为整个 activity 使用(官方)](https://reactnative.dev/docs/integration-with-existing-apps)
- [react-native 组件嵌套在 activity 中局部使用(官方)](https://reactnative.dev/docs/integration-with-android-fragment)
- [https://www.netguru.com/blog/bridging-native-ui-components-in-the-react-native](https://www.netguru.com/blog/bridging-native-ui-components-in-the-react-native)
