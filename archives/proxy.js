/**
 * ==VimperatorPlugin==
 * @name           proxy.js
 * @description    proxy setting plugin
 * @description-ja プロクシ設定
 * @minVersion     0.6pre
 * @author         cho45, halt feits
 * @version        0.6.2
 * ==/VimperatorPlugin==
 *
 * Usage:
 * :proxy {conf_name}         -> set proxy setting to conf_name
 *
 * The proxy_settings is a string variable which can set on
 * vimperatorrc as following.
 *
 * let proxy_settings = "[{ { conf_name:'disable', conf_usage:'direct connection', settings:[{label:'type', param:0}] } }]"
 *
 * or your can set it using inline JavaScript.
 *
 * javascript <<EOM
 * liberator.globalVariables.proxy_settings = [
 *    {
 *       conf_name: 'disable',
 *       conf_usage: 'direct connection',
 *       settings: [
 *       {
 *          label: 'type',
 *          param: 0
 *       }
 *       ]
 *    },
 *    {
 *       conf_name: 'squid',
 *       conf_usage: 'use squid cache proxy',
 *       settings: [
 *       {
 *          label: 'type',
 *          param: 1
 *       },
 *       {
 *          label: 'http',
 *          param: 'squid.example.com'
 *       },
 *       {
 *          label: 'http_port',
 *          param: 3128
 *       }
 *       ]
 *    }
 * ];
 * EOM
 */

if (!options.proxy_settings) {
    options.proxy_settings = [
        {
            conf_name: 'disable',
            conf_usage: 'direct connection',
            settings: [
                {
                    label: 'type',
                    param: 0
                }
            ]
        },
        {
            conf_name: 'polipo',
            conf_usage: 'use polipo cache proxy',
            settings: [
                {
                    label: 'type',
                    param: 1
                },
                {
                    label: 'http',
                    param: 'localhost'
                },
                {
                    label: 'http_port',
                    param: 8123
                }
            ]
        }
    ];
}

var proxy_settings = options.proxy_settings;

group.commands.add(["proxy"], 'Proxy settings', function (args) {
    const prefs = Components.classes["@mozilla.org/preferences-service;1"]
              .getService(Components.interfaces.nsIPrefService);
    var name = (args.length > 1) ? args[0].toString() : args.string;

    if (!name) {
        dactyl.echo("Usage: proxy {setting name}");
    }
    proxy_settings.some(function (proxy_setting) {
        if (proxy_setting.conf_name.toLowerCase() != name.toLowerCase()) {
            return false;
        }

        //delete setting
        ['http', 'ssl', 'ftp', 'gopher'].forEach(function (scheme_name) {
            prefs.setCharPref("network.proxy." + scheme_name, '');
            prefs.setIntPref("network.proxy." + scheme_name + "_port", 0);
        });

        proxy_setting.settings.forEach(function (conf) {
            options.setPref('network.proxy.' + conf.label, conf.param);
        });

        dactyl.echo("Set config: " + name);
        return true;
    });
},
{
    completer: function (context, args) {
        var completions = [];
        context.title = ["Proxy Name", "Proxy Usage"];
        context.completions = [[c.conf_name, c.conf_usage] for each (c in proxy_settings)];
    }
});

// vim: set sw=4 ts=4 et:
