/**
 * @Description: 处理html提取需要合并的标签src或内容，并写暂存json文件
 * @author HeJian
 * @date 2019/4/11 
*/
let path =require('path');
let fs = require('fs');


class html_handle {

    /**
     * 类初始化函数
     * @param html_path {String} 待解析的html文件路径
     * @param tmp_json_path {String} 中间json存储路径
     * @param extract_tag {String} 提取区域的开始标签、else标签、结束标签
     */
    constructor(html_path,tmp_json_path,extract_tag){
        this.html_path=html_path;
        this.extract_tag=extract_tag;  //提取内容的标签
        this.merge_type="script";   //需要合并的类型 script
        this.merge_json_path=tmp_json_path;
        this.js_json={
            "html_path":html_path,
            "scripts":[]
        };
        this.css_json={};
        this.html_content=null;
    }





    read_html(){
        this.html_content=fs.readFileSync(this.html_path, "utf8");
    };
    /**
     * 获取合并区域的标签内容
     */
    match_tags() {
        // let reg=/<!--if true-->[\s\S]+?<!--endif-->/g;
        let reg=new RegExp(this.extract_tag[0]+'[\\s\\S]+?'+this.extract_tag[2],'g');
        let data_list=[];
        while (true){
            reg.lastIndex;//获取到匹配的开始位置
            let result=reg.exec(this.html_content);
            if (result==null){
                break;
            }
            let content_data=result[0];
            // let else_reg=/<!--if true-->([\s\S]+?)<!--else-->[\s\S]*?<!--endif-->/;
            let else_reg=new RegExp(this.extract_tag[0]+'([\\s\\S]+?)'+this.extract_tag[1]+'[\\s\\S]*?'+this.extract_tag[2]);
            if(else_reg.test(result[0])){
               content_data=RegExp.$1;
            }
            let tmp_data={
                "source":result[0],
                "tags":[]
            };
            content_data=this.filter_invalid_code(content_data);
            let script_data=this.match_script(content_data);
            tmp_data.tags=script_data;
            if (script_data.length>0){
                data_list.push(tmp_data);
            }

        }
        this.js_json.scripts=data_list;

    };
    /**
     * 检查页面上每一个合并区域内标签都是合法的，不出现其他类型的标签
     */
    check_tag () {
        // let reg=/<!--if true-->[\s\S]+?<!--endif-->/g;
        let reg=new RegExp(this.extract_tag[0]+'[\\s\\S]+?'+this.extract_tag[2],'g');
        while (true){
            reg.lastIndex;
            let result=reg.exec(this.html_content);
            if (result==null){
                break;
            }
            let tag_reg=/<([a-z]+)/g;
            let data=result[0].match(tag_reg);
            let tag_list=[];
            if (data==null){
                break
            }
            for (let i = 0; i <data.length ; i++) {
                tag_list.push(data[i].substr(1));
            }
            if(tag_list.indexOf(this.merge_type)!=-1){  //一个合并块是否含有需要的合并的标签script
                for(let i=0;i<tag_list.length; i++){
                    if(tag_list[i]!=this.merge_type){
                        throw `${this.html_path}文件中合并${this.merge_type}标签时，出现其他的类型标签 ${data[i].substr(1)}！`
                    }
                }
            }

        }
    };
    /**
     * 提取script标签的src属性或者是内容
     * @param script_data {String} script标签和内容
     * @returns {Array}
     */
    match_script (script_data) {
        let script_list=[];
        let reg=/<script[\s\S]*?\>[\s\S]*?\<\/script[\s\S]*?\>/g;
        while (true){
            reg.lastIndex;   //获取到匹配的开始位置
            let result=reg.exec(script_data);
            if (result==null){
                break;
            }
            let script_dict={
                'type':0,   //0表示script表示外链脚本 1表示内嵌脚本
                'content':""
            };
            let src_reg=/<script[\s\S]*?(src[\s\S]*?=[\s\S]*?"([\s\S]*?)"|src[\s\S]*?=[\s\S]*?'([\s\S]*?)')[\s\S]*?\>[\s\S]*?\<\/script[\s\S]*?\>/;
            if(src_reg.test(result[0])){
                if(RegExp.$2==''){
                    script_dict['type']=0;
                    script_dict['content']=RegExp.$3.replace(/\s+/g,"").replace(/[\r\n]/g,"");

                    script_list.push(script_dict);
                }else{
                    script_dict['type']=0;
                    script_dict['content']=RegExp.$2.replace(/\s+/g,"").replace(/[\r\n]/g,"");
                    script_list.push(script_dict);
                }
            }else{
                let content_reg=/<script[\s\S]*?\>([\s\S]+?)\<\/script[\s\S]*?\>/;
                if (content_reg.test(result[0])){
                    script_dict['type']=1;
                    script_dict['content']=RegExp.$1;
                    script_list.push(script_dict);
                }
            }
        }
        return script_list;
    };

    /**
     * 写提取标签后的json数据到暂存文件中
     */
    write_json() {
        fs.writeFileSync(this.merge_json_path,JSON.stringify(this.js_json),"utf8")
    };

    replace_source() {
        let storage_json=JSON.parse(fs.readFileSync(this.merge_json_path,"utf8"));
        for (let i = 0; i <storage_json.scripts.length ; i++) {
            this.html_content=this.html_content.replace(storage_json.scripts[i].source,storage_json.scripts[i].merge_source);
        }
        // let dir_path=path.dirname(this.html_path);
        // let file_name=path.basename(this.html_path);
        // let suffix_name=path.extname(this.html_path);
        // let prefix_name=file_name.substr(0,file_name.indexOf(suffix_name));
        // let file_path=path.join(dir_path,prefix_name+'_merge'+suffix_name);
        if(storage_json.scripts.length>0){
            fs.writeFileSync(this.html_path,this.html_content,"utf8");
        }
    };

    /**
     * 把合并块中注释掉的script标签去掉
     * @param content_data
     * @returns {*}
     */
    filter_invalid_code(content_data) {
        let invalid_reg=/<!--[\s\S]*?-->/g;
        let filter_content=content_data.replace(invalid_reg,'');

        let invalid_reg_2=/{{--[\s\S]*?--}}/g;
        filter_content=filter_content.replace(invalid_reg_2,'');
        return filter_content;
    };


    brefor_main () {
        this.read_html();
        this.check_tag();
        this.match_tags();
        this.write_json();
    };

    after_main () {
        this.replace_source();
    }
}


// let handler=new html_handle(html_path,"script");
// handler.brefor_main();
module.exports=html_handle;