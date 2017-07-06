/**
 * Created by Середа on 17.03.2017.
 */
import Refresher from "./Entities/refresher";
import Bumper from "./Entities/bumper";
import cycleMap from './cycleMap';
import CycleBuilder from './Entities/cycleBuilder';


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.cmd == 'getPopupData') {
        console.log("get popup data request");
        console.dir(request);
        //sendResponse("If you see this, i'm fucked!");
        console.log('Tab id' + request.tabId);
        console.dir(cycleMap.get(request.tabId));
        if (!cycleMap.get(request.tabId)) {
            syncStorage.getPopupData().then(popupData => {
                syncStorage.sendPopupData(request.tabId, popupData);
            });
        }
        else {
            let cycle = cycleMap.get(request.tabId);
            for (let part of cycle.getParts()) {
                if (part instanceof Refresher) {
                    let popupData = {
                        'initialTime': part.initialTime.getHours()* 3600000 +
                            part.initialTime.getMinutes() * 60000 + part.initialTime.getSeconds() * 1000,
                        'refreshTime': part.refreshTime,
                        'targetURL': part.targetURL,
                        'state': part.state,
                        'nextActionTime': part.timeToNextAction
                    };

                    console.log("Send popup data from existing refresher");
                    console.dir(popupData);
                    syncStorage.sendPopupData(request.tabId, popupData);
                }
            }
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
   if (request.cmd == 'setPopupData') {
       if (request.tabId == null) {
           syncStorage.setPopupData(request.data);
           response("Popup data set successfully");
       }
       response("Popup data set failed");
   }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
    if (request.cmd == 'start') {
        let popupInfo = request.data;
        let tabId = request.tabId;
        let settings = syncStorage.getSettingsData();

        console.dir(request);

        settings.then((prefs) => {
           let builder = new CycleBuilder();
           // get delays from settings and shift the initial time, using them
           let refInitialTime = shiftDate(popupInfo.initialTime, prefs.refresher.refresherDelay);
           let bumpInitialTime = shiftDate(popupInfo.initialTime, prefs.bumper.bumperDelay);
           let bumperInterval = prefs.bumper.bumperInterval ? 10000 : 0;

           try{
               builder.setRefresher(refInitialTime, popupInfo.refreshTime, prefs.refresher.duration,
                   request.tabId, popupInfo.targetURL);
               builder.setBumper(bumpInitialTime, popupInfo.refreshTime, prefs.refresher.duration,
                   request.tabId, bumperInterval);
           }
           catch (e) {
               console.log("Can't create refresher, en error occupied");
               response("Cycle start failed");
               return;
           }

           let cycle = builder.getCycle();
           console.log("New cycle");
           console.dir(cycle);
           cycleMap.add(cycle, request.tabId);
        });
        response("Cycle started successfuly!");
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
   if (request.cmd == 'startWithDefault') {
       console.log('Recieved start with default message from tab' + sender.tab.id);
       console.log("Cycler object for this window!");
       console.dir(cycleMap.get(sender.tab.id));

       if (cycleMap.get(sender.tab.id)){
           console.log('Cycle object already exist');
           return;
       }

       syncStorage.getData().then((data) => {
           if (!data.settingsData.general.autoload){
               console.log("Start with default is not enabled!");
               return data;
           }


           let state = false;
           for (let pageURL of data.settingsData.general.autoloadPages) {
               let pagePattern = new RegExp(pageURL);
               if (pageURL != ''
                   && pageURL != " "
                   && request.href.search(pagePattern) >= 0) {
                   state = true;
                   break;
               }
           }

           if (!state) {
               console.log("The page is not match the settings pages patterns");
               return data;
           }

           console.dir(data);

           let popupInfo = data.popupData;
           let prefs = data.settingsData;

           let refInitialTime = shiftDate(popupInfo.initialTime, prefs.refresher.refresherDelay);
           let bumpInitialTime = shiftDate(popupInfo.initialTime, prefs.bumper.bumperDelay);
           let bumperInterval = prefs.bumper.bumperInterval ? 10000 : 0;
           let builder = new CycleBuilder();

           try{
               builder.setRefresher(refInitialTime, popupInfo.refreshTime, prefs.refresher.duration,
                   sender.tab.id, popupInfo.targetURL);
               builder.setBumper(bumpInitialTime, popupInfo.refreshTime, prefs.refresher.duration,
                   sender.tab.id, bumperInterval);
           }
           catch (e) {
               console.log("Can't create refresher, en error occupied:" + e.message);
               response("Cycle start failed");
               return;
           }

           let cycle = builder.getCycle();
           console.log("New cycle");
           console.dir(cycle);
           cycleMap.add(cycle, sender.tab.id);

           response("Cycle started successfully!");
           return data;
       });
   }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
   if (request.cmd == 'stop') {
       let tabId = request.tabId;

       cycleMap.remove(tabId);
       response("App stopped successfuly!");
   }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
    if (request.cmd == 'setSettingsData') {
        if (request.tabId == null) {
            syncStorage.setSettingsData(request.data);
            response("Settings data set successfully");
        }
        response("Settings data set failed");
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, response) {
    if (request.cmd == 'getSettingsData') {
        if (request.tabId == null) {
            syncStorage.getSettingsData().then((settingsData) => {
                console.log("Send settings data");
                console.dir(settingsData);
                syncStorage.sendSettingsData(settingsData);
            });
        }
    }
});

let timeModule = (function() {
    return {

    };
});

/**
 * Form up date, base on amount of milliseconds since 00:00
 *
 * @param {number} milliseconds - amount of milliseconds from the start of current day
 * @return {date}
 */
function formUpDate(milliseconds) {
    if (typeof milliseconds != 'number')
        throw new Error("Incompatible argument type, expect number.");

    let date = new Date();
    let hours = Math.floor(milliseconds / 3600000);
    milliseconds -= hours * 3600000;
    let minutes = Math.floor(milliseconds / 60000);
    milliseconds -= minutes * 60000;
    let seconds = Math.floor(milliseconds / 1000);
    milliseconds -= seconds * 1000;
    //console.log(`${hours}:${minutes}:${seconds}`);
    date.setHours(hours, minutes, seconds, milliseconds);

    return date;
}

/**
 * Shift date to back in time
 *
 * @param {number} date
 * @param {number} shift
 * @return {date} shifted date
 */
function shiftDate(date, shift) {
    let initDate = formUpDate(date);
    let shiftDate = formUpDate(shift);

    console.log("Date was:" + initDate.toString());
    console.log("Shift: " + shiftDate.toString());

    initDate.setHours(initDate.getHours() - shiftDate.getHours(),
        initDate.getMinutes() - shiftDate.getMinutes(),
        initDate.getSeconds() - shiftDate.getSeconds());

    console.log("Date became: "+ initDate.toString());
    return initDate;
}


let syncStorage = (function() {
    /**
     *
     * @param {object} data - data to be stored
     */
    function storeUserPrefs(data) {
        let key = "data";

        // free previous extension data for current user
        chrome.storage.sync.clear();
        // set new extension's data for current user
        chrome.storage.sync.set({"key": data}, function() {
            console.log('Data added successfuly to sync storage');
            console.dir(data);
        });
    }

    /**
     *
     * @returns {Promise} promise with data from storage
     */
    function getUserPrefs() {
        return new Promise(function(resolve, rejected) {
            chrome.storage.sync.get("key", function(data) {
                console.log("Data resieved from sync storage");
                console.dir(data.key);
                resolve(data.key);
            });
        });
    }

    return {
        getSettingsData: function() {
            return getUserPrefs().then((data) => {
               return data.settingsData;
            });
        },

        getPopupData: function() {
            return getUserPrefs().then((data) => {
                console.log("Popup data");
                console.dir(data);
               return data.popupData;
            });
        },

        getData: function() {
            return getUserPrefs();
        },

        setPopupData: function(popupData) {
            getUserPrefs().then((data) => {
                data.popupData = popupData;

                storeUserPrefs(data);
            });
        },

        setSettingsData: function(settingsData) {
            getUserPrefs().then((data) => {
                data.settingsData = settingsData;

                storeUserPrefs(data);
            });
        },

        setData: function(data) {
            storeUserPrefs(data);
        },

        /**
         * Send message to the tabId extension
         * with popupData
         * @param {number} tabId
         * @param {Object} popupData
         */
        sendPopupData: function (tabId, popupData) {
            chrome.runtime.sendMessage({
                'message': 'popupData',
                'popupData': popupData,
                'tabId': tabId
            }, function (response) {
                console.log(response);
            });
        },

        /**
         * Send message to the extension's settings page
         * with settings Data
         * @param {Object} settingData
         */
        sendSettingsData: function (settingData) {
            chrome.runtime.sendMessage({
                'message': 'settingsData',
                'settingsData': settingData
            }, function (response) {
                console.log(response);
            });
        }
    };
}());

syncStorage.getData().then(data => {
    if (!data) {
        // fill extenstion data with default one
        syncStorage.setData({
            popupData: {
                initialTime: 61200 * 1000,
                refreshTime: 1050 * 1000,
                targetURL: 'https://csgolounge.com/mytrades'
            },
            settingsData: {
                general: {
                    autoload: true,
                    autoloadPages: []
                },
                refresher: {
                    refresherDelay: 0,
                    duration: 259200 * 1000
                },
                bumper: {
                    bumperInterval: true,
                    bumperDelay: 0
                }
            }
        });
    }
});