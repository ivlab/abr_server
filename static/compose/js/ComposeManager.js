/* ComposeManager.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Manage the UI for ABR compose
 */

import * as Components from './components/Components.js';

export class ComposeManager {
    constructor() {
        this.header = Components.Header();
        this.compositionPanel = Components.CompositionPanel();
        this.dataPanel = Components.DataPanel();
        this.designPanel = Components.DesignPanel();

        $('#compose-manager').append(this.header);
        $('#compose-manager').append($('<div>', {
            id: 'panel-container',
        })
            .append(this.dataPanel)
            .append(this.compositionPanel)
            .append(this.designPanel)
        );
    }
}