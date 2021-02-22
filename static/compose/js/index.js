/* index.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Main file for ABR Compose
 */

import { Validator } from '../../common/Validator.js';
import { globals } from '../../common/globals.js';
import { ComposeManager } from './ComposeManager.js';
import { Notifier } from '../../common/Notifier.js';
import { StateManager } from '../../common/StateManager.js';
import { DEFAULT_STATE_NAME } from './components/Header.js';
import { refreshDesignPanel } from './components/Components.js';

// globals.validator and globals.schema are guaranteed to be defined after this
// finishes
async function initValidator() {
    globals.validator = new Validator('ABRSchema_0-2-0.json');

    let scm = await globals.validator.schema;
    globals.schema = scm;
}

// globals.notifier is guaranteed to be initialized after this
async function initNotifier() {
    let notifier = new Notifier();
    await notifier.ready();
    globals.notifier = notifier;
}

async function initState() {
    let stateManager = new StateManager();
    await stateManager.refreshState();
    globals.stateManager = stateManager;
}

function init() {
    localStorage.currentStateName = DEFAULT_STATE_NAME;

    let toInit = [];

    toInit.push(initValidator());
    toInit.push(initNotifier());
    toInit.push(initState());

    // Allow the page to receive drag/dropped VisAssets from the library, then tell
    // the server to download them
    $(document).on('dragover', (evt) => {
        evt.preventDefault();
    });
    $(document).on('drop', (evt) => {
        if (!$(evt.target).hasClass('ui-droppable')) {
            evt.preventDefault();
            evt.originalEvent.dataTransfer.items[0].getAsString((url) => {
                let uuidRegex = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;
                let matches = uuidRegex.exec(url);

                if (matches[0]) {
                    $('.loading-spinner').css('visibility', 'visible');
                    fetch('/api/download-visasset/' + matches[0], {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': csrftoken,
                        },
                        mode: 'same-origin',
                    }).then(() => {
                        $('.loading-spinner').css('visibility', 'hidden');
                        refreshDesignPanel();
                    });
                }
            });
        }
    });

    // Wait for all pre-fetching to finish before loading the UI
    Promise.all(toInit).then(() => {
        let ui = new ComposeManager();
    })
}

window.onload = init;