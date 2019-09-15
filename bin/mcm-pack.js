#! /usr/bin/env node
/**
 * Created by 24596 on 2019/9/7.
 */
console.log('start');

// 1.需要找到当前执行的路径  webpack.config.js

let path = require('path');
//config 配置文件
let config = require(path.resolve('webpack.config.js'));

let Compiler = require('../lib/Compiler.js');
let compiler = new Compiler(config);
compiler.hooks.entryOption.call();
//标识运行编译
compiler.run();