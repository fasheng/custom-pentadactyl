'use strict';
// kindle.js -- reader
// @Author:      eric.zou (frederick.zou@gmail.com)
// @License:     GPL (see http://www.gnu.org/licenses/gpl.txt)
// @Created:     Fri 25 Mar 2011 10:52:58 PM CST
// @Last Change: Sat 21 Jun 2014 12:35:46 AM CST
// @Revision:    555
// @Description:
// @Usage:
// @TODO:
// @CHANGES:

// 检查添加的是否为document.body，需要特殊处理
// 从caret_hint查找如何定位界面元素
// javascript利用xpath选择器
// tr/td/li/dt/dd，这些不合法的标签合法化。
// font-family
// 记录 url,来判断是否失效.
// 不适用于 xml 文件？

let CANVAS_ID = 'e37162';
let ARTICLE_ID = 'd42809';
let KINDLE_MODE = 'k';
let KINDLE_MODENAME = 'K';
let MAP_PREFIX = ',';

let STYLE_HIGHCONTRAST = literal(function() /*
    #e37162 {
        position: fixed;
        width: 100%;
        height: 100%;
        background-color:#68685C;
        left: 0;
        top: 0;
        padding: 0;
        opacity: 0.95;
    }
    #d42809 {
        box-shadow: 0 0 1em #CCC;
        position: absolute;
        background-color:#000000;
        color: #FFFFFF;
        top: 0;
        margin: 0 auto;
        padding: 40px;
        width: 50%;
        min-width: 600px;
        text-align:left;
        opacity: 1.0;
        overflow: auto;
        min-height: 100%;
    }
    #d42809 * {
        -moz-hyphens: auto;
        font-size:20px;
        line-height:42px;
        font-family: Georgia,Palatino,Baskerville,'New Baskerville',serif;
    }
    #d42809.wide-display * {
        font-family: 'Microsoft Yahei',sans-serif !important;
        text-align:justify;
    }
    #d42809.wide-display p {
        text-indent: 2em;
    }

    #d42809 a {
        text-decoration: none;
        color: blue;
    }

    #d42809 h1 {
        font-weight:bold;
        font-size:150%;
        text-align:center;
    }

    #d42809 li {
    }

    #d42809 #d42809_title {
        text-shadow: -1px 2px 3px;
        display:none;
        color:#333333;
        font-family: Georgia,Palatino,Baskerville,'New Baskerville',serif;
        font-size:24px;
        letter-spacing: 5px;
        text-align: center;
        text-transform: uppercase;
        font-weight:bolder;
        line-height: 32px;
        margin-bottom:40px;
    }

    #d42809 p {
    }
*/$);

// I just took this from the firebug.
// ~/Vcs/fbug-read-only/branches/firebug1.10/content/firebug/lib
let CSS = {
    getLocalName : function(element) {
        return element.nodeName.toLowerCase(); // @TODO
    },
    getElementCSSSelector : function(element) {
        if (!element || !element.localName)
            return 'null';

        var label = CSS.getLocalName(element);
        if (element.id)
            label += '#' + element.id;

        if (element.classList && element.classList.length > 0)
            label += '.' + element.classList.item(0);

        return label;
    },

    getElementCSSPath : function(element) {
        var paths = [];

        for (; element && element.nodeType == 1; element = element.parentNode) {
            var selector = CSS.getElementCSSSelector(element);
            paths.splice(0, 0, selector);
        }

        return paths.length ? paths.join(' ') : null;
    }
};

let RAW_STYLE = literal(function() /*
        background-color:#FBF0D9;
        top: 0;
        margin: 0 auto;
        padding: 40px;
        width: 50%;
        min-width: 600px;
        text-align:left;
        opacity: 1.0;
        overflow: auto;
*/$);

let STYLE = literal(function() /*
    #e37162 {
        position: fixed;
        width: 100%;
        height: 100%;
        background-color:#68685C;
        left: 0;
        top: 0;
        padding: 0;
        opacity: 0.95;
    }
    #d42809 {
        box-shadow: 0 0 1em #CCC;
        position: absolute;
        background-color:#FBF0D9;
        top: 0;
        margin: 0 auto;
        padding: 40px;
        width: 50%;
        min-width: 600px;
        text-align:left;
        opacity: 1.0;
        overflow: auto;
        min-height: 100%;
    }
    #d42809 * {
        -moz-hyphens: auto;
        font-size:20px;
        line-height:42px;
        font-family: Georgia,Palatino,Baskerville,'New Baskerville',serif;
    }
    #d42809.wide-display * {
        font-family: 'Microsoft Yahei',sans-serif !important;
        text-align:justify;
    }
    #d42809.wide-display p {
        text-indent: 2em;
    }

    #d42809 a {
        text-decoration: none;
        color: blue;
    }

    #d42809 h1 {
        font-weight:bold;
        font-size:150%;
        text-align:center;
    }

    #d42809 li {
    }

    #d42809 #d42809_title {
        text-shadow: -1px 2px 3px;
        display:none;
        color:#333333;
        font-family: Georgia,Palatino,Baskerville,'New Baskerville',serif;
        font-size:24px;
        letter-spacing: 5px;
        text-align: center;
        text-transform: uppercase;
        font-weight:bolder;
        line-height: 32px;
        margin-bottom:40px;
    }

    #d42809 p {
    }
*/$);

var Theme = {
    default: STYLE,
    highcontrast: STYLE_HIGHCONTRAST
};

var Kindle = function () {

    var that = this;

    var _walkTheDom = function walk(node, func) {
        func(node);
        node = node.firstChild;
        while (node) {
            walk(node, func);
            node = node.nextSibling;
        }
    };

    var _getMaxZIndex = function (elem) {
        var max = 0;
        _walkTheDom(elem, function (node) {
            var actual = node.nodeType === 1
            && content.window.getComputedStyle(node, null).getPropertyValue('z-index');
            actual = (actual === '') ? 0 : parseFloat(actual);
            if (actual > max) {
                max = actual;
            }
        });
        return max;
    };

    var _clean = function(node) {
        if (node.nodeType == Node.COMMENT_NODE || node.nodeName == 'SCRIPT' || node.nodeName == 'STYLE' || node.nodeName == 'LINK' || node.nodeName == 'IFRAME') {
            node.parentNode.removeChild(node);
            return true;
        }
        ['id', 'class', 'style', 'highlight'].forEach(function(attr) {
                try {
                    node.removeAttribute(attr);
                } catch (e) {
                    ;
                }
        });
    };
    var lastElem = {};
    that.showing = {};
    that.kindle_wrapper = {};
    var getCurrentPanelID = function () {
        return window.gBrowser.mCurrentTab.linkedPanel;
    };
    var _tidy = function (elem) {
        var path = {
            li: ['ol'],
            td: ['tr', 'tbody', 'table'],
            th: ['tr', 'tbody', 'table'],
            tr: ['tbody', 'table'],
            tbody: ['table'],
            thead: ['table'],
            tfoot: ['table'],
            dt: ['dl'],
            dd: ['dl']
        };
        var nodeName = elem.nodeName.toLowerCase();
        var road = path[nodeName] || false;
        var f = false;
        if (road) {
            road.forEach(function (name) {
                if (f) {
                    var i = content.document.createElement(name);
                    i.appendChild(f);
                    f = i;
                } else {
                    f = content.document.createElement(name);
                    f.appendChild(elem);
                }
            });
            return f;
        }
        return elem;
    };
    var _init = function (elem) {
        let cPI = getCurrentPanelID();
        lastElem[cPI] = {
            elem: elem,
            url: buffer.URL.spec
        };
        var k_elem = _tidy(elem.cloneNode(true));
        _walkTheDom(k_elem, _clean);

        var maxZIndex = _getMaxZIndex(content.document.body);

        var canvas = content.document.getElementById(CANVAS_ID);
        if (!canvas) {
            canvas = content.document.createElement('div');
            canvas.setAttribute('id', CANVAS_ID);
            canvas.style.zIndex = ++maxZIndex;
            canvas.addEventListener('click', function (e) {
                    canvas.style.display = "none";
                    content.document.body.removeChild(that.kindle_wrapper[cPI]);
                    delete that.showing[cPI];
                    delete that.kindle_wrapper[cPI];
                },
                false
            );
            that.style = content.document.createElement('style');
            that.style.setAttribute('type', 'text/css');
            that.style.setAttribute('charset', 'utf-8');
            that.style.setAttribute('id', 'kindle-theme-style');
            that.style.innerHTML = Theme[options['kindle-theme'] || options.get('kindle-theme').defaultValue];
            canvas.appendChild(that.style);

            let extraStyleRule = Theme[options['kindle-extra-style'] || options.get('kindle-extra-style').defaultValue] || "";
            extraStyleRule = extraStyleRule.trim();
            if (extraStyleRule) {
                that.extraStyle = content.document.createElement('style');
                that.extraStyle.setAttribute('type', 'text/css');
                that.extraStyle.setAttribute('charset', 'utf-8');
                that.extraStyle.setAttribute('id', 'kindle-extra-style');
                that.extraStyle.innerHTML = extraStyleRule;
                canvas.appendChild(that.extraStyle);
            }

            content.document.body.appendChild(canvas);
        }
        canvas.style.display = "block";

        // document title
        var article_title = content.document.createElement('label');
        article_title.setAttribute('id', ARTICLE_ID + '_title');
        article_title.innerHTML = content.document.title;

        var article = content.document.createElement('div');
        article.setAttribute('id', ARTICLE_ID);
        if (_isWide(content.window)) {
            article.classList.add("wide-display");
        }
        article.style.zIndex = ++maxZIndex;
        article.addEventListener('click', function (e) {
                e.stopPropagation();
            },
            false
        );

        article.appendChild(article_title);
        article.appendChild(k_elem);
        content.document.body.appendChild(article);
        article.scrollIntoView(true);
        _center(article);

        that.showing[cPI] = true;
        that.kindle_wrapper[cPI] = article;
    };
    var _center = function(elem) {
        var offsetWidth = elem.offsetWidth;
        var documentWidth = content.document.documentElement.clientWidth;
        var left = (documentWidth - offsetWidth) / 2;
        elem.style.left = left + "px";
    };

    var _raw = function(elem) {
        elem.setAttribute('origstyle', elem.getAttribute('style'));
        elem.setAttribute('style', RAW_STYLE);

        let visible_width = content.window.innerWidth;
        let elem_width = elem.offsetWidth;

    };

    var _toggleraw = function() {
        let elem = content.document.querySelector("[origstyle]");
        if (elem) {
            elem.setAttribute('style', elem.getAttribute('origstyle'));
            elem.removeAttribute('origstyle');
        } else {

        }
    };

    var _filter = function (elem) {
        let cPI = getCurrentPanelID();
        if (that.showing[cPI] && _checkElem()) {
            return false;
        }
        if (elem.nodeName === 'ARTICLE')
            return true;
        var text = elem.textContent.replace(/[\s\r\n\t]+/g, '');
        return _mb_strlen(text) >= parseInt(options['kindle-length'], 10);
    };

    var _mb_strlen = function (str) {
        var len = 0;
        for (var i = 0; i < str.length; i++) {
            len += str.charCodeAt(i) < 255 ? 1 : 2; // 宽字符算两个
        }
        return len;
    };

    var _restore = function () {
        let cPI = getCurrentPanelID();
        if (that.showing[cPI] && _checkElem()) {
            lastElem[cPI]['elem'].scrollIntoView(true);
            content.document.body.removeChild(that.kindle_wrapper[cPI]);
            var canvas = content.document.getElementById(CANVAS_ID);
            if (canvas) {
                canvas.style.display = "none";
            }
            delete that.showing[cPI];
            delete that.kindle_wrapper[cPI];
        } else {
            if (typeof lastElem[cPI] !== 'undefined' && lastElem[cPI]['url'] == buffer.URL)
                _init(lastElem[cPI]['elem']);
            else {
                hints.show(KINDLE_MODENAME);
            }
        }
    };

    var _destory = function () {
        let cPI = getCurrentPanelID();
        content.document.body.removeChild(that.kindle_wrapper[cPI]);
        var canvas = content.document.getElementById(CANVAS_ID);
        if (canvas) {
            canvas.style.display = "none";
        }
        delete that.kindle_wrapper[cPI];
        lastElem[cPI]['elem'].scrollIntoView(true);
        delete that.showing[cPI];
    };

    var _toggle = function () {
        let cPI = getCurrentPanelID();
        if (that.showing[cPI] && _checkElem()) {
            _destory();
        } else {
            hints.show(KINDLE_MODENAME);
        }
    };

    var _checkElem = function () {
        if (content.document.getElementById(ARTICLE_ID))
            return true;
        return false;
    };

    var _free = function (aEvent) {
        let aTab = aEvent.target;
        delete that.showing[aTab.linkedPanel];
        delete that.kindle_wrapper[aTab.linkedPanel];
    };

    var _dump = function () {
        dump(that.showing.toSource());
        ['\n','\n'].forEach(function (item) {dump(item);});
    };

    var _changeTheme = function(theme) {
        try {
            that.style.innerHTML = Theme[theme];
        } catch (e) {}
    };

    var _appendStyle = function(css) {
        try {
            that.extraStyle.innerHTML = css;
        } catch (e) {}
    };

    // 检测 ascii 之外的宽字符
    var _isWide = function(win) {
        let document = win.document;
        let title = document.title;
        let description = '';
        let keywords = '';

        let node = document.querySelector("meta[name='description']");
        if (node)
            description = node.getAttribute("content") || '';
        let node = document.querySelector("meta[name='keywords']");
        if (node)
            keywords = node.getAttribute("content") || '';
        return Array.some([title, description, keywords], function(text) {
            return Array.some(text, function(char) {
                return char.charCodeAt(0) > 255;
            });
        });
    };

    return {
        init : _init,
        restore: _restore,
        filter: _filter,
        toggle: _toggle,
        free: _free,
        dump: _dump,
        MODENAME: KINDLE_MODE,
        changeTheme: _changeTheme,
        appendStyle: _appendStyle,
        toggleraw: _toggleraw
    };
};
let K = new Kindle();
hints.addMode(KINDLE_MODENAME, 'Kindle Mode', function (elem) K.init(elem), K.filter, ['*']);

group.mappings.add([modes.NORMAL],
    [MAP_PREFIX + K.MODENAME],
    'Reuse Previous Area',
    K.restore
);

group.mappings.add([modes.NORMAL],
    [MAP_PREFIX + 'r'],
    'Don\'t minify the dom, just use the original source!',
    K.toggleraw
);

group.mappings.add([modes.NORMAL],
    [MAP_PREFIX + (K.MODENAME===K.MODENAME.toUpperCase() ? K.MODENAME.toLowerCase() : K.MODENAME.toUpperCase())],
    'Toggle Kindle Mode',
    K.toggle
);

group.options.add(['kindle-length', 'kinl'],
    'Element\'s content length',
    'number',
    1000
);

group.options.add(['kindle-extra-style', 'kines'],
    '额外的主题样式',
    'string',
    '',
    {
        setter: function(css) {
            K.appendStyle(css);
        }
    }
);

group.options.add(['kindle-theme', 'kint'],
    '配色主题',
    'string',
    'default',
    {
        completer: function (context) [
            ['default', 'default scheme'],
            ['highcontrast', 'high contrast scheme']
        ],
        setter: function(value) {
            K.changeTheme(value);
        }
    }
);

window.gBrowser.tabContainer.addEventListener('TabClose', K.free, false);

function onUnload() { // :rehash, exit firefox/current window, disable pentadactyl extension
    window.gBrowser.tabContainer.removeEventListener('TabClose', K.free, false);
}
// iframe, frameset, use importNode, 然后将显示放到最上层浏览器窗口 iframe.parent
// //*[name()!='A' and name()!='SPAN' and name()!='INPUT' and name()!='EM']
// use bytes instead of length
// 使用 scrollWidth 来判断显示全部内容所需要的宽度
// http://dist.schmorp.de/rxvt-unicode/Changes
// xml
// 检测 html5 article 标签
// 利用 html5 调色板来控制背景，前景色
// vim: set et ts=4 sw=4:
// checkout View->Zoom->Zoom text only.
// 背景用普通的 layer 实现，
// <div id="layer" style="width:100%;height:100%;z-index:1;"></div>
// <div id="content" style="z-index:2;"></div>
// zoom text only (not) ，自动把页面放大，不只是放大字体。
// evernote clearly, ireader, readability
// vim: set et ts=4 sw=4:
// 一键自动选择最可能的元素，比如 <article>
// 自动放大页面某一区域到最合适大小
// 自动高亮某一区域
