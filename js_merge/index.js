/**
 * @Description: js合并的入口函数
 * @author HeJian
 * @date 2019/4/11
 */


let path=require("path");
let fs=require("fs");
let crypto = require('crypto');
let merge_handle=require("./handle_merge");
let html_handle=require("./handle_html");


class merge_js {
    /**
     * 类初始化函数
     * @param html_path_list {Array} 待解析的html文件路径数组
     * @param extract_tag {Array} 提取区域的开始标签、else标签、结束标签
     * @param output_path {String} 合并完成后的css存储的路径
     * @param tmp_js_json_dir {String} 中间json存储目录路径
     */
    constructor(html_path_list,extract_tag,output_path,tmp_js_json_dir){
        this.html_path_list=html_path_list;
        this.extract_tag=extract_tag;
        this.output_path=output_path;
        this.tmp_js_json_dir=tmp_js_json_dir;  //暂存的json的路径
    }

    run(){
        this.html_path_list.forEach(item=>{
            let md5 = crypto.createHash('md5');
            let md5_result = md5.update(item).digest('hex');
            let file_name=path.basename(item);
            let json_path=path.join(this.tmp_js_json_dir,file_name+'_'+md5_result+'.json');
            let html_handle_obj=new html_handle(item,json_path,this.extract_tag);
            let merge_handle_obj=new merge_handle(this.extract_tag,json_path,this.output_path);
            html_handle_obj.brefor_main();
            merge_handle_obj.brefor_main();
            merge_handle_obj.after_main();
            html_handle_obj.after_main();
        });
        console.info("合并html的js成功完成！");
    }

}


module.exports=merge_js;


