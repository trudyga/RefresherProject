/**
 * Created by Середа on 13.03.2017.
 */

class Sheduler {
    /**
     * Creates sheduler instance
     * @param initialTime {Date} initial time for shedule
     * @param refreshTime {Number} time for refresh in ms
     * @param duration {Number} shedule duration in ms
     */
    constructor(initialTime, refreshTime, duration) {
        if (!(initialTime instanceof Date) ||
        typeof refreshTime != 'number' ||
        typeof duration != 'number')
            throw new Error("Incompatible argument types");

        if ( refreshTime < 0 || duration < 0)
            throw new Error("Incompatible argument values");

        this._initT = initialTime;
        this._refT = refreshTime;
        this._duration = duration;
        this._timeList = [];
        this._timerId = 0;
        this._state = false;

        this._initTimeList();

        for(let key in eventMixin) {
            Sheduler.prototype[key] = eventMixin[key];
        }


    }

    get initialTime() {
        return this._initT;
    }

    get refreshTime() {
        return this._refT;
    }

    get duration() {
        return this._duration;
    }

    get timeList() {
        return this._timeList;
    }

    get state() {
        return this._state;
    }

    /**
     *
     * @returns {number} time to next action in milliseconds
     */
    get timeToNextAction() {
       let curTime = new Date();

       if (curTime < this.initialTime){
           return this.initialTime - curTime;
       }
       else if (curTime.valueOf() >
           this.initialTime.valueOf() + this.duration){
           return 0;
       }
       else {
           for (let i = 0; i < this.timeList.length; i++) {
                if (curTime < this.timeList[i]){
                    return this.timeList[i] - curTime;
                }
           }
       }
    }

    /**
     * Add copy of time record to the end of time list
     * @param time {Number} time to add
     */
    addTimeRecord(time) {
        this._timeList.push(new Date(time));
    }

    /**
     * Add action handler to execute every time when time comes
     * @param handler {function} action to execute when time is come
     */
    addActionHandler(handler) {
        if (typeof handler != 'function') {
            throw new Error("Incompatible argument types");
        }

        this.on("onAction", handler);
        return true;
    }

    /**
     * Make sheduler to begin execution
     * and changes current state to true;
     */
    start() {
        if (this.timeToNextAction == 0)
            stop();
        this._state = true;

        //problem in test with this.timeToNextAction
        //something wrong with sinon.useFakeTimers();
        this._timerId = setTimeout(() => {
            this.trigger("onAction");
            this.start();
        }, this.timeToNextAction);
    }

    /**
     * Make sheduler to stop invoking action handlers
     * and change current state to false;
     */
    stop() {
        clearTimeout(this._timerId);
        this._state = false;
    }

    /**
     * Initialises time list
     * @private
     */
    _initTimeList() {
        let timeShift = this.refreshTime;
        let initDate = new Date(this.initialTime.valueOf());
        let endDate = new Date(initDate.valueOf() + this.duration);

        while (initDate <= endDate) {
            this.addTimeRecord(initDate.valueOf());
            initDate.setMilliseconds(initDate.getMilliseconds() + timeShift);
            if (timeShift < 1) {
                return;
            }
        }
    }

}

// pub/sub mixing
let eventMixin = {

    /**
     * Подписка на событие
     * Использование:
     *  menu.on('select', function(item) { ... }
     */
    on: function(eventName, handler) {
        if (!this._eventHandlers) this._eventHandlers = {};
        if (!this._eventHandlers[eventName]) {
            this._eventHandlers[eventName] = [];
        }
        this._eventHandlers[eventName].push(handler);
    },

    /**
     * Прекращение подписки
     *  menu.off('select',  handler)
     */
    off: function(eventName, handler) {
        var handlers = this._eventHandlers && this._eventHandlers[eventName];
        if (!handlers) return;
        for(var i=0; i<handlers.length; i++) {
            if (handlers[i] == handler) {
                handlers.splice(i--, 1);
            }
        }
    },

    /**
     * Генерация события с передачей данных
     *  this.trigger('select', item);
     */
    trigger: function(eventName /*, ... */) {

        if (!this._eventHandlers || !this._eventHandlers[eventName]) {
            return; // обработчиков для события нет
        }

        // вызвать обработчики
        var handlers = this._eventHandlers[eventName];
        for (var i = 0; i < handlers.length; i++) {
            handlers[i].apply(this, [].slice.call(arguments, 1));
        }

    }
};

//module.exports = Sheduler;
export default Sheduler;