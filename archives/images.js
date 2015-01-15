
// var INFO =
// <plugin name="save-images-from-current-tab" version="0.1"
//         href="http://code.google.com/p/dactyl/issues/detail?id=216"
//         summary="Save images from current tab"
//         xmlns={NS}>
//     <info lang="zh-CN" summary="保存当前标签页的图片"/>
//     <author>weide</author>
//     <license href="http://opensource.org/licenses/mit-license.php">MIT</license>
//     <project name="Pentadactyl" min-version="1.0"/>
//     <p lang="zh-CN">
//         本插件为pentadactyl提供了一个命令：<ex>:save-images</ex> 使用该命令可以保存当前标签页中大于指定尺寸的图片到指定路径,并在状态栏显示相关信息。
//     </p>
//     <note lang="zh-CN">
//          可以直接在命令行调用，此时需要给出参数－－保存图片的路径；更方便的用法是：在_pentadactylrc文件中映射为更简洁的快捷键
//     </note>
//     <p lang="en-US">
//         This plugin provides a command for the pentadactyl: <ex>:save-images</ex> to use the command to save the current tab' images that are greater than the specified size to the specified path and in the status bar displays the relevant information.
//     </p>
//     <note lang="en-US">
//          Can be directly invoked on the command line, this time need to give the argument - the path to save the image; more convenient to use are: Mapping documents in the _pentadactylrc shortcuts for the more concise
//     </note>

//     <item lang="zh-CN">
//         <tags>:si :simages :save-images</tags>
//         <spec>:save-images <a>path</a></spec>
//         <description>
//             <ul>
//              <li>直接在命令行调用：<example><ex>:save-images</ex> D:\Downloads\pic</example></li>
//              <li>在_pentadactylrc文件中:<example>map -modes=n,v  sf -d=保存风景图片 -ex <ex>:save-images</ex> D:\Downloads\风景</example></li>
//              <li>在_pentadactylrc文件中:<example>map -modes=n,v  sr -d=保存人物页图片 -ex <ex>:save-images</ex> D:\Downloads\人物</example></li>    
//              <li>在_pentadactylrc文件中:<example>map -modes=n,v  nsr -d=在指定路径下新建文件夹保存图片 :save-images D:\Downloads\人物\</example>之后，想要将图片保存到“人物”下的新建文件夹“张三”内,就可以通过如下按键：<example>nsr张三</example></li>    
//              <li>在_pentadactylrc文件中:<example>map -modes=n,v  nsf -d=保存风景图片 :save-images D:\Downloads\风景\</example></li>
//             </ul>
//         </description>
//     </item>
//     <item lang="en-US">
//         <tags>:si :simages :save-images</tags>
//         <spec>:save-images <a>path</a></spec>
//         <description>
//             <ul>
//              <li> directly on the command line call: <example><ex>:save-images</ex> D:\Downloads\pic</example></li>
//              <li> in _pentadactylrc file: <example><ex>:map</ex> -modes=n,v sf -d=<str>Save images of Scenery</str> -ex <ex>:save-images</ex> D:\Downloads\Scenery</example></li>
//              <li> in _pentadactylrc file: <example><ex>:map</ex> -modes=n,v sr -d=<str>Save images of people</str> -ex <ex>:save-images</ex> D:\Downloads\People</example></li>
//              <li> in _pentadactylrc file: <example><ex>:map</ex> -modes=n,v nsr -d=<str>Give the specified sub folder of People to save images</str> :save-images D:\Downloads\People\</example> if you want to save the images to the new folder "Joe Smith" under the "people" , through the following key: <example>nsrJoe Smith</example></li>
//              <li> in _pentadactylrc file: <example><ex>:map</ex> -modes=n,v nsf-d=<str>Give the specified sub folder of Scenery to save images</str> :save-images D:\Downloads\Scenery\</example></li>
//             </ul>
//         </description>
//     </item>

//     <note lang="zh-CN">
//         注意事项：为了达到更佳使用效果，请尝试修改如下设置：
//     </note>

//     <item lang="zh-CN">
//         <tags>'save-images'</tags>
//         <spec>'images_minsize'</spec>
//         <type>int</type> <default>350</default>
//         <description>
//             <p>
//                 指定要保存图片的最小尺寸
//             </p>
//             <example><ex>:set images_minsize=400</ex></example>
//         </description>
//     </item>
//     <item lang="zh-CN">
//         <tags>'save-images'</tags>
//         <spec>'save_images_minlength_to_dateprefix'</spec>
//         <type>int</type> <default>8</default>
//         <description>
//             <p>
// 	    	当不含后缀的图片文件名小于或等于该数值时，自动在文件名前添加日期编码
//             </p>
//             <example><ex>:set save_images_minlength_to_dateprefix=10</ex></example>
//         </description>
//     </item>    
//     <item lang="zh-CN">
//         <tags>'save-images'</tags>
//         <spec>'save_images_minlength_to_skip'</spec>
//         <type>int</type> <default>20</default>
//         <description>
//             <p>
//                 当不含后缀的图片文件名长度大于该数值时，跳过该文件，不再保存；否则会在文件名后添加编号重新保存e
//             </p>
//             <example><ex>:set save_images_minlength_to_skip=25</ex></example>
//         </description>
//     </item> 

//     <note lang="en-US">
//         In order to achieve better results, please try to change the following options:
//     </note>
//     <item lang="en-US">
//         <tags>'save-images'</tags>
//         <spec>'images_minsize'</spec>
//         <type>int</type> <default>350</default>
//         <description>
//             <p>
//                 specify the minimum size of picture to save
//             </p>
//             <example><ex>:set images_minsize=400</ex></example>
//         </description>
//     </item>
//     <item lang="en-US">
//         <tags>'save-images'</tags>
//         <spec>'save_images_minlength_to_dateprefix'</spec>
//         <type>int</type> <default>8</default>
//         <description>
//             <p>
//                 when the length of image file name without suffix is less than or equal to the value,will automatically add the date code before the file name
//             </p>
//             <example><ex>:set save_images_minlength_to_dateprefix=10</ex></example>
//         </description>
//     </item>    
//     <item lang="en-US">
//         <tags>'save-images'</tags>
//         <spec>'save_images_minlength_to_skip'</spec>
//         <type>int</type> <default>20</default>
//         <description>
//             <p>
//                 when the length of image file name without the suffix is greater than the value, the file will be skipped to save
//             </p>
//             <example><ex>:set save_images_minlength_to_skip=25</ex></example>
//         </description>
//     </item>    
// </plugin>;

let images={
	saveImages: function(imgs,picdir,images_minsize,minlength_to_dateprefix,minlength_to_skip) {
		function getDateString(){
			var date = new Date();          
			return date.getFullYear()+formatNum(date.getMonth()+1,2)+formatNum(date.getDate(),2);
		}

		function formatNum(n,l){
			var str=n.toString();
			for(var i=str.length;i<l;i++) str = "0"+str;
			return str;
		}

		let result=new Object();
		result.FoundCount=0;//count of images that size are greater then minSize
		result.SavedCount=0;//count of images that are saved successful
		result.SkippedCount=0;//count of images that are skipped for same file name
		result.Errors=new Array();
		result.Files=new Array();

		if(picdir.length==0) {
			alert("Must given the path to save images");
			return result;
		}else picdir+=File.PATH_SEP;
		result.picdir = picdir;

		
		for(var imgElement in imgs){
			try{
				if(imgElement.height<images_minsize||imgElement.width<images_minsize) continue;
				result.FoundCount++;

				let doc = imgElement.ownerDocument;
				let url = imgElement.src;

				urlSecurityCheck(url, doc.nodePrincipal);
				
				//some url are *.jpg?dl9882
				let filename = url.split(/\/+/g).pop().replace(/\?[\s\S]*/,"");
				var fpre = filename.replace(/\.\w+$/,''); 
				var suffix = filename.match(/\.\w+$/);

				if(fpre.length<=minlength_to_dateprefix) fpre = getDateString() + "_" + fpre;

				//Sometimes img.src has no suffix,set it .jpg
				if(suffix==null) {
					let mime = imgElement.QueryInterface(Ci.nsIImageLoadingContent).getRequest(0).mimeType;
					let ext = services.mime.getPrimaryExtension("image/jpeg", /([a-z]*)$/i.exec(imgElement.src)[1]);			
					suffix= ext ? "."+ext : ".jpg";
				}
				
				var f = io.File(picdir+fpre+suffix);
				
				//Dealing with the same file name problem
				if(fpre.length <= minlength_to_skip){
					var iRe=0;
					while(f.exists()){
						iRe++;
						f = io.File(picdir+fpre+"_"+formatNum(iRe,3)+suffix);
					}
				}else{
					if(f.exists()){
						result.SkippedCount++;
						result.Files.push(picdir+fpre+suffix);
						continue;
					}
				}
				
				if(!f.exists()) f.create(0x00,0644);
				
				var persist = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Ci.nsIWebBrowserPersist);
				const nsIWBP = Components.interfaces.nsIWebBrowserPersist;
				const flags = nsIWBP.PERSIST_FLAGS_REPLACE_EXISTING_FILES;
				persist.persistFlags = flags | nsIWBP.PERSIST_FLAGS_FROM_CACHE | nsIWBP.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION;
				persist.saveURI(makeURI(url), null, null, null, null,f);
				result.Files.push(picdir+fpre+suffix);
				result.SavedCount++;
			}catch (e) { result.Errors.push(e); }
		}

		return result;
	},

	generatePath: function(url){
		var path="";
		for(var i in url){
			if(url[i].match(/[a-z]|[A-Z]|[0-9]/)) path+=url[i];
		}
		return path;
       },

	addOptions:function(){
		//指定要保存图片的最小尺寸
		group.options.add(
			["images_minsize"],
			"minimum size of picture to save",
			"number", 350,
			{ validator: function (value) value > 0 }
		);

		//当文件名长度（不含后缀名）小于或等于该数值时，文件名前面会自动添加日期编码
		group.options.add(
			["save_images_minlength_to_dateprefix"],
			"min length of filename without suffix to add the date code before file name",
			"number", 8,
			{ validator: function (value) value > 0 }
		);

		//当文件名长度（不含后缀名）大于该数值时，跳过该文件，不执行保存操作
		group.options.add(
			["save_images_minlength_to_skip"],
			" min length of filename without the suffix to skipped from save",
			"number", 20,
			{ validator: function (value) value > 0 }
		);

		//记录上次保存路径
		group.options.add(
			["save_images_last_path"],
			"the last path used at :save-images",
			"string",""
		);

		//看图工具
		group.options.add(
			["images_app"],
			"the app to view images",
			"string",""
		);

		//看图工具启动参数
		group.options.add(
			["images_app_param"],
			"parameter when app start",
			"string",""
		);
	},
	
	addCommands: function () {
		group.commands.add(
			['save-images', 'si[mages]'],
			'Save images from the current tab',
			function(args){
				let picdir = args.length ? args[0] : options["save_images_last_path"];

				const query = ['img[@src and not(starts-with(@src, "data:"))]'];//why not?  and @height>300 and @width>300
				let imgs = DOM.XPath(query,buffer.doc);

				let result = images.saveImages(imgs,picdir,options["images_minsize"],
					options["save_images_minlength_to_dateprefix"],options["save_images_minlength_to_skip"]);

				options["save_images_last_path"]=picdir;
				let strInfo = picdir + ">Found pics: "+ result.FoundCount +", Saved successful pics: " + result.SavedCount;
				if(result.SkippedCount>0)
					strInfo += ", Skipped same filename pics: " +result.SkippedCount
						+". Note:Please check the files are same,or save to another folder.";
				dactyl.echo(strInfo);

				if(result.Errors.length>0){
					for(var e in result.Errors) dactyl.echoerror(result.Errors[e]);
				}
			},
			{
				argCount: "?",
				completer: function (context, args) completion.directory(context),
				literal: 0
			}, 
			true
		);
	}
};

images.addOptions();
images.addCommands();

