import * as $ from 'jquery';
import browser from 'extension-api-compilation';


browser.runtime.addListener(function (request, sender, response) {
    if (request.cmd === 'bump') {
        console.log("Bump interval: " + request.bumperInterval);
        bump(request.bumperInterval);
        response("Bump message recieved");
    }
});

browser.runtime.sendMessage({
    'cmd': 'startWithDefault',
    'href': location.href
});

function bump(interval) {
    function getTradeItems() {
        let items = [];

        // get all trades with buttons
        $('article div[class="tradepoll"] .buttonright')
          .each(function (index, item) {
              items.push($(item)
                .parent()
                .parent());
          });

        return items;
    }

    function iterate(array) {
        for (let item of array) {
            // get trade id
            let tradeId = item.attr('id')
              .split('trade')[1];

            // post message
            $.post('https://csgolounge.com/ajax/bumpTrade.php',
              "trade="+tradeId).then(success => console.log(`Traded ${tradeId} successfuly: ${success}`))
              .catch(error => console.error("Error when posting trade message: " + error));

            // $.ajax({
            //     type: "POST",
            //     url: "https://csgolounge.com/ajax/bumpTrade.php",
            //     data: "trade=" + tradeId
            // }).then(success => console.log(`Traded ${tradeId} successfuly: ${success}`))
            //   .catch(error => console.error("Error when posting trade message: " + error));


            // remove button
            item.find('.buttonright')
              .hide();

            // log to console
            if (typeof console !== 'undefined') {
                console.log('bumped ' + tradeId);
            }
        }
    }

    iterate(getTradeItems());
}