// Copyright (C) 2017 Joren Van Onder

// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software Foundation,
// Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA

'use strict';

browser.runtime.onMessage.addListener((pwd) => {
    browser.tabs.query({active: true, currentWindow: true}).then((tabs) => {
        let active_tab = tabs[0];
        let username = '';
        let password = '';
        let port = browser.runtime.connectNative('pwsafe');
        let matches = active_tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
        let url = matches && (matches[1]);

        port.onMessage.addListener((response) => {
            if (response === 'wrong_password' || response === 'not_found') { // todo different notification, not found vs wrong password
                browser.runtime.sendMessage('wrong_password');
            } else {
                browser.tabs.sendMessage(active_tab.id, response);
                browser.runtime.sendMessage('close_prompt');
            }
        });

        port.postMessage({website: url, password: pwd});
    });
});
