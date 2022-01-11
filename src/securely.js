const secure = require('../../natives-manager/src/index');

const wins = [top];

const config = {
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