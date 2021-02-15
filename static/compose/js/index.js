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

function init() {
    let toInit = [];

    toInit.push(initValidator());
    toInit.push(initNotifier());
    globals.stateManager = new StateManager();
    toInit.push(globals.stateManager.updateState());

    // Wait for all pre-fetching to finish before loading the UI
    Promise.all(toInit).then(() => {
        let ui = new ComposeManager();
    })
}

window.onload = init;