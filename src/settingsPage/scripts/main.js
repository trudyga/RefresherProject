/**
 * Created by Середа on 18.03.2017.
 */
import * as $ from 'jquery';
import './navTabsVertical';
import '../styles/style.css';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

$('document').ready(function () {
    messageModule.getSettingsData();

   $("#saveButton").click(() => {

       executionModule.save();

       $("#savedMessage").show().animate(
           {
               opacity: 100
           }, 2000, function() {
               $("#savedMessage").animate(
                   {
                       opacity: 0
                   }, 3000, function () {
                       $("#savedMessage").hide();
                   }
               );
           }
       );
   });

   $("#cancelButton").click(() => {executionModule.close();});

   chrome.runtime.onMessage.addListener(function(request, sender, response) {
       if (request.message == 'settingsData') {
            executionModule.initComponents(request.settingsData);
       }
   });

});

let timeModule = (function() {
    /**
     *
     * @param element
     * @returns {number}
     */
    function getTime(element) {
        let hours = $(element).find("input.hours").val();
        let minutes = $(element).find("input.minutes").val();
        let seconds = $(element).find("input.seconds").val();

        return timeToMilliseconds(+hours, +minutes, +seconds);
    }

    /**
     *
     * @param {string} hours
     * @param {string} minutes
     * @param {string} seconds
     * @return {number}
     */
    function timeToMilliseconds(hours, minutes, seconds) {
        return (seconds + minutes * 60 + hours * 3600) * 1000;
    }

    /**
     *
     * @param {Object} element - div element
     * @param {number} time - time in milliseconds
     */
    function setTime(element, time) {
        let date = new Date(time);

        $(element).find("input.hours").val(date.getUTCHours());
        $(element).find("input.minutes").val(date.getUTCMinutes());
        $(element).find("input.seconds").val(date.getUTCSeconds());
    }

    return {

        /**
         * Fill the fields in refresh delay time section
         * @param {number} time - time in ms
         */
        setRefresherDelay: function (time) {
            let refresherPropDiv = $("#refresherProp");

            setTime(refresherPropDiv, time);
        },

        /**
         * Fill the fields in bumper delay time section
         * @param {number} time - time in ms
         */
        setBumperDelay: function (time) {
            let bumperPropDiv = $("#bumperProp");

            setTime(bumperPropDiv, time);
        },

        /**
         * Get time in ms from refresh delay time section
         * @return {number} - time in ms
         */
        getRefresherDelay: function() {
            let refresherPropDiv = $("#refresherProp");

            return getTime(refresherPropDiv);
        },

        /**
         * Get time in ms from bumper delay time section
         * @return {number} - time in ms
         */
        getBumperDelay: function() {
            let bumperPropDiv = $("#bumperProp");

            return getTime(bumperPropDiv);
        }
    };
}());

let generalPropModule = (function() {

    return {

        /**
         * get autoloads checkbox current state
         * @returns {*|jQuery}
         */
        getAutoload: function() {
            return $("#autoload").prop("checked");
        },

        /**
         * set autoloads checkbox current state
         * @param {boolean} value - value for autoload
         */
        setAutoload: function(value) {
            if(typeof value !== 'boolean')
                throw new Error("Incompatible param type, use boolean instead");

            $("#autoload").prop("checked", value);
        },

        /**
         * Returns array of urls formed from string, than user specifies
         * @returns {Array} {returns an array of
         */
        getURLList: function() {
            let urlString = $("#urlList").val();
            if (urlString === '')
                return [];
            // split it into parts
            let urls = urlString.replace(/ /g, "").split(/,/);
            console.dir(urls);
            return urls;
        },

        /**
         * Set fields with string represenstation of url from array
         * @param {Array} urls
         */
        setURLList: function(urls) {
            if (!(urls instanceof Array)) {
                throw new Error("Incompatible argument type, expect array");
            }

            let urlsString = '';
            for (let url of urls) {
                urlsString += url.toString() + ",";
            }

            urlsString = urlsString.replace(/,+$/ig, '');

            $("#urlList").val(urlsString);
        }
    };
}());

let bumperModule = (function() {
   return {

       /**
        * Get bumper interval checkbox current state
        * @returns {*|jQuery}
        */
       getBumperInterval: function() {
           return $("#bumperInterval").prop("checked");
       },
       /**
        * Set bumper interval checkbox current state
        * @param {boolean} value - state value
        */
       setBumperInterval: function (value) {
           $("#bumperInterval").prop("checked", value);
       }
   };
}());

let executionModule = (function () {

    return {
        /**
         * Closes the window
         */
        close: function () {
            window.top.close();
        },

        /**
         * Holds logic, which send save data to background page
         */
        save: function() {
            //send save message
            let data = {
                general: {
                    autoload: generalPropModule.getAutoload(),
                    autoloadPages: generalPropModule.getURLList()
                },
                refresher: {
                    refresherDelay: timeModule.getRefresherDelay(),
                    duration: 3600* 72 * 1000
                },
                bumper: {
                    bumperDelay: timeModule.getBumperDelay(),
                    bumperInterval: bumperModule.getBumperInterval()
                }
            };
            messageModule.setSettingsData(data);
        },

        /**
         * Initializes program components
         * @param data
         */
        initComponents: function(data) {
            // get synchronized data
            // and init fileds with this data
            timeModule.setRefresherDelay(data.refresher.refresherDelay);
            timeModule.setBumperDelay(data.bumper.bumperDelay);
            generalPropModule.setAutoload(data.general.autoload);
            generalPropModule.setURLList(data.general.autoloadPages);
            bumperModule.setBumperInterval(data.bumper.bumperInterval)
        }
    };
}());

let messageModule = (function() {

    return {
        /**
         * Returns settings page data
         * @returns {Promise} - promise with resolve value represents settings page data
         */
        getSettingsData: function() {
            return new Promise(function(resolve, rejected) {
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    chrome.runtime.sendMessage({
                        'cmd': 'getSettingsData',
                        'tabId': null,
                    }, function(response) {
                        resolve(response);
                    });
                });
            });
        },

        /**
         * Send settings data along with setSettingData command
         * to background page and sync them with current profile
         *
         * @param{object} data - Settings data in format:
         * general: {autoload: boolean},
         * refresher: {refresherDelay: number, duration: number},
         * bumper: {bumperDelay: number{
         */
        setSettingsData: function(data) {
            let promise = new Promise(function(resolve, reject) {
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                      chrome.runtime.sendMessage({
                        'cmd': 'setSettingsData',
                        'tabId': null,
                        'data': data
                    }, function(response) {
                        console.log(response);
                    });
                });
            }).catch((error) => {
                console.log('En error occupied when sending settings data\n' + error.message);
            });
        }
    };
}());