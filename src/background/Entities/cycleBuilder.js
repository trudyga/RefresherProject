/**
 * Created by Середа on 17.03.2017.
 */
//let Refresher = require('./refresher.js');
//let Bumper = require('./bumper.js');
//let Cycle = require('./cycle.js');
import Refresher from './refresher';
import Bumper from './bumper';
import Cycle from './cycle';


class CycleBuilder{
    constructor() {
        this._cycle = new Cycle();
    }

    /**
     * Instantiate and add to cycle a part that is used to
     * bump trade offers in csgolounge.com
     *
     * @param {date} initalTime - initial time
     * @param {number} refreshTime - refresh time in ms
     * @param {number} duration - time of working in ms
     * @param {number} tabId - number of tab
     * @param {number} bumperInterval - interval between bumps in seconds
     */
    setBumper(initalTime, refreshTime, duration, tabId, bumperInterval) {
        let bumper = new Bumper(initalTime, refreshTime, duration, tabId, bumperInterval);
        this._cycle.addPart(bumper);
    }

    /**
     * Instantiate and add to cy le a part that is used to
     * refresh the current page and sometimes change location(URL)
     * of the page
     *
     * @param {date} initialTime - initial time
     * @param {number} refreshTime - refresh time in ms
     * @param {number} duration - time of working in ms
     * @param {number} tabId - tab id
     * @param {string} targetURL - url to move to
     */
    setRefresher(initialTime, refreshTime, duration, tabId, targetURL) {
        let refresher = new Refresher(initialTime, refreshTime, duration,
            tabId, targetURL);
        this._cycle.addPart(refresher);
    }

    /**
     * Returns the created instance of cycle object
     *
     * @returns {Cycle} cycle object
     */
    getCycle() {
        return this._cycle;
    }
}

export default CycleBuilder;