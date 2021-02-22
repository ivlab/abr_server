/* components/DesignPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Design panel (right side of the ABR Compose UI)
 */

import * as Components from './Components.js';
import { globals } from '../../../common/globals.js';
import { InputPuzzlePiece } from './PuzzlePiece.js';

const typeMap = {
    'colormap': 'IVLab.ABREngine.ColormapVisAsset',
    'glyph': 'IVLab.ABREngine.GlyphVisAsset',
    'line': 'IVLab.ABREngine.LineTextureVisAsset',
    'texture': 'IVLab.ABREngine.SurfaceTextureVisAsset',
};

export function refreshDesignPanel() {
    let $panel = $('#design-panel');
    let $parent = $panel.parent();
    $panel.remove();
    $parent.append(DesignPanel());
}

export function DesignPanel() {
    let $designPanel = $('<div>', {
        class: 'panel',
        id: 'design-panel',
    });

    $designPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Design Palette',
    }));

    // Populate the plates
    let plateTypes = Object.keys(globals.schema.definitions.Plates)
        .map((plt) => Components.Plate(plt));

    let $plateList = Components.SwatchList('Plates', plateTypes);
    $designPanel.append($plateList);

    $designPanel.append($('<p>', {
        class: 'section-header',
        text: 'VisAssets',
    }));

    // Populate the VisAssets
    fetch('/api/visassets')
        .then((resp) => resp.json())
        .then((visassets) => {
            globals.visassetCache = visassets;
            // Break up by type
            let visassetsByType = {};
            for (const t in typeMap) {
                visassetsByType[t] = [];
            }
            
            for (const va in visassets) {
                let type = visassets[va].type;
                let artifactType = visassets[va].artifactType;
                if (typeof(artifactType) !== 'undefined') {
                    console.warn('Use of VisAsset field `artifactType` is deprecated, use `type` instead');
                }
                type = type ?? artifactType;
                let mockInput = {
                    inputGenre: 'VisAsset',
                    inputValue: va ,
                    inputType: typeMap[type]
                }
                let $puzzlePiece = InputPuzzlePiece(typeMap[type], mockInput);
                $puzzlePiece.draggable({
                    helper: 'clone',
                    cursor: 'grabbing'
                });
                visassetsByType[type].push($puzzlePiece);
            }

            for (const t in visassetsByType) {
                let typeCap = t[0].toUpperCase() + t.slice(1);
                let $title = $('<span>');
                $title.append(Components.PuzzleConnector(typeMap[t]))
                $title.append($('<p>', { text: typeCap }))
                $designPanel.append(Components.SwatchList($title, visassetsByType[t]));
            }
        });

    return $designPanel;
}
