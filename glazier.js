/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 654:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var natives = __webpack_require__(14)();

var hook = __webpack_require__(228);

var _require = __webpack_require__(648),
    getFramesArray = _require.getFramesArray,
    isFrameElement = _require.isFrameElement;

function resetOnloadAttribute(win, frame, cb) {
  if (!isFrameElement(frame)) {
    return;
  }

  var onload = natives['getOnload'].call(frame);

  if (onload) {
    natives['setOnload'].call(frame, null);
    natives['Element'].prototype.removeAttribute.call(frame, 'onload');
    natives['addEventListener'].call(frame, 'load', function () {
      hook(win, [this], cb);
    });
    natives['setOnload'].call(frame, onload);
  }
}

function resetOnloadAttributes(win, args, cb) {
  for (var i = 0; i < args.length; i++) {
    var element = args[i];
    var frames = getFramesArray(element, true);

    for (var _i = 0; _i < frames.length; _i++) {
      var frame = frames[_i];
      resetOnloadAttribute(win, frame, cb);
    }
  }
}

module.exports = resetOnloadAttributes;

/***/ }),

/***/ 750:
/***/ ((module) => {

/*

This crazy function is a workaround to support 'object' in this project
in chromium due to a bug that can be reproduced by running:

<script>
    document.body.innerHTML = ('<object id="wow" data="/" />');
    alert(window[0]); // undefined
    wow.contentWindow.frameElement;
    alert(window[0]); // [object Window]
</script>

Seems that in order for the object frame to appear in window.frames,
one must first try to access any property of it.

This for some reason registers it to the window.frames list, otherwise it won't be there.

*/
function workaroundChromiumBug(frame) {
  frame && frame.contentWindow;
}

module.exports = workaroundChromiumBug;

/***/ }),

/***/ 228:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isCrossOrigin = __webpack_require__(851);

var natives = __webpack_require__(14)();

var workaroundChromiumBug = __webpack_require__(750);

function findWin(win, frameElement) {
  var frame = null,
      i = -1;

  while (win[++i]) {
    if (!isCrossOrigin(win[i], win, natives['Object'])) {
      if (win[i].frameElement === frameElement) {
        frame = win[i];
        break;
      }
    }
  }

  return frame;
}

function hook(win, frames, cb) {
  for (var i = 0; i < frames.length; i++) {
    var frame = frames[i];
    workaroundChromiumBug(frame);
    var contentWindow = findWin(win, frame);

    if (contentWindow) {
      cb(contentWindow);
    }
  }
}

module.exports = hook;

/***/ }),

/***/ 328:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var natives = __webpack_require__(14)();

var _require = __webpack_require__(648),
    getFramesArray = _require.getFramesArray;

var WARN_OF_ONLOAD_ATTRIBUTES = false; // DEBUG MODE ONLY!

var WARN_OF_ONLOAD_ATTRIBUTES_MSG = 'WARN: Glazier: Removing html string iframe onload attribute:';

function dropOnLoadAttributes(frames) {
  for (var i = 0; i < frames.length; i++) {
    var frame = frames[i];

    if (WARN_OF_ONLOAD_ATTRIBUTES) {
      var onload = natives['Element'].prototype.getAttribute.call(frame, 'onload');

      if (onload) {
        console.warn(WARN_OF_ONLOAD_ATTRIBUTES_MSG, frame, onload);
      }
    }

    natives['Element'].prototype.removeAttribute.call(frame, 'onload');
  }
}

function handleHTML(win, args) {
  for (var i = 0; i < args.length; i++) {
    var html = args[i];

    if (typeof html !== 'string') {
      continue;
    }

    var template = natives['Document'].prototype.createElement.call(document, 'template');
    natives['setInnerHTML'].call(template, html);
    var frames = getFramesArray(template.content, false);
    dropOnLoadAttributes(frames);
    args[i] = natives['getInnerHTML'].call(template);
  }
}

module.exports = handleHTML;

/***/ }),

/***/ 58:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var resetOnloadAttributes = __webpack_require__(654);

var _require = __webpack_require__(733),
    securely = _require.securely;

var _require2 = __webpack_require__(648),
    getFramesArray = _require2.getFramesArray,
    getArguments = _require2.getArguments;

var handleHTML = __webpack_require__(328);

var hook = __webpack_require__(228);

var map = {
  Document: ['replaceChildren', 'append', 'prepend', 'write', 'writeln'],
  Node: ['appendChild', 'insertBefore', 'replaceChild'],
  Element: ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'replaceWith', 'insertAdjacentElement', 'append', 'before', 'prepend', 'after', 'replaceChildren']
};

function getHook(win, native, cb) {
  return function () {
    var _this = this;

    var args = getArguments(arguments);
    var element = securely(function () {
      return _this.parentElementS || _this;
    });
    resetOnloadAttributes(win, args, cb);
    handleHTML(win, args);
    var ret = native.apply(this, args);
    var frames = getFramesArray(element, false);
    hook(win, frames, cb);
    hook(win, args, cb);
    return ret;
  };
}

function hookDOMInserters(win, cb) {
  var _loop = function _loop(proto) {
    var funcs = map[proto];

    var _loop2 = function _loop2(i) {
      var func = funcs[i];
      securely(function () {
        var desc = ObjectS.getOwnPropertyDescriptor(win[proto + 'S'].prototype, func);
        var prop = desc.set ? 'set' : 'value';
        desc[prop] = getHook(win, desc[prop], cb);
        ObjectS.defineProperty(win[proto].prototype, func, desc);
      });
    };

    for (var i = 0; i < funcs.length; i++) {
      _loop2(i);
    }
  };

  for (var proto in map) {
    _loop(proto);
  }
}

module.exports = hookDOMInserters;

/***/ }),

/***/ 459:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var hook = __webpack_require__(228);

var _require = __webpack_require__(733),
    securely = _require.securely;

var _require2 = __webpack_require__(648),
    getArguments = _require2.getArguments;

function callOnload(that, onload, args) {
  if (onload) {
    if (onload.handleEvent) {
      return onload.handleEvent.apply(onload, args);
    } else {
      return onload.apply(that, args);
    }
  }
}

function getHook(win, addEventListener, cb) {
  return function () {
    var _this = this;

    var args = getArguments(arguments);
    var index = typeof args[0] === 'function' ? 0 : 1;
    var onload = args[index];

    args[index] = function listener() {
      hook(win, [this], cb);
      var args = getArguments(arguments);
      callOnload(this, onload, args);
    };

    return securely(function () {
      return _this.addEventListenerS(args[0], args[1], args[2], args[3]);
    });
  };
}

function hookLoadSetters(win, cb) {
  securely(function () {
    return ObjectS.defineProperty(win.EventTarget.prototype, 'addEventListener', {
      value: getHook(win, addEventListener, cb)
    });
  });
}

module.exports = hookLoadSetters;

/***/ }),

/***/ 14:
/***/ ((module) => {

var natives = {};
var extracted = false;

function extractNatives() {
  var ifr = document.createElement('iframe');
  document.head.appendChild(ifr);
  natives['Document'] = ifr.contentWindow.Document;
  natives['DocumentFragment'] = ifr.contentWindow.DocumentFragment;
  natives['Object'] = ifr.contentWindow.Object;
  natives['Array'] = ifr.contentWindow.Array;
  natives['Node'] = ifr.contentWindow.Node;
  natives['Element'] = ifr.contentWindow.Element;
  natives['HTMLElement'] = ifr.contentWindow.HTMLElement;
  natives['EventTarget'] = ifr.contentWindow.EventTarget;
  natives['toStringObject'] = natives['Object'].prototype.toString;
  natives['getNodeType'] = natives['Object'].getOwnPropertyDescriptor(natives['Node'].prototype, 'nodeType').get;
  natives['getParentElement'] = natives['Object'].getOwnPropertyDescriptor(natives['Node'].prototype, 'parentElement').get;
  natives['addEventListener'] = natives['Object'].getOwnPropertyDescriptor(ifr.contentWindow.EventTarget.prototype, 'addEventListener').value;
  natives['getOnload'] = natives['Object'].getOwnPropertyDescriptor(natives['HTMLElement'].prototype, 'onload').get;
  natives['setOnload'] = natives['Object'].getOwnPropertyDescriptor(natives['HTMLElement'].prototype, 'onload').set;
  natives['getInnerHTML'] = natives['Object'].getOwnPropertyDescriptor(natives['Element'].prototype, 'innerHTML').get;
  natives['setInnerHTML'] = natives['Object'].getOwnPropertyDescriptor(natives['Element'].prototype, 'innerHTML').set;
  ifr.parentElement.removeChild(ifr);
}

function getNatives() {
  if (!extracted) {
    extractNatives();
    extracted = true;
  }

  return natives;
}

module.exports = getNatives;

/***/ }),

/***/ 583:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _require = __webpack_require__(648),
    getArguments = _require.getArguments; // https://github.com/weizman/glazier/issues/2


var ISSUE_2_SOLVED = false;

function hookOpen(win, cb) {
  var realOpen = win.open;

  win.open = function () {
    if (!ISSUE_2_SOLVED) {
      return null;
    }

    var args = getArguments(arguments);
    var opened = realOpen.apply(this, args);
    cb(opened);
    return opened;
  };
}

module.exports = hookOpen;

/***/ }),

/***/ 733:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var secure = __webpack_require__(983);

var wins = [top];
var config = {
  objects: {
    'Object': ['defineProperty', 'getOwnPropertyDescriptor']
  },
  prototypes: {
    'Map': ['get', 'set'],
    'Node': ['nodeType', 'parentElement', 'toString'],
    'Document': [],
    'DocumentFragment': [],
    'Object': ['toString'],
    'Array': ['includes', 'push', 'slice'],
    'Element': ['innerHTML', 'toString'],
    'HTMLElement': ['onload', 'toString'],
    'EventTarget': ['addEventListener']
  }
};
var securely = secure(top, config);

function secureNewWin(win) {
  securely(function () {
    if (!wins.includesS(win)) {
      wins.pushS(win);
      secure(win, config);
    }
  });
}

module.exports = {
  securely: securely,
  secureNewWin: secureNewWin
};

/***/ }),

/***/ 648:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _require = __webpack_require__(733),
    securely = _require.securely;

function getArguments(oldArgs) {
  var args = [];

  for (var i = 0; i < oldArgs.length; i++) {
    args[i] = oldArgs[i];
  }

  return args;
}

function isTrustedHTML(node) {
  return securely(function () {
    return node.toStringS();
  }) === '[object TrustedHTML]';
}

function getPrototype(node) {
  switch (securely(function () {
    return node.toStringS();
  })) {
    case '[object HTMLDocument]':
      return securely(function () {
        return window.DocumentS;
      });

    case '[object DocumentFragment]':
      return securely(function () {
        return window.DocumentFragmentS;
      });

    default:
      return securely(function () {
        return window.ElementS;
      });
  }
}

function isFrameElement(element) {
  return securely(function () {
    return ['[object HTMLIFrameElement]', '[object HTMLFrameElement]', '[object HTMLObjectElement]', '[object HTMLEmbedElement]'].includesS(element.toStringS());
  });
}

function canNodeRunQuerySelector(node) {
  return securely(function () {
    return [ElementS.prototype.ELEMENT_NODE, ElementS.prototype.DOCUMENT_FRAGMENT_NODE, ElementS.prototype.DOCUMENT_NODE].includesS(node.nodeTypeS);
  });
}

function getFramesArray(element, includingParent) {
  var frames = [];

  if (null === element || _typeof(element) !== 'object') {
    return frames;
  }

  if (isTrustedHTML(element) || !canNodeRunQuerySelector(element)) {
    return frames;
  }

  var list = getPrototype(element).prototype.querySelectorAll.call(element, 'iframe,frame,object,embed');
  fillArrayUniques(frames, securely(function () {
    return list.sliceS();
  }));

  if (includingParent) {
    fillArrayUniques(frames, [element]);
  }

  return frames;
}

function fillArrayUniques(arr, items) {
  var isArrUpdated = false;

  var _loop = function _loop(i) {
    securely(function () {
      if (!arr.includesS(items[i])) {
        arr.pushS(items[i]);
        isArrUpdated = true;
      }
    });
  };

  for (var i = 0; i < items.length; i++) {
    _loop(i);
  }

  return isArrUpdated;
}

module.exports = {
  getArguments: getArguments,
  getFramesArray: getFramesArray,
  isFrameElement: isFrameElement
};

/***/ }),

/***/ 983:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var objects = __webpack_require__(586);

var prototypes = __webpack_require__(587);

var allowNativesAccess = false;

function shouldAllowNativesAccess() {
  return allowNativesAccess;
}

function native(win, cb) {
  var ifr = win.document.createElement('iframe');
  win.document.head.appendChild(ifr);
  cb(ifr.contentWindow);
  ifr.parentElement.removeChild(ifr);
}

function secure(win) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    objects: {},
    prototypes: {}
  };
  native(win, function (nativeWin) {
    objects(win, nativeWin, shouldAllowNativesAccess, config.objects);
    prototypes(win, nativeWin, shouldAllowNativesAccess, config.prototypes);
  });
  return function securely(cb, a, b, c, d, e, f, g, h, i, j) {
    var state = allowNativesAccess;
    allowNativesAccess = true;
    var ret, err;

    try {
      ret = cb(a, b, c, d, e, f, g, h, i, j);
    } catch (e) {
      err = e;
    }

    if (!state) {
      allowNativesAccess = false;
    }

    if (err) {
      throw err;
    }

    return ret;
  };
}

module.exports = secure;

/***/ }),

/***/ 586:
/***/ ((module) => {

module.exports = function objects(win, nativeWin, shouldAllowNativesAccess, objects) {
  for (var object in objects) {
    var apis = objects[object];

    var _loop = function _loop(i) {
      var api = apis[i];
      var native = nativeWin[object][api];

      if (typeof native === 'function') {
        native = native.bind(nativeWin[object]);
      }

      nativeWin['Object'].defineProperty(nativeWin[object], api + 'S', {
        configurable: false,
        get: function get() {
          if (!shouldAllowNativesAccess()) {
            return;
          }

          return native;
        }
      });
    };

    for (var i = 0; i < apis.length; i++) {
      _loop(i);
    }
  }
};

/***/ }),

/***/ 587:
/***/ ((module) => {

function getProtoString(proto) {
  return (proto.prototype + '').split(' ')[1].split(']')[0];
}

function xxx(desc, shouldAllowNativesAccess) {
  var value = desc.value;
  desc.configurable = false;

  var get = desc.get || function () {
    return value;
  };

  delete desc.value;
  delete desc.writable;

  desc.get = function () {
    if (!shouldAllowNativesAccess()) {
      return;
    }

    return get.apply(this, arguments);
  };

  return desc;
}

function yyy(win, nativeWin, done, shouldAllowNativesAccess, prototype, property) {
  var proto = win[prototype];
  var arr = [];

  while (true) {
    var _desc = nativeWin['Object'].getOwnPropertyDescriptor(proto.prototype, property);

    arr.push(proto.prototype);

    if (_desc) {
      break;
    }

    proto = Object.getPrototypeOf(proto.prototype).constructor;
  }

  var desc = nativeWin['Object'].getOwnPropertyDescriptor(arr[arr.length - 1], property);

  while (arr.length) {
    var _proto = arr.pop();

    if (!done[_proto.constructor.name] || !done[_proto.constructor.name].includes(property)) {
      nativeWin['Object'].defineProperty(_proto, property + 'S', xxx(desc, shouldAllowNativesAccess));
      done[_proto.constructor.name] = done[_proto.constructor.name] || [];

      done[_proto.constructor.name].push(property);
    }
  }
}

module.exports = function prototypes(win, nativeWin, shouldAllowNativesAccess, prototypes) {
  var done = {};

  var _loop = function _loop(prototype) {
    var native = nativeWin[prototype];
    nativeWin['Object'].defineProperty(win, prototype + 'S', {
      configurable: false,
      get: function get() {
        if (!shouldAllowNativesAccess()) {
          return;
        }

        return native;
      }
    });
    done[prototype] = done[prototype] || [];
    var properties = prototypes[prototype];

    for (var i = 0; i < properties.length; i++) {
      var property = properties[i];
      yyy(win, nativeWin, done, shouldAllowNativesAccess, prototype, property);
    }
  };

  for (var prototype in prototypes) {
    _loop(prototype);
  }
};

/***/ }),

/***/ 626:
/***/ ((module) => {

module.exports = {
    SRC_IS_NOT_A_WINDOW: 'provided argument "src" must be a proper window of instance Window',
    DST_IS_NOT_A_WINDOW: 'provided argument "dst" must be a proper window of instance Window',
    SRC_IS_NOT_SAME_ORIGIN_AS_WINDOW: 'provided argument "src" must be a window in the same origin as the current context window',
}

/***/ }),

/***/ 851:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {DST_IS_NOT_A_WINDOW, SRC_IS_NOT_A_WINDOW, SRC_IS_NOT_SAME_ORIGIN_AS_WINDOW} = __webpack_require__(626);

function isWindow(obj, Object) {
    const o = Object(obj);
    return o === o.window;
}

function isCrossOrigin(dst, src, Object) {
    return Object.getPrototypeOf.call(src, dst) === null;
}

module.exports = function(dst, src = window, Object = window.Object) {
    if (!isWindow(src, Object)) {
        throw new Error(SRC_IS_NOT_A_WINDOW);
    }
    if (!isWindow(dst, Object)) {
        throw new Error(DST_IS_NOT_A_WINDOW);
    }
    if (isCrossOrigin(window, src, Object)) {
        throw new Error(SRC_IS_NOT_SAME_ORIGIN_AS_WINDOW);
    }
    return isCrossOrigin(dst, src, Object);
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./src/index.js
var _require = __webpack_require__(733),
    securely = _require.securely,
    secureNewWin = _require.secureNewWin;

var hook = __webpack_require__(228);

var hookOpen = __webpack_require__(583);

var hookLoadSetters = __webpack_require__(459);

var hookDOMInserters = __webpack_require__(58);

function onWin(cb) {
  var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

  function hookWin(contentWindow) {
    onWin(cb, contentWindow);
    securely(function () {
      contentWindow.frameElement.addEventListenerS('load', function () {
        hook(win, [this], function () {
          onWin(cb, contentWindow);
        });
      });
    });
  }

  secureNewWin(win);
  hookOpen(win, hookWin);
  hookLoadSetters(win, hookWin);
  hookDOMInserters(win, hookWin);
  cb(win);
}
;// CONCATENATED MODULE: ./build.js


(function (win) {
  Object.defineProperty(win, 'GLAZE', {
    value: onWin
  });
})(window);
})();

/******/ })()
;