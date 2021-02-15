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
import { COMPOSITION_LOADER_ID } from './components/Components.js';
import { DataImpression } from './components/DataImpression.js';

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
        this.$element.on(STATE_UPDATE_EVENT, (_evt) =>  this.syncWithState() );
        this.syncWithState();
    }

    syncWithState() {
        // TODO: incorporate jsondiffpatch
        let impressions = globals.stateManager.state['impressions'];
        let uiData = globals.stateManager.state?.uiData?.compose?.impressionData ?? {};

        let $compositionLoader = this.compositionPanel.find('#' + COMPOSITION_LOADER_ID);
        $compositionLoader.empty();

        for (const imprId in impressions) {
            let impression = impressions[imprId];
            let uiDataForImpression = uiData[impression.uuid];
            let $impression = DataImpression(impression.plateType, impression.uuid, impression.name, uiDataForImpression);
            $compositionLoader.append($impression);
        }
    }
}