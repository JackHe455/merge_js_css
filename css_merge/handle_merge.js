/**
 * @Description: 合并各个合并标签中的js到一个文件并写入输出目录中
 * @author HeJian
 * @date 2019/4/11 
*/
let path=require("path");
let fs=require("fs");
let CleanCSS = require('clean-css');
let crypto = require('crypto');
let css_transform=require('../help_func/resource_address_transform');


class merge_handle {
    /**
     * 类初始化函数
     * @param extract_tag {Array} 提取区域的开始标签、else标签、结束标签
     * @param tmp_json_path {String} 中间json存储路径
     * @param output_path {String} 合并完成后的css存储的路径
     */
    constructor(extract_tag,tmp_json_path,output_path){
        this.html_path=null;
        this.extract_tag=extract_tag;   //提取内容的标签
        this.merge_json_path=tmp_json_path;
        this.html_content="";
        this.storage_json={};
        this.output_dir=output_path;
    }


    read_file () {
        try {
            this.storage_json=JSON.parse(fs.readFileSync(this.merge_json_path,"utf8"));
            this.html_path=this.storage_json.html_path;
            // this.html_content =fs.readdirSync(this.html_path,"utf8");
        }catch (e) {
            throw e;
        }
    };

    /**
     * json内容项预检测
     */
    check_json () {
        let merge_data = {};
        if (this.storage_json.css.constructor != Array) {
            throw "css 字段不是Array";
        }
        for (let i = 0; i < this.storage_json.css.length; i++) {
            if (this.storage_json.css[i].tags.constructor != Array) {
                throw `css 第${i}项的tags字段不是Array`
            }
            let sub_merge = {};
            for (let j = 0; j < this.storage_json.css[i].tags.length; j++) {
                if(this.storage_json.css[i].tags[j].type==0){
                    let dirpath=path.dirname(this.html_path);
                    let state = fs.statSync(path.join(dirpath,this.storage_json.css[i].tags[j].content));
                    if (!state.isFile()) {  //如果文件不存在
                        throw `${path.join(dirpath,this.storage_json.css[i].tags[j].content)}文件不存在工程中`
                    }
                }

            }
        }
    };
    /**
     * 合并js文件，写文件到输出目录,修改json
     */
    merge_file () {
        let options = { /* options */
            compatibility: 'ie8,-properties.merging',
            // rebaseTo: this.output_dir,
            level:{
                1:{
                    specialComments:false,   //把css注释删除掉
                }
            }
        };
        let dirpath=path.dirname(this.html_path);
        for (let i = 0; i <this.storage_json.css.length ; i++) {
            let sub_data={};
            for (let j = 0; j <this.storage_json.css[i].tags.length ; j++) {
                if(this.storage_json.css[i].tags[j].type==0){
                    let file_path=path.join(dirpath,this.storage_json.css[i].tags[j].content);
                    let file_content=fs.readFileSync(file_path,"utf8");
                    let css_transform_obj=new css_transform(file_content,path.dirname(file_path),this.output_dir);
                    file_content=css_transform_obj.run();
                    sub_data[j]={"styles":file_content};
                }else if(this.storage_json.css[i].tags[j].type==1){
                    let css_transform_obj=new css_transform(this.storage_json.css[i].tags[j].content,path.dirname(this.storage_json.html_path),this.output_dir);
                    let file_content=css_transform_obj.run();
                    sub_data[j]={"styles":file_content};
                }
            }
            let resut = new CleanCSS(options).minify(sub_data);
            if(resut.errors.length>0){
                console.error(`合并 merge.json ${this.html_path} css 中第${i}项失败`);
                throw resut.errors;
            }
            let html_name=path.basename(this.html_path);
            let html_extname=path.extname(html_name);
            let key;
            if(html_name.indexOf(html_extname)!=-1){
                 key=html_name.substr(0,html_name.indexOf(html_extname))
            }else{
                 key=html_name;
            }
            let md5 = crypto.createHash('md5');
            let md5_result = md5.update(this.html_path).digest('hex');
            key=key+`_${i}_${md5_result}.min.css`;
            fs.writeFileSync(path.join(this.output_dir,key), resut.styles,"utf8");
            this.storage_json.css[i]["merge_path"]=path.join(this.output_dir,key);
            let relative_path=path.relative(path.dirname(this.html_path),this.output_dir);
            let merge_path=path.join(relative_path,key);
            merge_path=merge_path.replace(/\\/g,'/');
            let merge_block=`<link rel="stylesheet" href="${merge_path}">`;
            // let space_reg=/<!--if true-->[\s\S]+?([\s]+)[\s\S]+?<!--endif-->/;
            let space_reg=new RegExp(this.extract_tag[0]+'[\\s\\S]+?([\\s]+)[\\s\\S]+?'+this.extract_tag[2]);

            if(space_reg.test(this.storage_json.css[i].source)){
                merge_block=RegExp.$1+merge_block+RegExp.$1;
            }
            let merge_source;
            if(this.storage_json.css[i].source.indexOf(this.extract_tag[1])==-1){
                let end_index=this.storage_json.css[i].source.indexOf(this.extract_tag[2]);
                merge_source=this.storage_json.css[i].source.substr(0,end_index)+this.extract_tag[1]+merge_block+this.extract_tag[2];
            }else{
                // let else_reg=/(<!--if true-->[\s\S]+?<!--else-->)[\s\S]*?(<!--endif-->)/;
                let else_reg=new RegExp('('+this.extract_tag[0]+'[\\s\\S]+?'+this.extract_tag[1]+')[\\s\\S]*?('+this.extract_tag[2]+')');
                merge_source=this.storage_json.css[i].source.replace(else_reg,`$1${merge_block}$2`)
            }
            this.storage_json.css[i]["merge_source"]=merge_source;
        }
    };

    write_json () {
        fs.writeFileSync(this.merge_json_path,JSON.stringify(this.storage_json),"utf8")
    };


    brefor_main () {
        this.read_file();
        this.check_json();
    };

    after_main () {
        this.merge_file();
        this.write_json();
    }

}

// let extract_tag=['<!--if true-->','<!--else-->','<!--endif-->'];
// let tmp_json_path=path.join(path.resolve(__dirname),'merge.json');  //暂存的json的路径
// let html_path=path.join(path.resolve(__dirname,'..'),'merge.html');
// let output_path=path.join(path.resolve(__dirname,'..'),'output');   //存储合并后的js文件目录
//
// let handle=new merge_handle(extract_tag,tmp_json_path,output_path);
// handle.brefor_main();
// handle.after_main();

module.exports=merge_handle;



