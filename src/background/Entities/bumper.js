//let Sheduler = require('core/sheduler.js');
//let sendModule = require('../communication/core.js');
import Sheduler from './core/sheduler';

class Bumper extends Sheduler{
    /**
     *
     * @param initialTime {date} - start time
     * @param refreshTime {number} - refresh time in milliseconds
     * @param duration {number} - duration in milliseconds
     * @param tabId {number} - id of tab, where bumper should be loaded
     * @param bumperInterval {number} - interval between bumps in milliseconds
     */
    constructor(initialTime, refreshTime, duration, tabId, bumperInterval) {
        super(initialTime, refreshTime, duration);

        this._bumpInterval = bumperInterval || 0;
        this._tabId = tabId;
        super.addActionHandler(function() {
            let id = tabId;
            chrome.tabs.sendMessage(id,
                {cmd: 'bump', targetURL: null, bumperInterval: bumperInterval},
                function(response) {
                    console.log(response);
            });
        });
    }

    /**
     *
     * @returns {number} tab id, on which bumper is working
     */
    get tabId() {
        return this._tabId;
    }

    start() {
        super.start();
    }

    stop() {
        super.stop();
    }
}

export default Bumper;


//module.exports = Bumper;