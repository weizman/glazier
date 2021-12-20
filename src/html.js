const natives = require('./natives')();
const {getFramesArray} = require('./utils');

function handleHTML(win, args) {
    for (let i = 0; i < args.length; i++) {
        const html = args[i];
        if (typeof html !== 'string') {
            continue;
        }
        const template = natives['Document'].prototype.createElement.call(document, 'template');
        natives['setInnerHTML'].call(template, html);
        const frames = getFramesArray(template.content, false);
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            natives['Element'].prototype.removeAttribute.call(frame, 'onload');
        }
        args[i] = natives['getInnerHTML'].call(template);
    }
}

module.exports = handleHTML;