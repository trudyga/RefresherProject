import * as $ from 'jquery';
import browser from 'extension-api-compilation';
import '../styles/style.css';
import '../images/gear.svg';
import '../images/sync.svg';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';

$('document').ready(function() {
  executionModule.initComponents();

  $('#syncButton').click(function() {
    let popupData = {
      initialTime: timeModule.getInitialTime(),
      refreshTime: timeModule.getRefreshTime(),
      targetURL: targetURLModule.getTargetURL()
    };
    executionModule.sync(popupData);
  });

  $('#startButton').click(function () {
    executionModule.start();
  });

  $('#stopButton').click(function() {
    executionModule.stop();
  });

  browser.runtime.addListener(function (request, sender, response) {
    if (request.message === 'popupData'){
      console.log("Request popupData recieved-!");
      console.dir(request);

      timeModule.setInitialTime(request.popupData.initialTime);
      timeModule.setRefreshTime(request.popupData.refreshTime);
      targetURLModule.setTargetURL(request.popupData.targetURL);

      if (request.popupData.state && request.popupData.nextActionTime) {
        executionModule.setWorkingStatus(request.popupData.state, request.popupData.nextActionTime);
      }
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
     * Fill the fields in initial time section
     * @param {number} time - time in ms
     */
    setInitialTime: function (time) {
      let initialTimeDiv = $("#initialTime");

      setTime(initialTimeDiv, time);
    },

    /**
     * Fill the fields in refresh time section
     * @param {number} time - time in ms
     */
    setRefreshTime: function (time) {
      let refreshTimeDiv = $("#refreshTime");

      setTime(refreshTimeDiv, time);
    },

    /**
     * Get time in ms from initial time section
     * @return {number} - time in ms
     */
    getInitialTime: function() {
      let initialTimeDiv = $("#initialTime");

      return getTime(initialTimeDiv);
    },

    /**
     * Get time in ms from refresh time section
     * @return {number} - time in ms
     */
    getRefreshTime: function() {
      let refreshTimeDiv = $("#refreshTime");

      return getTime(refreshTimeDiv);
    }
  };
}());

let targetURLModule = (function() {

  return {
    /**
     * returns the url from targetURL field
     * @returns {*|jQuery}
     */
    getTargetURL: function() {
      return $("#targetURL").val();
    },

    /**
     * Fill the targetURL field with url value
     * @param {string} url - url to set up
     */
    setTargetURL: function(url) {
      if (typeof url != 'string')
        throw new Error("Incompatible argument type, string expected");

      $("#targetURL").val(url);
    }
  };
}());

let nextReloadTimeModule = (function() {
  let timerId = 0;

  return {
    /**
     *
     * @param {number} reloadTime - time in ms
     */
    displayTime: function(reloadTime) {
      let time = new Date(reloadTime);
      let hours = time.getUTCHours() < 10 ?
        "0" + time.getUTCHours() : time.getUTCHours();
      let minutes = time.getUTCMinutes() < 10 ?
        "0" + time.getUTCMinutes() : time.getUTCMinutes();
      let seconds = time.getUTCSeconds() < 10 ?
        "0" + time.getUTCSeconds() : time.getUTCSeconds();

      $("#nextReloadTime span.hours").text(hours);
      $("#nextReloadTime span.minutes").text(minutes);
      $("#nextReloadTime span.seconds").text(seconds);
    },

    /**
     * Animate displaying time by
     * reloadTime var every second
     * @param {number} reloadTime - time in ms
     */
    animateDisplaying: function(reloadTime) {
      timerId = setInterval(() => {
        if (reloadTime <= 0) {
          nextReloadTimeModule.stopAnimation();
        }
        this.displayTime(reloadTime);
        reloadTime = reloadTime - 1000;
      }, 1000);
    },

    /**
     * Stop animation if present
     */
    stopAnimation: function() {
      clearInterval(timerId);
      $("#nextReloadTime span.hours").text("");
      $("#nextReloadTime span.minutes").text("");
      $("#nextReloadTime span.seconds").text("");
    }
  }
}());

let executionModule = (function () {

  return {
    setWorkingStatus(isWorking, reloadTime) {
      if (isWorking) {
        console.log("Working status set");
        $("#startButton").hide();
        $("#stopButton").show();
        $("#nextReloadTime").css("color", "#cc3333");
        nextReloadTimeModule.animateDisplaying(reloadTime);
      }
      else{
        console.log("Stop status set");
        $("#startButton").show();
        $("#stopButton").hide();
        $("#nextReloadTime").css("color", "inherit");
        nextReloadTimeModule.stopAnimation();
      }
    },

    /**
     * Create and start correspondent cycle data
     */
    start: function() {
      messageModule.sendStartMessage();
      this.initComponents();
    },

    /**
     * Stop correspondent cycle data
     */
    stop: function() {
      messageModule.sendStopMessage();
      this.initComponents();
    },

    /**
     * Send sync message to background
     * @param {object} data with
     * initialTime,
     * refreshTime,
     * targetURL
     */
    sync: function (data) {
      messageModule.sendPopupData(data);
    },

    /**
     * Get info from server and fill correspondent fields
     */
    initComponents: function() {
      messageModule.getPopupData();
    }
  };
}());

let messageModule = (function () {

  return {
    /**
     * Recieve synchronized data
     * change it
     * and send start message with current tab Id
     */
    sendStartMessage: function() {
      let popupData =  {
        initialTime: timeModule.getInitialTime(),
        refreshTime: timeModule.getRefreshTime(),
        targetURL: targetURLModule.getTargetURL()
      };
      browser.tabs.getActive().then(tabs => {
        let tabId = tabs[0].id;

        browser.runtime.sendMessage({
          'cmd': 'start',
          'tabId': tabId,
          'data': popupData
        });
      });

      setTimeout(() => {
        location.reload();
      }, 500);
    },

    /**
     * Sends stop message with current tab id
     */
    sendStopMessage: function() {
      browser.tabs.getActive().then(tabs => {
        browser.runtime.sendMessage({
          'cmd': 'stop',
          'tabId': tabs[0].id
        }).then(res => console.log(res));
      });

      setTimeout(() => {
        location.reload();
      }, 500);
    },

    /**
     * Send popup data
     * @param {object} data - send popup data
     */
    sendPopupData: function(data) {
      let promise = new Promise(function(resolve, reject) {
        browser.tabs.getActive().then(tabs => {
          browser.runtime.sendMessage({
            'cmd': 'setPopupData',
            'tabId': null,
            'data': data
          }).then(res => console.log(res));
        }).catch((error) => {
          console.log('En error occupied when sending popup info\n' + error.message);
        });
      });
      return promise;
    },

    /**
     * Returns popup data from extension
     * @returns {Promise} promise - resolve holds popup data
     */
    getPopupData: function() {
      return new Promise(function(resolve, reject) {
        browser.tabs.getActive().then(tabs => {
          browser.runtime.sendMessage({
            'cmd': 'getPopupData',
            'tabId': tabs[0].id,
          }).then(res => console.log(res));
        })
      });
    }
  };
}());

