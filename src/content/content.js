/**
 * Created by Середа on 17.03.2017.
 */
import * as $ from 'jquery';

chrome.runtime.onMessage.addListener(function (request, sender, response) {
    if (request.cmd == 'bump') {
        console.log("Bump interval: " + request.bumperInterval);
        bump(request.bumperInterval);
        response("Bump message recieved");
    }
});

chrome.runtime.sendMessage({
    'cmd': 'startWithDefault',
    'href': window.location.href
});


/**
 * Function do trade bumps on the page
 * @param {number} interval - interval between bumps in milliseconds
 */
function bump(interval) {
    // ==UserScript==
// @name         CSGO lounge bumper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://csgolounge.com/mytrades
// @grant        none
// ==/UserScript==

    function GetTradeItems() {
        var items = new Array();
        //$('article div[class="tradepoll"]').each(function(index, item) {
        $('article div[class="tradepoll"] .buttonright')
            .each(function (index, item) {
                items.push($(item)
                    .parent()
                    .parent());
                //items.push($(item));
                //items.push($(item).attr('id').split('trade')[1])
            });
        return items;
    }

    function SlowForEach(array, finishCallback, min, max) {
        var timeOffset = 150.0;
        Iterate(0, array, timeOffset, min, max, finishCallback);
    }

    function Iterate(index, array, offset, offsetMin, offsetMax, finishCallback) {
        if (index >= array.length) {
            finishCallback();
            return;
        }

        var data = {
            index: index,
            item: array[index],
            collection: array
        };
        IterationCallback(data);

        Iterate(index + 1, array, offset, offsetMin, offsetMax, finishCallback);
    }

    /**
     * ONLY HERE WE ACTYALLY BUMP !!!!!!!!!!!!!!!!!!!
     * @param data
     * @constructor
     */
    function IterationCallback(data) {
        //data.collection[data.index].find('.buttonright').click();
        //var code = data.collection[data.index].find('.buttonright').attr('onclick');
        //eval(code);
        var tradeId = data.item.attr('id')
            .split('trade')[1];

        // added here the time check
        var curTime = new Date();
        // if we need to control time
        // if ((curTime.getMinutes() % 10) != 5 && (curTime.getMinutes() % 10) != 0) {
        //
        // }
        $.post('ajax/bumpTrade.php', 'trade=' + tradeId);
        data.item.find('.buttonright')
            .hide();
        if (typeof console !== 'undefined') {
            console.log('bumped ' + tradeId);
        }
    }

    function BumpAllTrades() {
        SlowForEach(
            GetTradeItems(),
            function () {
                setTimeout(function () {
                    window.location.reload(true);
                }, ((Math.random() * 2) + 30.2) * 1000 * 60);
                //window.location.reload(true);
                //setTimeout(BumpAllTrades, ((Math.random() * 40) + 31) * 1000 * 60);
            },
            1,
            500
        );
    }

    BumpAllTrades();
}