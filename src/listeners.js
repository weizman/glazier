const hook = require('./hook');
const {getArguments} = require('./utils');

function callOnload(that, onload, args) {
    if (onload) {
        if (onload.handleEvent) {
            return onload.handleEvent.apply(onload, args);
        }
        else {
            return onload.apply(that, args);
        }
    }
}

function getHook(win, securely, addEventListener, cb) {
    return function() {
        const args = getArguments(arguments);
        const index = typeof args[0] === 'function' ? 0 : 1;
        const onload = args[index];
        args[index] = function listener() {
            hook(win, [this], cb);
            const args = getArguments(arguments);
            callOnload(this, onload, args);
        };
        return securely(() => this.addEventListenerS(args[0], args[1], args[2], args[3]));
    }
}

function hookLoadSetters(win, securely, cb) {
    securely(() => ObjectS.defineProperty(win.EventTarget.prototype, 'addEventListener', {value: getHook(win, securely, addEventListener, cb)}));
}

module.exports = hookLoadSetters;