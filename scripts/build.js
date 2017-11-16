'use strict';

require('colors');

var babel = require('babel-core');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;

process.env.BABEL_ENV = 'development';

var LIB_PATH = 'lib';
var taskLibDir = 'src';


var emptyDir = function(fileUrl){
    var files = fs.readdirSync(fileUrl);//读取该文件夹
    files.forEach(function(file){
        var stats = fs.statSync(fileUrl+'/'+file);
        if(stats.isDirectory()){
            emptyDir(fileUrl+'/'+file);
        }else{
            fs.unlinkSync(fileUrl+'/'+file);
        }
    });
};

//mkdir lib
function fsExistsSync(path) {
    try{
        fs.accessSync(path,fs.F_OK);
    }catch(e){
        return false;
    }
    return true;
}
if(!fsExistsSync(LIB_PATH)){
    fs.mkdirSync(LIB_PATH);
} else {
    emptyDir(LIB_PATH);
}


//babel
var taskFiles = [];
var hasFolderTip = false;
fs.readdirSync(taskLibDir).forEach(function (taskConfigFile) {
    if (/\.js$/.test(taskConfigFile)) {
        var taskFile = path.join(taskLibDir, taskConfigFile);
        taskFiles.push(taskFile);
    } else {
        if(hasFolderTip){ return; }
        var stats = fs.statSync(taskLibDir+'/'+taskConfigFile);
        if(stats.isDirectory()){
            console.log('\n\n' + '================error==============='.red + '\n\n');
            console.log('组件src目录下不允许有多层级文件夹目录，如果有多层级目录，说明此时组件拆分不为最细粒度，解耦不彻底，需要重新设计开发'.magenta);
            console.log('\n\n' + '================error==============='.red + '\n\n');

            hasFolderTip = true;
        }
    }
});

//如果不满足编译条件 则停止编译
if(hasFolderTip){
    return;
}

taskFiles.forEach(function(taskFile){
    babel.transformFile(taskFile, {code: true, "presets": ['babel-preset-env', 'babel-preset-react-app', 'stage-0'], 'plugins': ["add-module-exports"]}, function(err, result){
        if(err){
            console.log(err)
            return ;
        }

        if (/\.js$/.test(taskFile)) {

            var taskFileFilter = taskFile.match(/\/(.*.js)$/);
            if(!taskFileFilter) { taskFileFilter = taskFile.match(/\\(.*.js)$/); }
            if(taskFileFilter && taskFileFilter[1]){
                taskFile = taskFileFilter[1];
            }

            console.log(taskFile);

        }

        fs.writeFileSync(LIB_PATH + '/' + taskFile, result.code, { encoding: 'utf-8' });
    });
});


//copy scss
// var scssFile = fs.readFileSync('src/index.scss', 'utf-8');
// fs.writeFileSync(LIB_PATH + '/index.scss', scssFile, { encoding: 'utf-8' });
function copyScss(fileUrl){
    var waitCopyFiles = [];

    //检测scss文件个数 并存储路径
    var files = fs.readdirSync(fileUrl);//读取该文件夹
    files.forEach(function(file){
        if(/\.scss/.test(file)){
            waitCopyFiles.push(file);
        }
    });

    //warning 多于两个scss文件的项目给出严重警告提示
    if(waitCopyFiles.length > 1){
        console.log('\n\n' + '================warning==============='.red + '\n\n');
        console.log('earth 组件 尽量使用一个scss文件 以减小css压缩性能'.magenta);
        console.log('\n\n' + '================warning==============='.red + '\n\n');
    }

    //copy scss文件
    waitCopyFiles.forEach(function(file){
        var scssFile = fs.readFileSync('src/' + file, 'utf-8');
        fs.writeFileSync(LIB_PATH + '/' + file, scssFile, { encoding: 'utf-8' });
    });

}
copyScss(taskLibDir);