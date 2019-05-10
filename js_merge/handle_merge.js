/**
 * @Description: 合并各个合并标签中的js到一个文件并写入输出目录中
 * @author HeJian
 * @date 2019/4/11 
*/

let path=require("path");
let fs=require("fs");
let UglifyJS = require('uglify-js');
let crypto = require('crypto');


class merge_handle {
    /**
     * 类初始化函数
     * @param extract_tag {Array} 提取区域的开始标签、else标签、结束标签
     * @param tmp_json_path {String} 中间json存储路径
     * @param output_path {String} 合并完成后的js存储的路径
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
    check_json() {
        let merge_data = {};
        if (this.storage_json.scripts.constructor != Array) {
            throw "scripts 字段不是Array";
        }
        for (let i = 0; i < this.storage_json.scripts.length; i++) {
            if (this.storage_json.scripts[i].tags.constructor != Array) {
                throw `scripts 第${i}项的tags字段不是Array`
            }
            let sub_merge = {};
            for (let j = 0; j < this.storage_json.scripts[i].tags.length; j++) {
                if(this.storage_json.scripts[i].tags[j].type==0){
                    let dirpath=path.dirname(this.html_path);
                    let state = fs.statSync(path.join(dirpath,this.storage_json.scripts[i].tags[j].content));
                    if (!state.isFile()) {  //如果文件不存在
                        throw `${path.join(dirpath,this.storage_json.scripts[i].tags[j].content)}文件不存在工程中`
                    }
                }

            }
        }
    };
    /**
     * 合并js文件，写文件到输出目录,修改json
     */
    merge_file () {
        let options = {
            sourceMap: {
                filename: "main.js",
                url: "main.js.map"
            },
            output: {
                beautify: false,
                preamble: "/* uglified */"
            },
            ie8: true,
        };
        let dirpath=path.dirname(this.html_path);
        for (let i = 0; i <this.storage_json.scripts.length ; i++) {
            let sub_data={};
            for (let j = 0; j <this.storage_json.scripts[i].tags.length ; j++) {
                if(this.storage_json.scripts[i].tags[j].type==0){
                    let file_path=path.join(dirpath,this.storage_json.scripts[i].tags[j].content);
                    let file_content=fs.readFileSync(file_path,"utf8");
                    sub_data[j]=file_content;
                }else if(this.storage_json.scripts[i].tags[j].type===1){
                    sub_data[j]=this.storage_json.scripts[i].tags[j].content;
                }
            }
            let resut= UglifyJS.minify(sub_data, options);
            if(resut.error){
                console.error(`合并 merge.json ${this.html_path} scripts 中第${i}项失败`);
                throw resut.error;
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
            key=key+`_${i}_${md5_result}.min.js`;
            fs.writeFileSync(path.join(this.output_dir,key), resut.code,"utf8");
            fs.writeFileSync(path.join(this.output_dir,`${key}.map`), resut.map,"utf8");
            this.storage_json.scripts[i]["merge_path"]=path.join(this.output_dir,key);
            let relative_path=path.relative(path.dirname(this.html_path),this.output_dir);
            let merge_path=path.join(relative_path,key);
            merge_path=merge_path.replace(/\\/g,'/');
            let merge_block=`<script type="text/javascript" src="${merge_path}"></script>`;
            // let space_reg=/<!--if true-->[\s\S]+?([\s]+)[\s\S]+?<!--endif-->/;
            let space_reg=new RegExp(this.extract_tag[0]+'[\\s\\S]+?([\\s]+)[\\s\\S]+?'+this.extract_tag[2]);

            if(space_reg.test(this.storage_json.scripts[i].source)){
                merge_block=RegExp.$1+merge_block+RegExp.$1;
            }
            let merge_source;
            if(this.storage_json.scripts[i].source.indexOf(this.extract_tag[1])==-1){
                let end_index=this.storage_json.scripts[i].source.indexOf(this.extract_tag[2]);
                    merge_source=this.storage_json.scripts[i].source.substr(0,end_index)+this.extract_tag[1]+merge_block+this.extract_tag[2];
            }else{
                // let else_reg=/(<!--if true-->[\s\S]+?<!--else-->)[\s\S]*?(<!--endif-->)/;
                let else_reg=new RegExp('('+this.extract_tag[0]+'[\\s\\S]+?'+this.extract_tag[1]+')[\\s\\S]*?('+this.extract_tag[2]+')');
                    merge_source=this.storage_json.scripts[i].source.replace(else_reg,`$1${merge_block}$2`)
            }
            this.storage_json.scripts[i]["merge_source"]=merge_source;
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

// let handle=new merge_handle(path.join(__dirname,'merge.json'));
// handle.brefor_main();
// handle.after_main();

module.exports=merge_handle;



