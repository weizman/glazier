const secure = require('../../natives-manager/src/index');
const hook = require('./hook');
const hookOpen = require('./open');
const hookLoadSetters = require('./listeners');
const hookDOMInserters = require('./inserters');

const config = {
    objects: {
        'window': ['fetch'],
        'Object': ['defineProperty', 'getOwnPropertyDescriptor']
    },
    prototypes: {
        'Map': ['get', 'set'],
        'Node': ['nodeType', 'parentElement'],
        'Document': [],
        'DocumentFragment': [],
        'Object': ['toString'],
        'Array': ['includes', 'push', 'slice'],
        'Element': ['innerHTML'],
        'HTMLElement': ['onload'],
        'EventTarget': ['addEventListener'],
    }
};

const securely = secure(top, config);
const wins = [top];

export default function onWin(cb, win = window) {
    securely(() => {
        if (!wins.includesS(win)) {
            wins.pushS(win);
            secure(win, config);
        }
    });

    function hookWin(contentWindow) {
        onWin(cb, contentWindow);
        securely(() => {
            contentWindow.frameElement.addEventListenerS('load', function() {
                hook(win, [this], function() {
                    onWin(cb, contentWindow);
                });
            });
        });
    }

    hookOpen(win, hookWin);
    hookLoadSetters(win, securely, hookWin);
    hookDOMInserters(win, securely, hookWin);

    cb(win);
}
