/**
 * @Description: 遍历目录查询出指定文件后缀，并且返回文件地址列表
 * @author HeJian
 * @date 2019/4/11
 */
let path=require("path");
let fs=require("fs");

let extname_list=['.html','.php'];

/**
 * 遍历目录查询出指定文件后缀，并且返回文件地址列表
 * @param dir_path {String} 待遍历的目录
 * @param filesList {String}  返回便利的结果
 */
function file_traversing(dir_path,filesList) {
        let files = fs.readdirSync(dir_path);//需要用到同步读取
        files.forEach(walk);
        function walk(file) {
            let states = fs.statSync(dir_path + '/' + file);
            if (states.isDirectory()) {
                file_traversing(dir_path + '/' + file, filesList,);
            }
            else if (extname_list.indexOf(path.extname(file))!=-1) {
                //创建一个对象保存信息
                let file_path = dir_path + '/' + file; //文件绝对路径
                filesList.push(file_path);
            }
        }
    }


module.exports=file_traversing;