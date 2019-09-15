/**
 * Created by 24596 on 2019/9/7.
 */
let path = require('path');
let fs = require('fs');
let babylon = require('babylon');
let tranverse = require('@babel/traverse').default;   //default  es6 模块
let generator = require('@babel/generator').default;
let types = require('@babel/types');
let ejs = require('ejs');
//babylon   主要就是把源码转化成ast
//@babel/traverse
//@babel/types
//@babel/generator

class Compiler {
    constructor(config) {
//    output  entry
        this.config = config
    //    需要保存入口文件路径
        this.entryId = './src/index.js'
    //    需要保存所有的模块依赖
        this.modules = {

        };
        this.entry = config.entry;  //入口路径
        //工作路径
        this.root = process.cwd()
    }
    getSource(modulePath){
        let content = fs.readFileSync(modulePath,'utf8')
        return content
    }
    parse(source,parentPath){ // AST 解析语法树

        let ast = babylon.parse(source);
        let dependencies = [];   //存放依赖的数组;
        tranverse(ast,{
            CallExpression(p){     // 执行 a(); require(a.js)
                let node = p.node   //对应的节点
                if(node.callee.name == 'require'){
                    node.callee.name = '__webpack_require__';
                    let moduleName = node.arguments[0].value;   //取到的就是模块引用的名字
                    moduleName = moduleName+(path.extname(moduleName)?'':'.js');   //添加扩展名
                    moduleName = './'+path.join(parentPath,moduleName);   // ./src/a.js
                    dependencies.push(moduleName);     //添加存放的依赖
                    node.arguments = [types.stringLiteral(moduleName)];      //修改节点的value
                }

            }
        });
       let sourceCode =  generator(ast).code;
       return {sourceCode,dependencies}
    }
    //构建模块
    buildModule(modulePath,isEntry){

        let source = this.getSource(modulePath);
        let moduleName = './' + path.relative(this.root,modulePath);

        if(isEntry){
            this.entryId = moduleName
        }

        let {sourceCode,dependencies} = this.parse(source,path.dirname(moduleName));   //./src
        // console.log(sourceCode,dependencies);
        this.modules[moduleName] = sourceCode;
        dependencies.forEach(dep=>{
            this.buildModule(path.join(this.root,dep),false)
        })
    }
    emitFile(){ //发射文件
    //取路径
        let main = path.join(this.config.output.path,this.config.output.filename);
        let template = this.getSource(path.join(__dirname,'main.ejs'));
        let code = ejs.render(template,{entryId:this.entryId,modules:this.modules});
        this.asset = {};
        this.asset[main] = code;
        fs.writeFileSync(main,code);
    }
    run(){
        //执行代码 并创建模块的依赖关系
        this.buildModule(path.resolve(this.root,this.entry),true); //true:是否为主模块
        console.log(this.modules,this.entryId)

        //发射一个文件  打包后的文件
        this.emitFile();
    }
}
module.exports = Compiler