import Sheduler from './core/sheduler';

class Cycle{
    constructor() {
        this._parts = [];
    }

    /**
     *
     * @param {Object} part - instance of Sheduler
     * every part must have method start
     *
     */
    addPart(part) {
        if (part instanceof Sheduler)
            this._parts.push(part);
        else if (part.start && part.stop) {
            this._parts.push(part);
        }
        else{
            throw new Error('Incompatible argument type. It must be object with start/stop methods.');
        }
    }

    getParts() {
        return this._parts;
    }


    /**
     * Call start method on every part of cycle
     */
    start() {
        console.log("Parts");
        for (let part of this._parts) {
            console.dir(part);
            part.start();
        }
    }

    /**
     * Call stop method on every part of cycle
     */
    stop() {
        for (let part of this._parts) {
            part.stop();
        }
    }
}

export default Cycle;