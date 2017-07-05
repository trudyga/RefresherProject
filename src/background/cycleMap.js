//let Cycle = require('./entities/cycle.js');


let cycleMap = (function () {
    let data = new Map();

    return {
        /**
         *  Creates pair cycle-tabId in map if not exist
         *  otherwise rewrite existing one
         * @param {Object} cycle, add cycle to list if not exist
         * @param {Number} tabId, tabId which hold cycle
         */
        add: function(cycle, tabId) {
            // check if we have Cycle instance
            if (!(cycle instanceof Cycle))
                throw new Error("Incompatible type exception");
            if (typeof tabId !== 'number')
                throw new Error("Incompatible type exception");

            if (data.has(tabId)) {
                // rewrite
                let cycle = data.get(tabId);
                cycle.stop();
                data.delete(tabId);

                data.set(tabId, cycle);
            }
            else {
                data.set(tabId, cycle);
            }
            cycle.start();
            return true;
        },

        /**
         *
         * @param {number} tabId - tabId where we need to delete cycle;
         * @returns {boolean} remove operation result
         */
        remove: function (tabId) {
            if (typeof tabId !== 'number')
                throw new Error("Incompatible type exception");

            if (!data.get(tabId))
                return false;

            let cycle = data.get(tabId);
            cycle.stop();
            return data.delete(tabId);
        },

        /**
         *
         * @param {number} tabId
         * @returns {Cycle} Cycle object for tab with tabId
         */
        get: function (tabId) {
            if (typeof tabId !== 'number')
                throw new Error("Incompatible type exception");

            return data.get(tabId);
        }
    };
})();

//export default cycleMap;