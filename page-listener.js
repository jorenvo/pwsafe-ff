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

// from jQuery's :visible
function _isVisible (e) {
    return !! (e.offsetWidth || e.offsetHeight || e.getClientRects().length);
}

function _getHTML (e) {
    let el = document.createElement("div");
    el.appendChild(e.cloneNode(false));
    return el.innerHTML;
}

function getElement (initial_css_selector, tie_breaker_keywords=[], tie_breaker_function) {
    let eligible_inputs = Array.from(document.querySelectorAll(initial_css_selector));
    eligible_inputs = eligible_inputs.filter((input) => _isVisible(input));
    if (eligible_inputs.length == 1) {
        return eligible_inputs[0];
    } else {
        let filtered_inputs = eligible_inputs.filter((input) => {
            let input_outerHTML = input.outerHTML.toLowerCase();
            return tie_breaker_keywords.find((keyword) => {
                return input_outerHTML.includes(keyword);
            });
        });

        if (filtered_inputs.length === 1) {
            return filtered_inputs[0];
        } else if (tie_breaker_function) {
            filtered_inputs = tie_breaker_function(eligible_inputs);
            if (filtered_inputs.length === 1) {
                return filtered_inputs[0];
            }
        }
    }

    return false;
}

function _filter_inputs_in_login_form (inputs) {
    return inputs.filter((input) => _getHTML(getForm([input])).toLowerCase().includes('login'));
}

function getUsernameInput () {
    return getElement('input[type=email], input[type=text], input:not([type])',
                      ['username', 'login', 'onlineid', 'signin'],
                      _filter_inputs_in_login_form);
}

function getPasswordInput () {
    return getElement('input[type=password]', [], _filter_inputs_in_login_form);
}

function getNextButton () {
    return getElement('button, [role=button]', ['next']);
}

function getForm (inputs) {
    let eligible_forms = Array.from(document.querySelectorAll('form'));
    // get rid of falsy inputs (e.g. if username was not found)
    inputs = inputs.filter((input) => input);

    return eligible_forms.find((form) => inputs.every((input) => form.contains(input)));
}

function submitForm (username_input, password_input) {
    let form = getForm([username_input, password_input]);
    if (form) {
        let form_method = form.method;
        if (form_method === 'post') {
            form.submit();
        } else {
            console.error(`login form had the ${form_method} method instead of post, so not auto-submitting`);
        }
    } else {
        console.error('couldn\'t find form');
    }
}

function _triggerReactUpdate (input) {
    // controlled form components in react.js have a separate js state
    // that won't be updated by just setting the value property
    input.dispatchEvent(new Event('input', {bubbles: true, simulated: true}));
}

function setInputValue (input, new_value) {
    input.value = new_value;
    _triggerReactUpdate(input);
}

function logIn (info, dont_submit) {
    let username = info.username;
    let password = info.password;

    let username_input = getUsernameInput();
    if (username_input) {
        setInputValue(username_input, username);
    } else {
        console.error('couldn\'t find username input');
        return false;
    }

    let password_input = getPasswordInput();
    if (password_input) {
        setInputValue(password_input, password);
        if (! dont_submit) {
            submitForm(username_input, password_input);
        }
    } else {
        // Couldn't find password input. Perhaps this is a multi-page
        // login form like Google is doing. Try to find a 'next'
        // button and click.
        let next_button = getNextButton();
        if (next_button) {
            setTimeout(() => next_button.click(), 500);
            setTimeout(() => {
                let password_input = getPasswordInput();
                if (password_input) {
                    setInputValue(password_input, password);
                    if (! dont_submit) {
                        getNextButton().click();
                    }
                    window.__pwsafe_ff_password_input_found = true;
                } else {
                    console.error('couldn\'t find password input after clicking next');
                    window.__pwsafe_ff_password_input_found = false;
                }
            }, 5000);
            return undefined;
        } else {
            console.error('couldn\'t find password input or next button');
            return false;
        }
    }

    return true;
}

if (browser) {
    browser.runtime.onMessage.addListener((login_info) => {
        logIn(login_info);
    });
}
