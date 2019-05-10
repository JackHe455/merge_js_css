# merge_js_css
nodejs 解析html根据标签提取需要合并的js、css，并且更新html

# 简介
> 站点页面上js、css外链过多会导致网页的加载速度过慢，通过合并页面的js、css成一个文件，减少http的开销。
  	读取config.json,解析html根据 <!--if true--><!--endif-->标签合并区域内的js或者css，并且更新html区域内合并之后的script、link标签；可以打包成执行文件，需要开发环境的依赖。
  
>  	运行前需要新建config.json的配置的目录：output_path、tmp_js_json_dir、tmp_css_json_dir。
  
  
  	{
    	"extract_tag":["<!--if true-->","<!--else-->","<!--endif-->"],    //提取区域的标签
        "output_path": "D:\\projects\\github_project\\merge_js_css\\examples\\output",  //输出合并后js、css的目录
        "tmp_js_json_dir": "D:\\projects\\github_project\\merge_js_css\\examples\\json\\js",   //js合并中间过程文件目录
        "tmp_css_json_dir": "D:\\projects\\github_project\\merge_js_css\\examples\\json\\css",  //css合并中间过程文件目录
        "html_dir_path": "D:\\projects\\github_project\\merge_js_css\\examples\\html"   \\待合并处理的html页面目录
    }


# 前置条件
    安装uglify-js
    npm install uglify-js --save-dev
    
    安装clean-css
    npm install clean-css --save-dev
    
    安装pkg
    npm install -g pkg
   
# 开发环境运行
	node index.js config.json


# 打成执行文件并运行
	打包
	pkg -t win index.js  //-t 指定window平台

	运行
	index.exe config.json   
 