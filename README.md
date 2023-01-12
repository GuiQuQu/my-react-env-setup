# 从零开始搭建 React 环境

# Step 1

**初始化 `package.json`**

```shell
# 当然，也可以不加最后的 -y ，那样的话，跟着命令行提示一步一步走，按提示可以输入自己的配置

npm init -y
```

# Step 2

**初始化 `tsconfig.json`**
需要先全局安装 tsc

```
tsc --init
```

来帮助我们生成 `tsconfig.json` 文件,不过我们也可以自己新建

我们生成`es5`标准的代码,这种最常用

# Step 3

**安装 webpack 和 webpack-dev-server**

```
npm i webpack webpack-cli webpack-dev-server --save-dev
```

# Step 4

webpack 基本配置

新建文件 `webpack.config.js`

```js
// webpack.config.js
const path = require("path");
const prod = process.env.NODE_ENV === "production";
module.exports = {
  // 入口文件
  entry: "./src/index.tsx",
  mode: prod ? "production" : "development",
  // 输入文件
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
  },
  // 开发服务器配置
  devServer: {
    open: true, // 自动打开浏览器
    port: 3000, // 服务器运行端口
  },
};
```

# Step 5

**配置跨环境和执行命令**

否则在不同的 os 下执行的命令不同会造成问题,从而保证了在不同 os 下一套运行命令

```
npm i cross-env --save-dev
```

在 `package.json` 中配置执行的命令,见 `scripts`项

# Step 6

**配置 ts 支持**

webpack 依靠各种 loader 来对打包之前的文件进行预处理,这里使用`ts-loader`进行简单的预处理,将 ts 代码转换为 js 代码
`ts-loader` 通过使用 `tsc` 来对 ts 代码进行编译,因此`tsconfig`也是有效的

```
npm install ts-loader --save-dev
```

在 `webpack.config.js` 中

```js
module.exports = {
    ...
    module: {
        rules: [
            // 写loader的配置,常见的有两项
            test: "..." // 处理文件类型的正则表达式
            use: [...] // 使用的loader
        ]
    }
}

```

`ts-loader`的配置如下

```js
            {
                test: /\.(ts|tsx)$/,
                exclude: "/node_modules/", // 排除该文件夹下的文件
                use: ["ts-loader"]
            }
```

我们在`src/index.tsx` 下写下如下内容

```ts
// src/index.tsx
console.log("Hello World");

const fn = (a: string, b: number): number => {
  console.log(a);
  return b + 20;
};

let c = fn("abc", 10);
console.log(c);
export {};
```

此时运行 `npm run build`,可以成功打包

# 使用 es6 新特性

上面的配置仅仅只是语法翻译,当我们使用输入 promise 之类的新特性时 `ts-loader`不会进行翻译

我们可以使用以下代码验证

```ts
// src/index.tsx
console.log("Hello World");

const fn = (a: string, b: number): number => {
  console.log(a);
  return b + 20;
};

let c = fn("abc", 10);
console.log(c);

const pro = new Promise((r, e) => {
  r(10);
});
export {};
```

运行 `npm run build`之后,我们可以发现 Promise 是原样输出的,尽管我们在`tsconfig.json`中设置了`target:"es5"`,
因此我们需要将 es6 这些新特性进行翻译,这里需要使用 babel 和 core-js

这里的思路是 ts(x) -> 不兼容低版本的 js(by ts-loader) -> 兼容低版本的 js(by babel)

因此我们需要在 ts-loader 的基础上继续配置

安装

```
npm install @babel/core @babel/preset-env babel-loader core-js@3 --save-dev
```

`@babel/core` babel 的核心模块
`@babel/preset-env` babel 的一组最常见的预设(插件的合集),用来将 es6 的代码向 es5 进行翻译
`core-js` 在低版本的 js 下对 es6 的新特性进行模拟,从而使得我们可以进行使用

因此 loader 的调用时按照数组从后向前的,因此我们需要按照如下配置
配置的格式请参考[@babel/preset-env 说明文档](https://www.babeljs.cn/docs/babel-preset-env)和 [babel-loader 说明文档](https://www.webpackjs.com/loaders/babel-loader/)

babel 的预设和插件可以单独写文件进行配置,就像 babel 文档中所写的那样,不过 babel-loader 这里也可以进行配置,这里采用了第二种方法

```js
// webpack.config.js
const babelOptions = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {browsers: ["last 2 versions", "safari >= 7"]},
                useBuiltIns: "usage",
                corejs: 3,
            }
        ]
    ],
    plugins: [],
    cacheDirectory: true, // 设置缓存,来帮助加快编译速度
}

module.exports = {
    ...
    module: {
        rules:[
            {
                ...
                use: [{ loader: "babel-loader", options: babelOptions }, "ts-loader"],
            }
        ]
    }
}
```

再次运行`npm run build`,可以发现编译结果已经变样

`@babel/preset-env` + `core-js` 看上去是一个不错的选择,但是也存在一些问题,可以参看[这篇文档](https://juejin.cn/post/6844903855558246408#heading-2),因为这里不是开发公共库的项目,因此先将另一种配置方法放到一边。

# 配置 resolve

webpack 打包默认只认识 `['.js', '.json', '.wasm']`这些后缀,因此当我们引入 ts 或者 tsx 时,wabpack 找不到文件,因此没法帮助我们合并打包代码,这里需要我们自行修改,参考 webpack 中文文档的说明[resolve.extensions](https://www.webpackjs.com/configuration/resolve/#resolveextensions)

这里我指定解析 `tsx and ts` 扩展,并保留原扩展名,这时我们导入时可以不添加扩展名,(因为我加上 tsx 的扩展名也会报错...),

```js
  resolve: {
    extensions: [".tsx", "ts", "..."],
  },
```

**验证方法**
新建文件`a.tsx`,写下如下代码

```ts
// a.tsx
const pro = new Promise((r, e) => {
  r(10);
});

const np = pro.then((v) => console.log(v));

export { np };
```

并在`src/index.tsx`中引入,然后运行 `npm run build`

可以发现不配置该项就会找不到 Module

# 配置 html 模板

我们需要一个最基础的 html 页面来充当我们的模板,就像在`create-react-app`中那样,这里使用一个 webpack 插件解决

```
npm install html-webpack-plugin --save-dev
```

在 `webpack.config.js` 中引入并使用,并且指定一个我们自己创建的模板`/public/index.html`

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
...
module.exports = {
    ...
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html"
        })
    ],
}
```

执行 `npm run start` 查看一下效果

# 安装 react 相关包

```shell
npm install react react-dom --save
npm install @types/react @types/react-dom --save--dev
```

**尝试使用 react**

```tsx
// src/index.tsx
import * as React from "react";
import ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <div>Hello World</div>
  </React.StrictMode>
);
```

运行 `npm run start`,可以看到 Hello World 正常输入

**尝试使用路径别名**

新建 `components/App/App.tsx` 和 `components/App/index.tsx`,写入简单的输出 Hello World 的 react 组件,并在 `src/index.tsx`中使用,并且使用路径别名引入

```tsx
//src/index.tsx
import * as React from "react";
import ReactDOM from "react-dom/client";
import App from "@/components/App"; // 在tsconfig.json使用baseUrl+paths进行了别名配置

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

然后我们就会导入 App 那行出错,明明 vscode 都有提示。通过我们自己使用 tsc 手动翻译 ts 的结果(执行` tsc -p .\tsconfig.json`),我们发现别名没有被翻译,因此 webpack 找不到这个文件,无法进行打包,我们需要在 webpack 中也配置别名,`tsconfig.json`的配置只保证了 tsc 不会出错.
参考[webpack 文档-resolve-alias](https://www.webpackjs.com/configuration/resolve/#resolvealias)

```js
...
module.exports = {
    ...
    resolve: {
        ...,
        alias: { // 将@与src目录对应,写./src会出错
        "@": path.resolve(__dirname, "src"),
        },
  },
}
```

# 使用 css

使用 css 需要我们继续配置 webpack-loader
这里我们需要安装以下包

```
npm install css-loader style-loader postcss postcss-loader --save-dev
npm install postcss-preset-env --save-dev
```

`postcss-preset-env` 是 postcss 需要使用的一组预设
css-loader 负责加载 css 文件,style-loader 负责将样式加载到网页上,postcss-loader 使用 postcss和postcss-preset-env处理兼容问题
postcss 需要配置,请参看[webpack-postcss-loader](https://www.webpackjs.com/loaders/postcss-loader/)
loader 的配置如下, [配置样例参照](https://github.com/csstools/postcss-plugins/blob/main/plugin-packs/postcss-preset-env/INSTALL.md#webpack)

对于postcss,可以理解成css的babel工具,利用各式各样的插件来处理css,增加css的功能

使用 `style-loader` 引入的css样式是使用`<style></style>`写在html的`<head>`标签中的,还可以使用另外一个插件来将css注入html中,该插件采用外联样式表的形式注入
```
npm install --save-dev mini-css-extract-plugin
```
使用该插件提供的loader替换`style-loader`即可,记得需要先将插件新建添加
```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  ...
  module: {
    rules:[
      ...,
      {
        test: /\.css$/
        use: [MiniCssExtractPlugin.loader,...]
      }
    ]
  },
  ...,
  plugins: [
    ...,
    new MiniCssExtractPlugin(),
  ]
}
```

下面的示例使用的都是`style-loader`
```js
// webpack.config.js
const postcssOptions = {
  plugins: [["postcss-preset-env", { browsers: "last 2 versions" }]],
};
...

module.exports = {
    ...
    module: {
        rules: [
            ...,
            {
                test: /\.css$/,
                use: [
                "style-loader",
                "css-loader",
                {
                    loader: "postcss-loader",
                    options: { postcssOptions: postcssOptions },
                },
                ],
            },
        ]
    }
}
```
我们自行创建文件`index.css`,随便设定一些样式,并引入`index.tsx`,我们可以发现样式已经生效了

# 使用less

less是对css的一层包装,最终还是会转成css,因此配置只需要在css上稍作修改即可

安装
```
npm install less less-loader --save-dev
```
```js
// webpack.config.js
const postcssOptions = {
  plugins: [["postcss-preset-env", { browsers: "last 2 versions" }]],
};
...

module.exports = {
    ...
    module: {
        rules: [
            ...,
            {
                test: /\.less$/,
                use: [
                "style-loader",
                "css-loader",
                {
                    loader: "postcss-loader",
                    options: { postcssOptions: postcssOptions },
                },
                "less-loader",
                ],
            },
        ]
    }
}
```

# css-module

[webpack-css-loader-modules](https://webpack.docschina.org/loaders/css-loader/#modules)
这里主要修改css-loader的options
修改css-loader,改为以下内容,这里我们配置xxx.module.css使用css module功能,但是这个原来的css正则也会匹配这种后缀,因此
在css部分我们需要将其排除(参考[create-react-app上的写法](https://github.com/facebook/create-react-app/blob/d960b9e38c062584ff6cfb1a70e1512509a966e7/packages/react-scripts/config/webpack.config.js#L514))

```js
// webpack.config.js
// 预定义一些重复使用的值
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;

const cssModuleOptions = {
  // 设定使用类名
  localIdentName: prod ? "[local]-[hash:base64:5]" : "[name]__[local]",
};

module.exports = {
  ...
  module: {
    rules: [
      {
        test:cssRegex,
        exclude:cssModuleRegex,
        ...
      },
      {
        test:cssModuleRegex,
        include: path.resolve(__dirname,"src"),
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: { postcssOptions: postcssOptions },
          },
        ]
      },

    ]
  }
}
```
对于less来说是类型,仅仅更换一下前缀,然后添加less-loader即可

修改完成了,我们在ts中引入xxx.module.less时,tsc编译不通过,提示我们找不到对应的模块,此时该模块需要我们自己声明
新建文件`src/my-react-app.d.ts` 声明导入模块的类型,css也是同理

```ts
declare module "*.module.less" {
    const classes: { readonly [key: string]: string };
    export default classes;
};

declare module "*.module.css" {
    const classes: { readonly [key: string]: string };
    export default classes;
}
```
在使用了css module之后,由于类名不固定,因此我们无法直接在react组件中使用类名,而要使用这种方式
```ts
import style from "./app.module.less"
// 这里会导入一个映射表,给出原类名,可以得到修改之后的类名
// 使用style.原类名,for example 
<div className={style.app}></div>
```

**注:**在我的vscode中不能import之后给的提示下面没有css文件,这个应该是vscode的问题,我在一个使用create-react-app创建的项目也没有自动补全成功

# 图片文件引入

首先,我们需要声明导入的这些文件的类型,和 `xxx.module.css`类似,参考[create-react-app上的写法](https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/lib/react-app.d.ts)
```ts
// my-react-app.d.ts
// 查看my-react-app.d.ts
```

**注**:使用 `url-loader`和`file-loader` 是webpack4的做法

这里主要用到两个loader
- `file-loader` [file-loader说明](https://cloud.tencent.com/developer/section/1477518)
- `url-loader` [url-loader说明](https://cloud.tencent.com/developer/section/1477545)

url-loader 功能类似于 file-loader，但是在文件大小（单位 byte）低于指定的限制时,直接返回该二进制文件base64编码的结果

url-loader是对file-loader的一种封装,当我们使用了一个之后loader,需要避免使用另一个loader
[这里有关于base64编码的说明](https://c.runoob.com/front-end/693/)

使用url-loader时必须要装file-loader,要不然会报找不到file-loader的错

```shell
npm install url-loader file-loader --save-dev
```

具体的配置请参考`webpack.config.js`

**注:** 使用了file-loader和url-loader之后,它仅仅只能保证你在ts/js中导入图片时给给你一个正确的地址,没有解决在css中使用url引入图片和直接在html中写img标签找不到图片的问题

在webpack5中,我们采用[webpack-asset](https://webpack.docschina.org/guides/asset-modules)

这里采用[asset配置](https://webpack.docschina.org/guides/asset-modules#general-asset-type),来达到和url-loader相同的效果
配置如下,而且解决了css中图片路径的问题
```js
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        type: "asset",
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 },  // 转base64的上限大小
        },
        generator: {
          filename: "static/media/[name].[hash].[ext]"
        }
        // url-loader 配置
        // loader: "url-loader",
        // options: {
        //   limit: 1024 * 8, // 小于8kb的图片直接转换为base64编码来减少网络请求次数
        //   name: "static/media/[name].[hash].[ext]", // 经过url-loader处理之后的文件的文件名
        // },
      },
```
# 网站内容结构组织

在网站上线之后网站中的内容需要一个合理的组织方式,例如下面这种方式
```
- ip:port(dist)
  - index.html
  - static
    - css
      ...
    - js
      ...
    - media
      ...
```
各种类型文件如何组织,除了我们自己在webpack中进行配置外,为了保证网络访问正常,我们还得配置这些路径的前缀,即 `publicPath`
配置 `publicPath`.然后后面的各种静态文件在经过webpack打包转化路径时,会将 `publicPath`当作前缀加上。

比如说,我有一个网站,放在 `http://localhost:3000/m` 这个子目录下。使用了一张图片,目录为 `http://localhost:3000/m/static/a.png`,
那么我希望的img标签中src的内容就应该是`/m/static/a.png`, `static/a.png`是我在url-loader中指定的转换路径,那前面还必须拼一段路径,才可以保证正常访问,这段前面拼的路径就是`publicPath = "/m/"`.

在开发环境下,一般我们直接指定`publicPath = "/"`即可,然后根据我们自己的目录组织结构,就可以找到对应的静态资源.
而在上线环境下,我们可以指定``publicPath`为我们使用的cdn网站的域名,然后再cdn网站上使用和开发时相同的静态资源组织形式,就可以直接转换好上线的资源路径

# css使用图片

目前我的解决方法是[webpack-asset](https://webpack.docschina.org/guides/asset-modules)

在css中使用图片方式,我们也可以在`webpack.config.js`的`resolve`配置别名路径,以免每次都要写相对路径
# html中图片路径

使用`html-loader` 处理`html`文件处理,然后交给asset模块或者是url-loader处理

```shell
npm install html-loader --save-dev
```
简单配置即可
```js
// webpack.config.js
 {
        test: /\.html$/,
        include: publicPath,
        use: ["html-loader"],
}
```

# 使用source-map

[参考内容](https://webpack.docschina.org/guides/development/#using-source-maps)

source-map可以更好的帮助我们定位代码错误,只在开发环境下使用

配置`devtool`选项

当调试`ts`文件时,还需要在`tsconfig.json`中启用`sourceMap`选项
```js
module.exports = {
  ...,
  devtool: prod ? undefined : "inline-source-map",
}
```

