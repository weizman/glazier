const natives = require('./natives')();
const hook = require('./hook');
const {fillArrayUniques} = require('./utils');
const hookLoadSetters = require('./listeners');
const hookDOMInserters = require('./inserters');

const wins = [];

export default function onWin(cb, win = window) {
    function hookWin(contentWindow) {
        onWin(cb, contentWindow);
        const frame = contentWindow.frameElement;
        natives['addEventListener'].call(frame, 'load', function() {
            hook(win, [this], function() {
                onWin(cb, contentWindow);
            });
        });
    }

    if (!fillArrayUniques(wins, [win])) {
        return;
    }

    hookLoadSetters(win, hookWin);
    hookDOMInserters(win, hookWin);

    cb(win);
}
