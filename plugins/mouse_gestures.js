var MESSAGES = {
  'en-US': [],
  'zh-CN': []
};

var STATE_READY = 0;
var STATE_ROCKER = 1;

var MouseGestures = function() {

  const Ci = Components.interfaces;

  var Class = function() function() {this.initialize.apply(this, arguments);};
  var MouseGestures = new Class();

  var doCommandByID = function(id) {
    if (document.getElementById(id))
      document.getElementById(id).doCommand();
  };

  MouseGestures.prototype = {
    _isMouseDownL: false,
    _isMouseDownR: false,
    _isMouseDownM: false,
    _state: STATE_READY,
    _cancel: false,
    _gestureType: '鼠标手势',
    initialize: function() {
      this.parseSetting();

      var self = this;
      this.registerEvents('remove');
      this.registerEvents('add');
      window.addEventListener('unload', function() { self.registerEvents('remove'); }, false);
    },

    reloadSetting: function(obj) {
      for (let [prop, val] in Iterator(obj)) {
        switch ( prop ) {
          case '_enableRocker' :
            window.gBrowser.mPanelContainer.removeEventListener('draggesture', this, true);
            if (val)
              window.gBrowser.mPanelContainer.addEventListener('draggesture', this, true);
            break;

          case '_enableWheel' :
            window.gBrowser.mPanelContainer.removeEventListener('DOMMouseScroll', this, false);
            if (val)
              window.gBrowser.mPanelContainer.addEventListener('DOMMouseScroll', this, false);
            break;

          default: 
            break;
        }
        this[prop] = val;
      }
    },

    parseSetting: function() {
      var gestures = {};
      var self = this;
      this._showstatus = options['mgshowmsg'];
      this._enableRocker = options['mgrocker'];
      this._enableWheel = options['mgwheel'];
      this._msgContainer = options['mgmsgcontainer'];
      if (this._enableRocker) this.captureEvents.push('draggesture');
      if (this._enableWheel) this.captureEvents.push('DOMMouseScroll');
      userContext.MGLIST.forEach(function( [gesture, desc, action, noremap] ) {
        action = action || desc;
        noremap = noremap || false;
        if (typeof action == 'string') {
          let str = action;
          if (str.charAt(0) == ':') action = function() dactyl.execute(str.substr(1));
          else if (str.charAt(0) == '#') action = function() doCommandByID(str.substr(1));
          else action = function() events.feedkeys(str, noremap, true, modes.NORMAL);
        }
        gestures[gesture] = [desc, action];
      });
      this.GESTURES = gestures;
    },
    captureEvents : ['mousedown', 'mousemove', 'mouseup', 'contextmenu', 'click'],
    registerEvents: function(action) {
      var self = this;
      this.captureEvents.forEach(
          function(type) { window.gBrowser.mPanelContainer[action + 'EventListener'](type, self, type == 'contextmenu' || type == 'draggesture');
      });
    },
    set status(msg) {
      if (this._showstatus) {
        switch ( this._msgContainer) {
          case 'statusline' :
            commandline.echo(msg, null, commandline.FORCE_SINGLELINE);
            break;

          case 'indicate':
            var p = document.getElementById('statusbar-display');
            p.label = msg;

          default :
            break;
        }
      }
    },
    handleEvent: function(event) {
      switch(event.type) {
      case 'mousedown':
        this._cancel = false;
        if (event.button == 2) {
          var targetName = event.target.localName.toUpperCase();
          if (targetName == 'OBJECT' || targetName == 'EMBED') {
            break;
          }
          this._isMouseDownR = true;
          this._suppressContext = false;
          this.startGesture(event);
          if (this._enableRocker && this._isMouseDownL) {
            this._state = STATE_ROCKER;
            this._suppressContext = true;
            this._gesture = 'L>R';
            this._gestureType = '摇杆手势';
            this.stopGesture(event);
          }
        } else if (event.button == 0) {
          var targetName = event.target.localName.toUpperCase();
          if (targetName == 'INPUT' || targetName == 'TEXTAREA') {
            break;
          }
          targetName = event.originalTarget.localName;
          if (targetName == 'scrollbarbutton' || targetName == 'slider' || targetName == 'thumb') {
            break;
          }
          this._isMouseDownL = true;
          if (this._isMouseDownR && this._enableRocker) {
            this._state = STATE_ROCKER;
            this._suppressContext = true;
            this._gesture = 'L<R';
            this._gestureType = '摇杆手势';
            this.stopGesture(event);
          }
        }
        break;
      case 'mousemove':
        if (this._isMouseDownR) this.progressGesture(event);
        break;
      case 'mouseup':
        if (event.button == 2)
          this._isMouseDownR = false;
        else if (event.button == 1)
          this._isMouseDownM = false;
        else if (event.button == 0)
          this._isMouseDownL = false;
        if (event.ctrlKey || event.shiftKey) {
          this._shouldFireContext = false;
          break;
        }
        if (!this._isMouseDownR && !this._isMouseDownM && !this._isMouseDownL) {
          this._state = STATE_READY;
          this._suppressContext = !!this._gesture;
          if (this._enableWheel && this._gesture && this._gesture.charAt(0) == 'W') this._gesture = '';
          if (!this._cancel) {
            this._gestureType = '鼠标手势';
            this.stopGesture(event);
            this.timerGesture(!this._cancel);
          }
          this._cancel = false;
          if (this._shouldFireContext && !this._cancel) {      // for Linux & Mac
            this._shouldFireContext = false;
            let mEvent = event.originalTarget.ownerDocument.createEvent('MouseEvents');
            mEvent.initMouseEvent('contextmenu', true, true, event.originalTarget.defaultView, 0, event.screenX, event.screenY, event.clientX, event.clientY, false, false, false, false, 2, null);
            event.originalTarget.dispatchEvent(mEvent);
          }
        }
        break;

      case 'contextmenu':
        if (this._suppressContext || this._isMouseDownR) {
          this._suppressContext = false;
          this._shouldFireContext = this._isMouseDownR;
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case 'DOMMouseScroll':
        if (this._enableWheel && this._isMouseDownR) {
          event.preventDefault();
          event.stopPropagation();
          this._suppressContext = true;
          this._gesture = 'W' + (event.detail > 0 ? '+' : '-');
          this._gestureType = '滚轮手势';
          this.stopGesture( event, false );
        }
        break;
      case 'draggesture':
        this._isMouseDownL = false;
        break;

      case 'click':
        if (this._state == STATE_ROCKER) {
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      }
    },
    startGesture: function(event) {
      this._gesture = '';
      this._x = event.screenX;
      this._y = event.screenY;
      this._origDoc = event.originalTarget.ownerDocument;
      this._links = [];
    },
    progressGesture: function(event) {
      if (!this._origDoc) return;
      for (let node = event.originalTarget; node; node = node.parentNode) {
        if (node instanceof Ci.nsIDOMHTMLAnchorElement) {
          if (this._links.indexOf(node.href) == -1) this._links.push(node.href);
          break;
        }
      }
      this.timerGesture(this._cancel);
      var x = event.screenX, y = event.screenY;
      var distX = Math.abs(x-this._x), distY = Math.abs(y-this._y);
      var threshold = 15/ (window.gBrowser.selectedBrowser.markupDocumentViewer.fullZoom || 1.0);
      if (distX < threshold && distY < threshold) return;
      var dir = distX > distY ? (x<this._x ? 'L' : 'R') : (y<this._y ? 'U': 'D');
      if (dir != this._gesture.slice(-1)) {
        this._gesture += dir;
        this.status = '鼠标手势: ' + this._gesture + (this.GESTURES[this._gesture] ? ' (' + this.GESTURES[this._gesture][0] + ')' : '');
      }
      this._x = x; this._y = y;
    },
    timerGesture: function(isClear) {
      if (this._timer)  window.clearTimeout(this._timer);
        this._timer = window.setTimeout( !isClear ? function(self) self.stopGesture({}, true) : function(self) self._timer = self.status = '', 1000, this);
    },

    stopGesture: function(event, cancel) {
      this._cancel = cancel || false;
      if (this._gesture) {
        try {
          if (cancel) throw '手势已取消';

          let cmd = this.GESTURES[this._gesture] || null;
          if (!cmd) throw '未知手势: ' + this._gesture;

          cmd[1].call(this);
          this.status = this._gestureType+': ' + cmd[0];
        } catch (exp) {
          this.status = exp;
        }
      }
      this._origDoc = this._links = null;
      this._gesture = '';
    }
  };
  return new MouseGestures();
};

if (!userContext.MGLIST) {
  userContext.MGLIST = [
    //['UDLR', 'Description', '#id or function or ex commands or key mappings', noremap flag]
    ['L'  , 'Back', '#Browser:Back'],
    ['R'  , 'Forward', '#Browser:Forward'],
    ['RLR', 'Close Tab Or Window', '#cmd_close'],
    ['LD' , 'Stop Loading Page', '#Browser:Stop'],
    ['LR' , 'Undo Close Tab', '#History:UndoCloseTab'],
    ['U' , 'Select Previous Tab', 'gT', true],
    ['D' , 'Select Next Tab', 'gt', true],
    ['LU' , 'Scroll To Top', function() window.goDoCommand('cmd_scrollTop')],
    ['LD' , 'Scroll To Bottom', function() window.goDoCommand('cmd_scrollBottom')],
    ['UDR', 'Add Bookmark', ':dialog addbookmark'],
    ['L>R', 'Forward', '#Browser:Forward'],
    ['L<R', 'Back', '#Browser:Back'],
    ['W-' , 'Select Previous Tab', function() window.gBrowser.tabContainer.advanceSelectedTab(-1, true) ],
    ['W+' , 'Select Next Tab', function() window.gBrowser.tabContainer.advanceSelectedTab(+1, true) ],
  ];
}

group.options.add(['mgshowmsg'],
  'Show message',
  'boolean',
  true,
  {
    setter: function(value) {
      if (this.hasChanged && options['mgshowmsg'] != value)
        MG.reloadSetting({_showstatus: value});
      return value;
    }
  }
);

group.options.add(['mgrocker'],
  'Enable rocker',
  'boolean',
  true,
  {
    setter: function(value) {
      if (this.hasChanged && options['mgrocker'] != value)
        MG.reloadSetting({_enableRocker: value});
      return value;
    }
  }
);

group.options.add(['mgmsgcontainer'],
  'Gesture tips',
  'string',
  'statusline',
  {
    setter: function(value) {
      if (this.hasChanged && options['mgmsgcontainer'] != value)
        MG.reloadSetting({_msgContainer: value});
      return value;
    },
    completer: function(context) [
      ['statusline', 'Statusline'],
      ['indicate', 'Message Indicate']
    ]
  }
);

group.options.add(['mgwheel'],
  'Enable mouse wheel',
  'boolean',
  true,
  {
    setter: function(value) {
      if (this.hasChanged && options['mgwheel'] != value)
        MG.reloadSetting({_enableWheel: value});
      return value;
    }
  }
);

group.commands.add(['mouseg[estures]', 'mg'],
  'Reload Mouse Gestures',
  function (args) {
    if (args.bang) { // 强制重载
      return ex.runtime('plugins/_mouse_gestures.js');
    }

    if (args.length == 0)
      window._MouseGestures.initialize.apply(window._MouseGestures);
    else {
      let action = args[0];
      switch (action) {
        case 'reload':
        window._MouseGestures.initialize.apply(window._MouseGestures);

        case 'toggle': // TODO
        break;

        default :
        break;
      }
    }
  },
  {
    argCount: '?',
    bang: true,
    completer: function (context, args) {
      switch (args.completeArg) {
        case 0:
        context.completions = [
          ['list', 'List Mouse Gestures Settings'],
          ['reload', 'Reload Settings'],
          ['toggle', 'Toggle Mouse Gestures']
        ];
        break;

        default:
        break;
      }
    }
  },
  true
);

var MG = new MouseGestures();

function onUnload() {
    MG.registerEvents('remove');
}
/**
 * 另外它还支持摇杆手势和滚轮手势，可以设置超时取消手势，能在 Pentadactyl 状态栏显示当前正在使用的手势（会自动消失）。缺陷是不能显示鼠标轨迹，不支持 FireGestuers 的弹出菜单以及"打开鼠标划过的所有链接"功能.
 * 添加更多预设的自定义手势
 * 不知道脚本,能不能识别左上,左下这样子的手势?这个做为最大化,最小化最合适了.感觉
 * 其中 L>R 没有问题，但是 L<R 会连续关闭掉两个左侧的标签页，似乎被连续执行了两次。
 * 脚本加载时检查是否所有的手势都合法,是否有重复定义项
 */
