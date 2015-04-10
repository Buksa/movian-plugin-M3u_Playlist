/*
 *  Copyright (C) 2014 Buksa
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
//ver 1.3
(function(plugin) {
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var logo = plugin.path + 'logo.png';
    // Register a service (will appear on home page)
    var service = plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);
    //settings
    var settings = plugin.createSettings(plugin_info.title, logo, plugin_info.synopsis);
    settings.createInfo("info", logo, "Plugin developed by " + plugin_info.author + ". \n");
    settings.createDivider('Settings:');

    settings.createBool("debug", "Debug", false, function(v) {
        service.debug = v;
    });
    var store = plugin.createStore('config', true);
    ////settings.createString("M3u Playlist", "playlist Source", "https://dl.dropboxusercontent.com/u/94263272/pl.txt", function(v) {
    //settings.createString("Playlist", "playlist Source", "http://peers.tv/services/iptv/playlist.m3u", function(v) {
    //    service.pl = v;
    //});

    function showPlaylist(page) {
        page.flush();
        if (!store.playlist) {
            page.appendPassiveItem("directory", '', {
                title: "Playlist list is empty, you can add a Playlist from the page menu"
            });
        } else {
            var playlist = store.playlist.split(',');
            for (var i in playlist) {
                var item = page.appendItem(PREFIX + ":browse:" + playlist[i], "item", {
                    title: unescape(playlist[i])
                });
                item.id = +i;
                item.title = unescape(playlist[i]);
                item.onEvent("deletePlaylist", function(item) {
                    var arr = store.portals.split(',');
                    arr.splice(this.id, 1);
                    store.portals = arr.toString();
                    showtime.notify("'" + this.title + "' has been deleted from the list.", 2);
                    showPlaylist(page);
                }.bind(item));
                item.addOptAction("Delete Playlist '" + unescape(playlist[i]) + "' from the list", "deletePlaylist");
            }
        }
    }

    // Start page
    plugin.addURI(PREFIX + ":start", function(page) {
        //   setPageHeader(page, plugin.getDescriptor().synopsis);
        page.options.createAction('addPlaylist', 'Add Playlist', function() {
            var result = showtime.textDialog('Enter address or address of the Playlist like:\n' +
                'https://dl.dropboxusercontent.com/u/94263272/pl.txt or http://peers.tv/services/iptv/playlist.m3u', true, true);
            if (!result.rejected && result.input) {
                var playlist = [];
                if (store.playlist)
                    playlist = store.playlist.split(',');
                playlist.push(escape(result.input));
                store.playlist = playlist.toString();
                showtime.notify("Playlist '" + result.input + "' has been added to the list.", 2);
                showPlaylist(page);
            }
        });
        showPlaylist(page);

        page.type = "directory";
        page.contents = "items";
        page.loading = false;
        page.metadata.logo = logo;
        page.metadata.title = plugin_info.title;
    });


    //First level start page
    plugin.addURI(PREFIX + ":browse:(.*)", function(page, pl) {
        page.metadata.logo = plugin.path + "logo.png";
        page.metadata.title = PREFIX;

        var respond = showtime.httpReq(unescape(pl), {
            debug: service.debug
        }).toString();
        p('Respond:')
        p(respond)
        var re = /#EXTINF:.*,(.*?)(\r\n|\n)(.*)(\r\n|\n|$)/g;
        var m = re.exec(respond);
        while (m) {
            p("title: " + m[1])
            p('url: ' + m[3])
            page.appendItem(m[3].trim(), "video", {
                title: new showtime.RichText(m[1].trim())
            });
            m = re.exec(respond);
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    });

    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    function p(message) {
        if (typeof(message) === 'object') message = '### object ###' + '\n' + showtime.JSONEncode(message) + '\n' + '### object ###';
        if (service.debug) print(message);
    }
})(this);