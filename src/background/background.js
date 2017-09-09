/**
 * Created by Середа on 17.03.2017.
 */
import browser from 'extension-api-compilation';

if (chrome)
    var alarms = chrome.alarms;


browser.runtime.addListener(function (request, sender, sendResponse) {
   if (request.cmd === 'getPopupData') {
       alarms.get('refresher#'+request.tabId, alarm => {
           if (!alarm)
               syncStorage.getPopupData().then(popupData => {
                   syncStorage.sendPopupData(request.tabId, popupData);
               });
           else {
               syncStorage.getPopupData().then(popupData => {
                   popupData.nextActionTime = alarm.scheduledTime;
                   popupData.state = true;
                   syncStorage.sendPopupData(request.tabId, popupData);
               });
           }
       });
   }
});

browser.runtime.addListener(function (request, sender, response) {
   if (request.cmd == 'setPopupData') {
       if (request.tabId == null) {
           syncStorage.setPopupData(request.data);
           response("Popup data set successfully");
           console.dir(request.data);
       }
       response("Popup data set failed");
   }
});

browser.runtime.addListener(function (request, sender, response) {
    if (request.cmd === 'start') {
        let popupInfo = request.data;
        let tabId = request.tabId;
        let settings = syncStorage.getSettingsData();

        console.dir(request);

        settings.then((prefs) => {
            let refresher = {
                name: "refresher",
                initialTime: shiftDate(popupInfo.initialTime, prefs.refresher.refresherDelay), // as Date
                interval: popupInfo.refreshTime, // in ms
                duration: prefs.refresher.duration, // as Date
                tabId: request.tabId, // as number
                targetURL: popupInfo.targetURL // as string
            };

            let bumper = {
                name: "bumper",
                initialTime: shiftDate(popupInfo.initialTime, prefs.bumper.bumperDelay),
                interval: popupInfo.refreshTime,
                duration: prefs.refresher.duration,
                tabId: request.tabId,
                bumpInterval: prefs.bumper.bumperInterval ? 10000 : 0
            };

            shiftTime(refresher.initialTime, refresher.interval);
            shiftTime(bumper.initialTime, bumper.interval);

            alarms.create(refresher.name+"#"+refresher.tabId, {
                when: +refresher.initialTime,
                periodInMinutes: refresher.interval / 60000
            });

            alarms.get(refresher.name + '#' + refresher.tabId, alarm => {
                console.dir(alarm);
            });

            alarms.create(bumper.name+"#" + bumper.tabId, {
                when: +bumper.initialTime,
                periodInMinutes: refresher.interval / 60000
            });

            // subscribe
            alarms.onAlarm.addListener(alarm => {
                if (alarm.name === refresher.name + "#" + refresher.tabId)
                    browser.tabs.executeScript(refresher.tabId, "location.reload();");
                if (alarm.name === bumper.name + "#" + bumper.tabId)
                    browser.tabs.sendMessage(bumper.tabId, {
                        cmd: 'bump',
                        targetURL: null,
                        bumperInterval: bumper.bumpInterval
                    }).then(res => console.log(res));
            });

            console.log(`Created refresher#{refresher.tabId} && bumper#{bumper.tabId}`);
        });
    }

});

function shiftTime(initialTime, interval) {
    while (+initialTime < Date.now()) {
        initialTime.setMilliseconds(initialTime.getMilliseconds() + interval);
    }
    return initialTime;
}

browser.runtime.addListener(function (request, sender, response) {
    if (request.cmd === 'startWithDefault') {
        console.log("Start with default message");
        let refresherName = `refresher#${sender.tab.id}`;
        let bumperName = `refresher#${sender.tab.id}`;

        let refresherPromise = new Promise((resolve, reject) => {
            alarms.get(refresherName, (alarm) => {
               resolve(alarm);
            });
        }).then(alarm => {
            console.dir(alarm);
            if (alarm)
                return false;

            return syncStorage.getData().then((data) => {
                if (!data.settingsData.general.autoload){
                    console.log("Start with default is not enabled!");
                    return data;
                }

                // check if page match the pattern, specified in the settings
                let match = false;
                for (let pageURL of data.settingsData.general.autoloadPages) {
                    let pagePattern = new RegExp(pageURL);
                    if (pageURL !== ''
                        && pageURL !== " "
                        && request.href.search(pagePattern) >= 0) {
                        match = true;
                        break;
                    }
                }

                if (!match)
                    return false;

                let popupInfo = data.popupData;
                let prefs = data.settingsData;

                let refresher = {
                    name: "refresher",
                    initialTime: shiftDate(popupInfo.initialTime, prefs.refresher.refresherDelay), // as Date
                    interval: popupInfo.refreshTime, // in ms
                    duration: prefs.refresher.duration, // as Date
                    tabId: sender.tab.id, // as number
                    targetURL: popupInfo.targetURL // as string
                };

                let bumper = {
                    name: "bumper",
                    initialTime: shiftDate(popupInfo.initialTime, prefs.bumper.bumperDelay),
                    interval: popupInfo.refreshTime,
                    duration: prefs.refresher.duration,
                    tabId: sender.tab.id,
                    bumpInterval: prefs.bumper.bumperInterval ? 10000 : 0
                };

                shiftTime(refresher.initialTime, refresher.interval);
                shiftTime(bumper.initialTime, bumper.interval);

                alarms.create(refresher.name+"#"+refresher.tabId, {
                    when: +refresher.initialTime,
                    periodInMinutes: refresher.interval / 60000
                });

                alarms.get(refresher.name + '#' + refresher.tabId, alarm => {
                    console.dir(alarm);
                });

                alarms.create(bumper.name+"#" + bumper.tabId, {
                    when: +bumper.initialTime,
                    periodInMinutes: refresher.interval / 60000
                });

                // subscribe
                alarms.onAlarm.addListener(alarm => {
                    if (alarm.name === refresher.name + "#" + refresher.tabId)
                        browser.tabs.executeScript(refresher.tabId, "location.reload();");
                    if (alarm.name === bumper.name + "#" + bumper.tabId)
                        browser.tabs.sendMessage(bumper.tabId, {
                            cmd: 'bump',
                            targetURL: null,
                            bumperInterval: bumper.bumpInterval
                        }).then(res => console.log(res));
                });

                return true;
            });
        });
    }
});

browser.runtime.addListener(function (request, sender, response) {
    if (request.cmd === 'stop') {
        let refId = 'refresher#'+request.tabId;
        let bumpId = 'bumper#'+request.tabId;
        alarms.clear(refId, wasCleared => console.log(refId + " cleared: " + wasCleared));
        alarms.clear(bumpId, wasCleared => console.log(bumpId + " cleared: " + wasCleared));
    }
});


browser.runtime.addListener(function (request, sender, response) {
    if (request.cmd == 'setSettingsData') {
        if (request.tabId == null) {
            syncStorage.setSettingsData(request.data);
            response("Settings data set successfully");
        }
        response("Settings data set failed");
    }
});

browser.runtime.addListener(function (request, sender, response) {
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

/**
 * Form up date, base on amount of milliseconds since 00:00
 *
 * @param {number} milliseconds - amount of milliseconds from the start of current day
 * @return {date}
 */
function formUpDate(milliseconds) {
    if (typeof milliseconds !== 'number')
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
        //browser.syncStorage.clear();
        // set new extension's data for current user
        browser.syncStorage.set({"key": data}).then((response) => {
          console.log('Data added successfuly to sync storage');
          console.dir(data);
        }).catch(e => console.error(e));
    }

    /**
     *
     * @returns {Promise} promise with data from storage
     */
    function getUserPrefs() {
        return new Promise(function(resolve, rejected) {
            browser.syncStorage.get().then(data => {
              console.log("Data resieved from sync storage");
              console.dir(data.key);
              resolve(data.key);
            });
        }).catch(e => console.error(e));
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
            }).catch(e => console.error(e));
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
            browser.runtime.sendMessage({
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
            browser.runtime.sendMessage({
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