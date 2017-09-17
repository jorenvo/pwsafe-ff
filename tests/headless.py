#!/usr/bin/env python3
# Copyright (C) 2017 Joren Van Onder

# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software Foundation,
# Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301  USA

import os
import sys
import time

from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium import webdriver

def _wait_for_window_property(driver, property_name, wait_seconds):
    for attempt in range(0, wait_seconds):
        js_return = driver.execute_script('return window.{};'.format(property_name))
        if js_return is not None:
            return js_return
        time.sleep(1)
    print('wait for window property {} timed out after {} seconds'.format(property_name, wait_seconds))
    return False

def _format_url(url):
    MAX_LENGTH_TO_PRINT = 32
    return '{}...'.format(url[:MAX_LENGTH_TO_PRINT]) if len(url) > MAX_LENGTH_TO_PRINT else url

# Set the MOZ_HEADLESS environment variable which casues Firefox to start in headless mode.
os.environ['MOZ_HEADLESS'] = '1'

# Select your Firefox binary.
binary = FirefoxBinary('/opt/firefox/firefox-bin', log_file=sys.stdout)

# Start selenium with the configured binary.
driver = webdriver.Firefox(firefox_binary=binary)

with open('./page-listener.js') as f:
    page_listener_js = 'let browser = false;' + f.read() + 'return logIn({username: "username@gmail.com", password: "password"}, "dont_submit");'

urls_to_test = [
    'https://github.com/login',
    'https://bankofamerica.com',
    'https://www.amazon.com/ap/signin?_encoding=UTF8&ignoreAuthState=1&openid.assoc_handle=usflex&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fyour-account%3Fref_%3Dnav_ya_signin&switch_account=',
    'https://accounts.google.com',
    # 'https://auth.uber.com/login',  # todo: this works, but not with selenium for some reason, probably some weird reactjs thing
    'https://www.facebook.com/',
    'https://www.facebook.com/login',
    'https://en.wikipedia.org/wiki/Special:UserLogin',
    'https://www.reddit.com',
    'https://twitter.com/login',
    'https://live.com/login',
    'https://www.netflix.com/login',
    'https://stackoverflow.com/users/login',
    'https://twitch.tv/login',
    'https://www.odoo.com/web/login',
    'https://auth.hulu.com/web/login',
]

failed_tests = False
for url in urls_to_test:
    printable_url = _format_url(url)

    driver.get(url)
    js_return = driver.execute_script(page_listener_js)
    if js_return is True:
        print('{} succeeded'.format(printable_url))
    elif js_return is None:
        if _wait_for_window_property(driver, '__pwsafe_ff_password_input_found', 30):
            print('{} succeeded (multi-page login)'.format(printable_url))
        else:
            print('{} FAILED (multi-page login)'.format(printable_url))
            failed_tests = True
    else:
        print('{} FAILED'.format(printable_url))
        failed_tests = True

driver.quit()

if failed_tests:
    sys.exit(1)
else:
    sys.exit(0)
