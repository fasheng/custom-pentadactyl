/*
 * (C) Moritz Orbach 2010, 2012, 2013
 * initial version: May 2010
 * http://apfelboymchen.net/gnu/
 *
 * FF removed the XML stuff.
 * So the help doesn't work anymore, unfortunately.
 *
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 */

/*
XML.ignoreWhitespace = false;
XML.prettyPrinting = false;
var INFO = 
<plugin name="cycleproxy" version="1.0"
	href="http://apfelboymchen.net/gnu/shell"
	summary="Cycle proxy settings"
        xmlns={NS}>
	<author email="gnu@apfelboymchen.net">Moritz Orbach</author>
	<license href="http://fsf.org">GPL3</license>
	<project name="Pentadactyl" min-version="1.0"/>

	<p>This plugin cycles between a configurable set of Firefox proxy settings.</p>
	<item>
		<tags>':proxynext' ':pn'</tags>
		<spec>:proxynext</spec>
		<description>
			<p>Cycle to the next configured proxy setting</p>
			<example>map &lt;f8&gt; :pn&lt;CR&gt;</example>
		</description>
	</item>

	<item>
		<tags>'proxycycle'</tags>
		<spec>'proxycycle'</spec>
		<type>string</type> <default>direct,system</default>
		<description>
		 	<p>Which Firefox settings are cycled.</p>
		 		<p>Available Settings</p>
		 		<dl>
		 			<dt>direct</dt>		<dd>No proxy</dd>
		 			<dt>manual</dt> 	<dd>Manual proxy configuration</dd>
		 			<dt>auto</dt>		<dd>Use the Automatic proxy configuration URL</dd>
		 			<dt>detect</dt>		<dd>Auto-detect proxy settings</dd>
		 			<dt>system</dt>		<dd>Use system proxy settings</dd>
		 		</dl>
		 		<example>set proxycycle=direct,manual</example>
		</description>
	</item>
</plugin>;
*/

group.options.add(["proxycycle", "pc"],
    "proxy modes switched cycled through by proxynext",
    "stringlist", "direct,system", // default
    {
	    setter: function set(optionstring) {
			if (optionstring)
				option_proxycycle = String(optionstring).split(",");
				//option_proxycycle = new Array("bla", "blub");
			//alert("arghsetter: " + option_proxycycle);
			//return optionstring;
	    },
	    completer: function (context) {
			return [
				["direct", "No proxy"],
				["manual", "Manual proxy configuration"],
				["auto",   "Use the Automatic proxy configuration URL"],
				["detect", "Auto-detect proxy settings"],
				["system", "Use system proxy settings"]
			]
	},
    }
    // what does that do?
    // privateData: true,
);


// XXX can I get this from moz?
let moz_proxysettings = {
	'direct' : 0,
	'manual' : 1,
	'auto'   : 2,
	'detect' : 4,
	'system' : 5
};


// convert numeric mozilla setting to name
function settings_name(value)
{
	for (let mozname of keys(moz_proxysettings)) {
		//console.log("settings_name: " + moz_proxysettings[mozname] + " vs. " + value);
		if (moz_proxysettings[mozname] == value)
			return mozname;
	}
}

function cmd_proxynext()
{
	//alert(option_proxycycle);
	let moz_current = prefs.get('network.proxy.type'); // current setting
	let moz_current_name = settings_name(moz_current); // current setting as a name
	let proxycycle_next = option_proxycycle.indexOf(moz_current_name) + 1; // name after current setting in options
	//alert("current: " + moz_current + " (" + moz_current_name + ")");
	//alert("next?: " + proxycycle_next + " | " + option_proxycycle.length);
	if (proxycycle_next >= option_proxycycle.length)
		// wrap
		proxycycle_next = 0;

	let moz_newsetting = moz_proxysettings[option_proxycycle[proxycycle_next]];
	let moz_newsetting_name = settings_name(moz_newsetting);
	//alert("result: >" + moz_newsetting + "<" );
	prefs.set('network.proxy.type', moz_newsetting);
	dactyl.echomsg(moz_newsetting_name);
}

group.commands.add(["proxynext", "pn"],
            "Switch to next proxy setting",
            function (args) {
		    cmd_proxynext();
});

