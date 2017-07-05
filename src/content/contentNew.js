// ==UserScript==
// @name         Test it
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  try to take over the world!
// @author       You
// @match        https://csgolounge.com/mytrades
// @grant        none
// ==/UserScript==

let Interval = 0;

chrome.runtime.onMessage.addListener(function (request, sender, response) {
    if (request.cmd == 'bump') {
        console.log("Bump interval: " + request.bumperInterval);
        bump();
        Interval = request.bumperInterval;
        response("Bump message recieved");
    }
});

chrome.runtime.sendMessage({
    'cmd': 'startWithDefault',
    'href': window.location.href
});


function bump() {
    // don't change
    function GetTradeItems() {
        var items = new Array();
        //$('article div[class="tradepoll"]').each(function(index, item) {
        $('article div[class="tradepoll"] .buttonright')
            .each(function(index, item) {
                items.push($(item)
                    .parent()
                    .parent());
                //items.push($(item));
                //items.push($(item).attr('id').split('trade')[1])
            });
        return items;
    }

    //don't change
    function SlowForEach(array, finishCallback, min, max) {
        var timeOffset = 0.0;
        Iterate(0, array, 0.0, min, max, finishCallback);
    }

    // changed !!!!!
    function Iterate(index, array, offset, offsetMin, offsetMax, finishCallback) {
        if (index >= array.length) {
            finishCallback();
            return;
        }

        offset = Interval;

        if (Interval == 0 || !Interval) {
            var data = {
                index: index,
                item: array[index],
                collection: array
            };
            IterationCallback(data);
            Iterate(index + 1, array, offset, offsetMin, offsetMax, finishCallback);
        }
        else {
            setTimeout(function() {
                var data = {
                    index: index,
                    item: array[index],
                    collection: array
                };
                IterationCallback(data);
                Iterate(index + 1, array, offset, offsetMin, offsetMax, finishCallback);
            }, offset);
        }
    }

    // don't change
    function IterationCallback(data) {
        //data.collection[data.index].find('.buttonright').click();
        //var code = data.collection[data.index].find('.buttonright').attr('onclick');
        //eval(code);
        var tradeId = data.item.attr('id')
            .split('trade')[1];
        $.post('ajax/bumpTrade.php', 'trade=' + tradeId);
        data.item.find('.buttonright')
            .hide();
        if (typeof console !== 'undefined') {
            console.log('bumped ' + tradeId);
        }
    }
    // don't change
    function BumpAllTrades() {
        SlowForEach(
            GetTradeItems(),
            function() {
                setTimeout(function() {
                    window.location.reload(true);
                }, ((Math.random() * 2) + 30.2) * 1000 * 60);
                //window.location.reload(true);
                //setTimeout(BumpAllTrades, ((Math.random() * 40) + 31) * 1000 * 60);
            },
            0,
            0
        );
    }

    BumpAllTrades();
}