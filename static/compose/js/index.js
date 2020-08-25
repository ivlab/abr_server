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

// globals.validator and globals.schema are guaranteed to be defined after this
// finishes
async function initValidator() {
    globals.validator = new Validator('abr_state.json');

    let scm = await globals.validator.schema;
    globals.schema = scm;
}

function init() {
    let toInit = [];

    toInit.push(initValidator());

    // Wait for all pre-fetching to finish before loading the UI
    Promise.all(toInit).then(() => {
        let ui = new ComposeManager();
    })
}

window.onload = init;