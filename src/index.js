const {securely, secureNewWin} = require('./securely');
const hook = require('./hook');
const hookOpen = require('./open');
const hookLoadSetters = require('./listeners');
const hookDOMInserters = require('./inserters');

export default function onWin(cb, win = window) {
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

    secureNewWin(win);

    hookOpen(win, hookWin);
    hookLoadSetters(win, hookWin);
    hookDOMInserters(win, hookWin);

    cb(win);
}
