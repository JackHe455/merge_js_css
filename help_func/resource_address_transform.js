/**
 * @Description: 对css中字体、背景图片资源的url的本地相对目录修改成相对合并后css文件的相对目录
 * @author HeJian
 * @date 2019/4/11
 */

let path=require('path');


/**
 * css 字体资源地址、图片资源地址的转换成相应的相对地址
 */
class css_resource_transform{
    /**
     * 初始化函数
     * @param css_content {String} css的内容
     * @param css_from_dir_path {String} css文件原始目录
     * @param css_to_dir_path {String}  css内容写入到的目录
     */
    constructor(css_content,css_from_dir_path,css_to_dir_path){
        this.css_content=css_content;
        this.css_from_dir_path=css_from_dir_path;
        this.css_to_dir_path=css_to_dir_path;
        this.src_origin_list=[];
        this.src_list=[];
        this.transform_src_list=[];
    }

    get_url_address(){
        let reg=/url\(("?|'?)\s*([\S]+?)\s*("{0,1}|'{0,1})\)/g;
        while (true){
            reg.lastIndex;   //获取到匹配的开始位置
            let result=reg.exec(this.css_content);
            if (result==null){
                break;
            }
            let tmp_src=result[2];
            if(result[2][0]=="'" || result[2][0]=='"'){
                tmp_src=result[2].substr(1)
            }
            this.src_origin_list.push(tmp_src);
            let src=tmp_src.split("?")[0];
            src=src.split("#")[0];
            this.src_list.push(src);
        }
    }

    transform_src_path(){
        let net_address_prefix=/^http(s?):\/\/[\s\S]*$|^\/\/[\s\S]*$/;
        let base64_prefix=/^data:image[\s\S]*$|^('?|"?)data:image[\s\S]*$/;
        for (let i = 0; i <this.src_list.length ; i++) {
            if(net_address_prefix.test(this.src_list[i])){
                this.transform_src_list.push(this.src_list[i]);
            }else if(base64_prefix.test(this.src_list[i])) {
                this.transform_src_list.push(this.src_list[i]);
            }else{
                let absolute_path=path.join(this.css_from_dir_path,path.dirname(this.src_list[i]));
                let new_src_path=path.relative(this.css_to_dir_path,absolute_path);
                new_src_path+='/'+path.basename(this.src_origin_list[i]);
                let rep_reg=new RegExp('\\\\','g');
                new_src_path=new_src_path.replace(rep_reg,'/');
                this.transform_src_list.push(new_src_path);
            }
        }
    }

    replace_src_path(){
        for (let i = 0; i <this.src_origin_list.length ; i++) {
            this.css_content=this.css_content.replace(this.src_origin_list[i],this.transform_src_list[i]);
        }
    }

    run(){
        this.get_url_address();
        this.transform_src_path();
        this.replace_src_path();
        return this.css_content;
    }
}


// let css_content=`@font-face{font-family:'Glyphicons Halflings';src:url(../fonts/glyphicons-halflings-regular.eot);src:url(../fonts/glyphicons-halflings-regular.eot?#iefix) format('embedded-opentype'),url(../fonts/glyphicons-halflings-regular.woff2) format('woff2'),url(../fonts/glyphicons-halflings-regular.woff) format('woff'),url(../fonts/glyphicons-halflings-regular.ttf) format('truetype'),url(../fonts/glyphicons-halflings-regular.svg#glyphicons_halflingsregular) format('svg')}.glyphicon{position:relative;top:1px;display:inline-block;font-family:'Glyphicons Halflings';font-style:normal;font-weight:400;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.glyphicon-asterisk:before{content:"\\2a"}
// .glyphicon-plus:before{content:"\\2b"}button{
//             position: fixed;
//             bottom: 0;
//             left: 0;
//             width: 100%;
//             display: inline-block;
//             background: red;
//             text-align: center;
//             background: url("../img/dog3.jpg");
//         }img{background: url('../img/dog3.jpg ')}`;
// let css_from_dir_path=path.join(path.resolve(__dirname,'..','..'),'merge','bootstrap','css');
// let css_to_dir_path=path.resolve(__dirname);
// let css_obj=new css_resource_transform(css_content,css_from_dir_path,css_to_dir_path);
// let content=css_obj.run();
// console.log(content);

module.exports=css_resource_transform;