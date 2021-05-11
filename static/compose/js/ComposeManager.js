/* ComposeManager.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Manage the UI for ABR compose
 */

import { globals } from '../../common/globals.js';
import { STATE_UPDATE_EVENT, CACHE_UPDATE } from '../../common/StateManager.js';
import { ColormapDialog } from './components/ColormapEditor/ColormapDialog.js';
import * as Components from './components/Components.js';
import { COMPOSITION_LOADER_ID } from './components/Components.js';
import { DataImpression } from './components/DataImpression.js';

export class ComposeManager {
    constructor() {
        // Tooltips for larger images on hover adapted from
        // https://chartio.com/resources/tutorials/how-to-show-data-on-mouseover-in-d3js/
        $('body').append($('<div>', {
            id: 'thumbnail-tooltip',
            css: {
                'position': 'absolute',
                'z-index': '100',
                'visibility': 'hidden',
            },
        }));

        this.header = Components.Header();

        this.$element = $('#compose-manager');

        this.$element.append(this.header);
        this.$element.append($('<div>', {
            id: 'panel-container',
        })
            .append(Components.DataPanel())
            .append(Components.CompositionPanel())
            .append(Components.DesignPanel())
        );

        globals.stateManager.subscribe(this.$element);
        this.$element.on(STATE_UPDATE_EVENT, (_evt) =>  this.syncWithState() );
        this.syncWithState();

        // Prepare the Design Panel to be refreshed when new visassets come in
        globals.stateManager.subscribeCache('visassets', this.$element);
        this.$element.on(CACHE_UPDATE + 'visassets', (evt) => {
            evt.stopPropagation();

            // Keep track of open/closed panels
            let collapsibleStates = [];
            $(evt.target).find('.collapsible-header').each((_i, el) => {
                collapsibleStates.push($(el).hasClass('active'));
            });

            $('#design-panel').remove();
            this.$element.children('#panel-container').append(Components.DesignPanel());

            // Reset open/closed panels
            $(evt.target).find('.collapsible-div').each((i, el) => {
                let $header = $(el).find('.collapsible-header');
                if ($header.hasClass('active') && !collapsibleStates[i] || !$header.hasClass('active') && collapsibleStates[i]) {
                    $header.trigger('click');
                }
            });
        });

        // Allow the page to receive drag/dropped VisAssets from the library, then tell
        // the server to download them
        this.$element.on('dragover', (evt) => {
            evt.preventDefault();
        });
        this.$element.on('drop', (evt) => {
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
                                // 'X-CSRFToken': csrftoken,
                            },
                            mode: 'same-origin',
                        }).then(() => {
                            $('.loading-spinner').css('visibility', 'hidden');
                        });
                    }
                });
            }
        });

        dragscroll.reset();
    }

    syncWithState() {
        // TODO: incorporate jsondiffpatch
        let impressions = globals.stateManager.state['impressions'];
        let uiData = {};
        if (globals.stateManager.state) {
            if (globals.stateManager.state.uiData) {
                if (globals.stateManager.state.uiData.compose) {
                    if (globals.stateManager.state.uiData.compose.impressionData) {
                        uiData = globals.stateManager.state.uiData.compose.impressionData;
                    }
                }
            }
        }

        let $compositionLoader = $('#composition-panel').find('#' + COMPOSITION_LOADER_ID);
        $compositionLoader.empty();

        for (const imprId in impressions) {
            let impression = impressions[imprId];
            let uiDataForImpression = uiData[impression.uuid];
            let $impression = DataImpression(impression.plateType, impression.uuid, impression.name, uiDataForImpression);
            $compositionLoader.append($impression);
        }
    }
}