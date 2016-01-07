"use strict";

//
//  A page mode for the web site boardgaming-online.com, which offers
//  a web-based implementation of the excellent board game "Through
//  the Ages: A Story of Civilization."
//
//  http://www.boardgamegeek.com/boardgame/25613/through-the-ages-a-story-of-civilization
//
//  The following key commands are provided:
//
//    C-1 through C-4: Go to the first (second, ...) player's tab.
//    C-c C-j: Go to the Journal tab.
//    C-c C-c: Submit the current page.
//    C-c C-k: Reset the page.
//
//  In addition, all selectable actions from the actions drop-down are
//  added to the page as hyperlinks, which can be more convenient to
//  activate with Conkeror's follow command than by choosing them from
//  the drop-down.

(function () {

    // function open_boardgaming_buffers(buffer) {
    //     var $ = $$(buffer);
    //     $("td.tabPartiesFond2 a").map(let (seen = {}) function (i) {
    //         if (!seen[this.href]) {
    //             seen[this.href] = true;
    //             return {
    //                 target: i == 0 ? OPEN_CURRENT_BUFFER : OPEN_NEW_BUFFER,
    //                 href: this.href
    //             };
    //         }
    //     }).get().reverse().forEach(function (game) {
    //         browser_object_follow(buffer, game.target, game.href);
    //     });
    // }

    const BOARDGAMING_HOST = "boardgaming-online.com";

    define_keymap("bgo_keymap", $display_name = "BGO");

    for (var i = 1; i <= 4; ++i)
        define_key(bgo_keymap, "C-" + i, bgo_goto_player(i));

    define_key(bgo_keymap, "C-j", bgo_goto("Journal"));
    define_key(bgo_keymap, "C-k", bgo_goto("Chat"));
    define_key(bgo_keymap, "C-c C-c", bgo_done);
    define_key(bgo_keymap, "C-c C-k", bgo_reset);

    let (
        [enable, disable] = setup_mode({ normal: bgo_keymap })
    ) {
        define_page_mode(
            "bgo-mode",
                /^http:\/\/boardgaming-online\.com/,
            enable,
            disable,
            $display_name = "BGO"
        );
    }

    page_mode_activate(bgo_mode);

    function bgo_goto(label) {
        return function (I) {
            const $ = $$(I);
            if ($("li").filter(function () { return $(this).text() == label })
                       .closest("td").clickthis().length == 0)
                I.minibuffer.message(label + " not found!");
        };
    }

    function bgo_goto_player(n) {
        const selector = "li#texteOnglet" + n;
        return function (I) {
            if ($$(I)(selector).closest("td").clickthis().length == 0)
                I.minibuffer.message("Player #" + n + " not found!");
        };
    }

    function bgo_done(I) {
        if ($$(I)("input#boutonGO").clickthis().length == 0)
            I.minibuffer.message("GO button not found!");
    }

    const RESET_OPTION =
        "select#action option:contains('Reset Action Phase')";

    function bgo_reset(I) {
        if ($$(I)(RESET_OPTION).eq(0).prop("selected", true).length > 0) {
            bgo_done(I);
        } else {
            I.minibuffer.message("Unable to comply.");
        }
    }

    function is_boardgaming_uri(uri) {
        return uri.asciiHost.indexOf(BOARDGAMING_HOST) >= 0;
    }

    const BGO_TABLE =
        "div#contenu > table:eq(1) > tbody > tr > " +
        "td.td_bg2 > table:eq(0) > tbody:last";

    function bgo_buffer_loaded(buffer) {

        const uri = buffer.current_uri;

        if (!is_boardgaming_uri(uri))
            return;

        const path = uri.path;
        const $    = $$(buffer);

        if (/index\.php/.test(path) && !/pl=./.test(path)) {
            $("td[colspan]")
                .filter(function () {
                    return /Private games/.test($(this).text());
                })
                .append(" (are not interesting)")
                .closest("tr").nextAll().remove();
            return;
        }

        const select  = $("select#action");
        const confirm = $("input#confirmEndTurn");
        const dot     = $.document.createTextNode(" \u2e31 ");

        $("<div style='font-size: x-small; width: 800px; color: black'/>").append(
            select.find("option[value!='0']").map(let (seen = {}) function (i) {
                if (seen[this.label]) return;
                seen[this.label] = true;
                const value = $(this).val();
                const a = $("<a href='#' style='color: inherit'/>")
                    .text(this.label)
                    .click(function () {
                        select.val(value)[0].onchange();
                        if ($(this).text() == "End Action Phase")
                            confirm.prop("checked", true);
                        return false;
                    })[0];
                return i == 0 ? a : [ dot.cloneNode(), a ];
            })
        ).appendTo($("<td/>").appendTo($("<tr/>").appendTo(BGO_TABLE)));

    }

    add_dom_content_loaded_hook(bgo_buffer_loaded);

})();
