const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const postcssPresetEnv = require("postcss-preset-env");
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;
const srcPath = path.resolve(__dirname, "src");
const distPath = path.resolve(__dirname, "dist");
const publicPath = path.resolve(__dirname, "public");
const appPublicPath = "/";
const cssModuleOptions = {
  localIdentName: isProduction ? "[local]-[hash:base64:5]" : "[name]__[local]",
};

const babelOptions = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { browsers: ["last 2 versions", "safari >= 7"] },
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
  ],
  plugins: [],
  cacheDirectory: true, // 设置缓存,来帮助加快编译速度
};

const postcssOptions = {
  plugins: [[postcssPresetEnv({ browsers: "last 2 versions" })]],
};

module.exports = {
  // 入口文件
  entry: "./src/index.tsx",
  mode: isProduction ? "production" : "development",
  // 输入文件
  output: {
    path: distPath,
    filename: "static/js/bundle.js",
    publicPath: appPublicPath,
    clean: true, // 在每次构建之前先清理dist文件夹,否则两次构建结果会放到一起
    pathinfo: false,
  },
  // 开发服务器配置
  devServer: {
    open: true, // 自动打开浏览器
    port: 3000, // 服务器运行端口
    static: {
      publicPath: appPublicPath,
    },
  },
  devtool: isDevelopment ? "source-map" : undefined,
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        include: srcPath,
        use: [{ loader: "babel-loader", options: babelOptions }, "ts-loader"],
      },
      {
        test: cssRegex,
        exclude: cssModuleRegex,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: { postcssOptions: postcssOptions },
          },
        ],
      },
      {
        test: cssModuleRegex,
        include: srcPath, // 只对src目录下文件生效
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              modules: cssModuleOptions,
            },
          },
          {
            loader: "postcss-loader",
            options: { postcssOptions: postcssOptions },
          },
        ],
      },
      {
        test: lessRegex,
        exclude: lessModuleRegex,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: { postcssOptions: postcssOptions },
          },
          "less-loader",
        ],
      },
      {
        test: lessModuleRegex,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader", // 指明在调用css-loader之前使用了几个loader
            options: {
              importLoaders: 3,
              modules: cssModuleOptions,
            },
          },
          {
            loader: "postcss-loader",
            options: { postcssOptions: postcssOptions },
          },
          "less-loader",
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/,
        type: "asset",
        parser: {
          dataUrlCondition: { maxSize: 8 * 1024 }, // 转base64的上限大小
        },
        generator: {
          filename: "static/media/[name].[hash].[ext]",
        },
      },
      {
        test: /\.html$/,
        include: publicPath,
        use: ["html-loader"],
      },
    ],
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js",".json"],
    alias: {
      "@": srcPath,
      "@assets": path.resolve(srcPath, "assets"),
    },
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "static/css/[name].[contenthash:8].css",
    }),
  ],
};
