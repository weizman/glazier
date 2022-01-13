const secure = require('../../natives-manager/src/index');

const wins = [top];

const config = {
    objects: {
        'document': ['createElement'],
        'Object': ['defineProperty', 'getOwnPropertyDescriptor'],
    },
    prototypes: {
        'Function': ['apply'],
        'Map': ['get', 'set'],
        'Node': ['nodeType', 'parentElement', 'toString'],
        'Document': ['querySelectorAll'],
        'DocumentFragment': ['querySelectorAll', 'toString'],
        'Object': ['toString'],
        'Array': ['includes', 'push', 'slice'],
        'Element': ['innerHTML', 'toString', 'querySelectorAll', 'getAttribute', 'removeAttribute'],
        'HTMLElement': ['onload', 'toString'],
        'EventTarget': ['addEventListener'],
    }
};

const securely = secure(top, config);

function secureNewWin(win) {
    securely(() => {
        if (!wins.includesS(win)) {
            wins.pushS(win);
            secure(win, config);
        }
    });
}

module.exports = {securely, secureNewWin};