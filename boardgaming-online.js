var [is_boardgaming_uri, BOARDGAMING_GAMES_URL] = (function () {

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

    define_key(bgo_keymap, "C-j", bgo_goto_journal);
    define_key(bgo_keymap, "C-c C-c", bgo_done);
    define_key(bgo_keymap, "C-c C-k", bgo_reset);

    let (
        [enable, disable] = setup_mode({ normal: bgo_keymap })
    )
    define_page_mode(
        "bgo-mode",
        /^http:\/\/boardgaming-online\.com/,
        enable,
        disable,
        $display_name = "BGO"
    );

    page_mode_activate(bgo_mode);

    function bgo_goto_player(n) {
        const selector = "li#texteOnglet" + n;
        return function (I) {
            if ($$(I)(selector).closest("td").clickthis().length == 0)
                I.minibuffer.message("Player #" + n + " not found!");
        };
    }

    function bgo_goto_journal(I) {
        const $ = $$(I);
        function is_journal() { return $(this).text() == "Journal" }
        if ($("li").filter(is_journal).closest("td").clickthis().length == 0)
            I.minibuffer.message("Journal not found!");
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

        const uri  = buffer.current_uri;

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

        $("<div style='font-size: x-small; width: 800px'/>").append(
            select.find("option[value!='0']").map(let (seen = {}) function (i) {
                if (seen[this.label]) return;
                seen[this.label] = true;
                const value = $(this).val();
                const a = $("<a href='#'/>")
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

    add_hook("buffer_dom_content_loaded_hook", bgo_buffer_loaded);

    return [
        is_boardgaming_uri,
        "http://" + BOARDGAMING_HOST + "/index.php?cnt=2"
    ];

})();
