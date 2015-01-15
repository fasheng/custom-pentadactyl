// "use strict";

// TODO: suspended
function mappingKey(/*prefix=<Leader>,*/char) {
	return ["<Leader>"+options["firebug-key"]+char];
}

group.options.add(["firebug-key", "fbk"],
	"Firebug Key Bindings Prefix",
	"string",
	"f",
	{

	}
);

group.mappings.add(
	[modes.MAIN],
	mappingKey('c'),
	"Focus Command Editor",
	function() {
		if (!Firebug.isOpen)
			Firebug.toggleBar(true, 'console');
		Firebug.chrome.switchToPanel(Firebug.currentContext, "console");
		enableCurrentPanel();
		Firebug.CommandLine.focus(Firebug.currentContext);
	}
);

group.mappings.add(
	[modes.MAIN],
	mappingKey('e'),
	"Toggle and Focus [MultiLine] Command Editor",
	function() {
		if (!Firebug.isOpen)
			Firebug.toggleBar(true, 'console');
		Firebug.chrome.switchToPanel(Firebug.currentContext, "console");
		enableCurrentPanel();
		Firebug.CommandLine.toggleMultiLine();
		Firebug.CommandLine.focus(Firebug.currentContext);
	}
);

group.mappings.add(
	[modes.MAIN],
	mappingKey('i'),
	"Inspect Element",
	function() {
		// Firebug.setSuspended();
		Firebug.toggleBar(true, "html");
		Firebug.minimizeBar();
		if (!hints.modes["Q"]) {
			hints.addMode("Q", "Inspect Element", function(elem) {
					Firebug.Inspector.startInspecting(Firebug.currentContext);
					Firebug.Inspector.inspectNode(elem);
					Firebug.Inspector.stopInspecting(false, true);
					Firebug.toggleBar(true, "html");
					elem.scrollIntoView();
			}, null, ["*"]);
		}
		modes.push(modes.NORMAL);
		hints.show('Q');
		// Firebug.showBar(true);
	}
);

group.mappings.add(
	[modes.MAIN],
	mappingKey('f'),
	"Toggle Firebug!",
	function() {
		Firebug.toggleBar();
	}
);

let panels = Firebug.panelTypes.filter(function (panel) {
		if (panel.prototype.parentPanel)
			return false;
		return true;
}).sort(function(a, b) {
		return a.prototype.order - b.prototype.order;
});
panels.forEach(function (panelType, index) {
		let name = panelType.prototype.name;
		let title = Firebug.getPanelTitle(panelType);
		group.mappings.add(
			[modes.MAIN],
			mappingKey(index+1),
			// ["<F"+(index+1)+">"],
			"Switch to " + title + " Panel!",
			function() {
				Firebug.toggleBar(true, name);
				// if (Firebug.isMinimized() || Firebug.defaultPanelName !== name)
				// Firebug.toggleBar(true, name);
				// else
				// Firebug.toggleBar();
			}
		);
});

function enableCurrentPanel() {
	var panelBar = Firebug.chrome.$("fbPanelBar1");
	var panelType = panelBar.selectedTab.panelType;
	if (panelType.prototype.setEnabled) {
		panelType.prototype.setEnabled(true);
		panelBar.updateTab(panelType);
	}
}

function execute(code) { // TODO: failed when firebug is suspendeded
	let cl = Firebug.CommandLine;
	Firebug.toggleBar(true, "console");
	enableCurrentPanel();
	let context = Firebug.currentContext;
	cl.enter(context, code);
}

group.commands.add(["fireb[ug]", "fb"],
	"fireb[ug] or fb: Use Pentadactyl CommandLine to Control Firebug!",
	function (args) {
		if (args.length==0) {
			Firebug.toggleBar();
			return true;
		}
		let code = args[0];
		execute(code);
	},
	{
		bang: true, // TODO: :fb! invoke last call, :fb! xxx works like shell history substitution
		// completer: completion.javascript,
		completer: function(context, args) {
			if (!Firebug.currentContext) {
				Firebug.toggleBar(true, "console");
				enableCurrentPanel();
				Firebug.minimizeBar();
			}
			context.regenerate = true;
			// update(content.wrappedjsobject, G); // NB: dangerous, plz never use it
			var _context = modules.newContext(content.wrappedJSObject, false);
			var web = modules.JavaScript();
			web.newContext = function newContext() modules.newContext(_context, false);

			web.globals = [
				[G, "Command Line API"],
				[content.wrappedJSObject, "Current Page"],
			].concat(web.globals.filter(function ([global]) isPrototypeOf.call(global, content.wrappedJSObject) || isPrototypeOf.call(global, G)));

			if (!isPrototypeOf.call(modules.jsmodules, content.wrappedJSObject))
				web.toplevel = content.wrappedJSObject;

			if (!isPrototypeOf.call(window, content.wrappedJSObject))
				web.window = content.wrappedJSObject;

			if (web.globals.slice(2).some(function ([global]) global === content.wrappedJSObject))
				web.globals.splice(1);

			context.fork("js", 0, web, "complete");
		},
		literal: 0
	},
	true
);

let panelBar1 = panels.map(function(panelType) {
		return [panelType.prototype.name, Firebug.getPanelTitle(panelType)];
});
function subPanel(mainPanel) {
	return Firebug.panelTypes.filter(function (panelType) {
		if (panelType.prototype.parentPanel == mainPanel)
			return true;
		return false;
		}).map(function(panelType) {
			return [panelType.prototype.name, Firebug.getPanelTitle(panelType)];
	});
}

group.commands.add(["firebug-panel", "fbp"],
	"firebug-panel or fbp: Use Pentadactyl CommandLine to Switch Firebug Panel!",
	function (args) {
		if (args.length==0) {
			Firebug.toggleBar();
		} else
			Firebug.toggleBar(true, args[0]);
		if (args[1])
			Firebug.chrome.selectSidePanel(args[1]);
	},
	{
		bang: true,
		completer: function(context, args) {
			if (args.length <= 1)
				context.completions = panelBar1;
			else
				context.completions = subPanel(args[0]);
		},
		literal: 1
	},
	true
);

Components.utils.import("resource://gre/modules/NetUtil.jsm");
group.commands.add(["firebug-load", "fbl"],
	"load file",
	function (args) {
		let filename = args[0];
		if (!File.isAbsolutePath(filename))
			filename = io.cwd.path + File.PATH_SEP + filename;
		filename = File.expandPath(filename);
		var localFile = Components.classes["@mozilla.org/file/local;1"]
               .createInstance(Components.interfaces.nsILocalFile);
		try {
			localFile.initWithPath(filename);
			if (localFile.isFile() && localFile.isReadable()) {

				NetUtil.asyncFetch(localFile, function(inputStream, status) {
						if (!Components.isSuccessCode(status)) {
							// Handle error!
							return;
						}

						// The file data is contained within inputStream.
						// You can read it into a string with
						var code = NetUtil.readInputStreamToString(inputStream, inputStream.available());
						execute(code);

				});
			} else {
				dactyl.echoerr("文件不可读或者是错误");
			}
		} catch (e) {
			dactyl.echoerr("打开文件失败!");
		} finally {

		}
	},
	{
		bang: true,
		completer: function (context, args) {
			context.filters.push(function (item) {
				return item.isdir || /\.jsm?$/.test(item.path);
			});
			completion.file(context, true);
		},
		literal: 0
	},
	true
);
