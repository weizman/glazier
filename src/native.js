const wrap = require('../../natives-manager/src/index');
const {getArguments} = require('./utils');

const config = {
    apis: ['fetch'],
    prototypes: {
        'Map': ['get', 'set'],
        'Node': ['nodeType', 'parentElement'],
        'Document': [],
        'DocumentFragment': [],
        'Object': ['toString'],
        'Array': ['slice'],
        'Element': ['innerHTML'],
        'HTMLElement': ['onload'],
        'EventTarget': ['addEventListener'],
    }
};

const natives = new Map();
const topNative = wrap(top, config);
natives.set(top, topNative);

function native(win, cb, args) {
    let native;
    topNative(function() {
        native = natives.getN(win);
        if (!native) {
            native = wrap(win, config);
            natives.setN(win, native);
        }
    });
    return native(cb, getArguments(args));
}

module.exports = native;