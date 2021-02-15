/* ComposeManager.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Manage the UI for ABR compose
 */

import { globals } from '../../common/globals.js';
import { STATE_UPDATE_EVENT } from '../../common/StateManager.js';
import * as Components from './components/Components.js';

export class ComposeManager {
    constructor() {
        this.header = Components.Header();
        this.compositionPanel = Components.CompositionPanel();
        this.dataPanel = Components.DataPanel();
        this.designPanel = Components.DesignPanel();
        this.$element = $('#compose-manager');

        this.$element.append(this.header);
        this.$element.append($('<div>', {
            id: 'panel-container',
        })
            .append(this.dataPanel)
            .append(this.compositionPanel)
            .append(this.designPanel)
        );

        globals.stateManager.subscribe(this.$element);
        this.$element.on(STATE_UPDATE_EVENT, (evt) => {
            console.log(globals.stateManager.state);
        })
    }
}