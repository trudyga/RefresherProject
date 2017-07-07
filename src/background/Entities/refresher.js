//let Sheduler = require('core/sheduler.js');
import Sheduler from './core/sheduler';
import browser from 'extension-api-compilation';

class Refresher extends Sheduler{

    /**
     *
     * @param initialTime {date} - start time
     * @param refreshTime {number} - refresh time in milliseconds
     * @param duration {number} - duration in milliseconds
     * @param tabId {number} - tab id where refresher is working
     * @param targetURL {string} - page url to be reloaded
     */
    constructor(initialTime, refreshTime, duration, tabId, targetURL) {
        super(initialTime, refreshTime, duration);

        this._tabId = tabId;
        this._targetURL = targetURL;
        super.addActionHandler(function() {
            let id, url;
            id = tabId;
            url = targetURL;

            let secondaryTimesList = [];
            for (let i = 4; i <= 60; i += 5) {
                secondaryTimesList.push(i);
            }
            // check current time
            let curTime = new Date();
            console.log(`tabId${tabId}`);
            // choose between two types of refresh message
            for (let min of secondaryTimesList) {
                if (min == curTime.getMinutes()) {
                    console.log("Send change tab message 4 9 14 19");
                    browser.tabs.update(id, url);
                    return;
                }
            }

            browser.tabs.executeScript(id, "location.reload();");
        });
    }

    get tabId() {
        return this._tabId;
    }

    get targetURL() {
        return this._targetURL;
    }

    start() {
        super.start();
    }

    stop() {
        super.stop();
    }
}
export default Refresher;

//module.exports = Refresher;