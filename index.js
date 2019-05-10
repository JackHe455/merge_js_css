
/**
 * @Description: 主文件
 * @author HeJian
 * @date 2019/4/11
 */


let path=require("path");
let fs=require("fs");
let process=require('process');
let file_tra=require('./help_func/dir_helf');
let merge_js=require('./js_merge/index');
let merge_css=require('./css_merge/index');


/**
 * exe运行时
 * @param tips
 * @returns {string}
 */
function readSyncByfs(tips) {
    let response;

    tips = tips || '> ';
    process.stdout.write(tips);
    process.stdin.pause();

    let buf = Buffer.allocUnsafe(10000);
    response = fs.readSync(process.stdin.fd, buf, 0, 10000, 0);
    process.stdin.end();

    response = buf.toString('utf8', 0, response);

    return response.trim();
}
while (true){
    let input_tip=readSyncByfs('请确认是否重新合并js、css，请输入yes(y)|no(n)：');
    if(input_tip=='yes' || input_tip=='y'){
        break;
    }
    if(input_tip=="no" || input_tip=="n"){
        process.exit(0);
    }
}


let config_path=process.argv[2];

// let config_path=path.join(path.resolve(__dirname),'config.json');
let config_item=JSON.parse(fs.readFileSync(config_path, "utf8"));



// let extract_tag=['<!--if true-->','<!--else-->','<!--endif-->'];
// let output_path=path.join(path.resolve(__dirname),'output');   //存储合并后的js css文件目录
// let tmp_js_json_dir=path.join(path.resolve(__dirname),'json','js');
// let tmp_css_json_dir=path.join(path.resolve(__dirname),'json','css');
// let html_dir_path=path.resolve(__dirname,'..','merge');

let extract_tag=config_item.extract_tag;
let output_path=config_item.output_path;
let tmp_js_json_dir=config_item.tmp_js_json_dir;
let tmp_css_json_dir=config_item.tmp_css_json_dir;
let html_dir_path=config_item.html_dir_path;

let html_path_list=[];
file_tra(html_dir_path,html_path_list);
console.info(html_path_list);

let merge_js_obj=new merge_js(html_path_list,extract_tag,output_path,tmp_js_json_dir);
merge_js_obj.run();
let merge_css_obj=new merge_css(html_path_list,extract_tag,output_path,tmp_css_json_dir);
merge_css_obj.run();
process.exit(0);