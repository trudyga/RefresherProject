/**
 * Created by Середа on 13.03.2017.
 */


$(function() {
    let tabButtons = $(".nav-tabs-vertical .tabs button");
    let tabContents = $(".nav-tabs-vertical .tab-content");

    // create map of objects
    let map = [];
    let prevClickedIndex = -1;

    for(let i = 0; i < tabButtons.length; i++) {
        $(tabContents[i]).hide();
        $(tabContents[i]).css("visibility", "visible");
        map.push({
            tab: tabButtons[i],
            content: tabContents[i]
        });

        map[i].tab.onclick = function() {
            $(map[i].content).show();
            $(map[i].content).css("visibility", "visible");
            $(map[i].tab).addClass('selected').show();

            if (prevClickedIndex != -1 && prevClickedIndex != i){
                $(map[prevClickedIndex].content).hide();
                $(map[prevClickedIndex].tab).removeClass('selected');
            }
            prevClickedIndex = i;
        };
    }

    //select first tab if exist
    if (true) {
        prevClickedIndex = 0;
        $(map[0].content).show();
        $(map[0].content).css("visibility", "visible");
        $(map[0].tab).addClass('selected').show();
    }
});