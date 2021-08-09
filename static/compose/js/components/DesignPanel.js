/* DesignPanel.js
 *
 * Design panel (right side of the ABR Compose UI)
 *
 * Copyright (C) 2021, University of Minnesota
 * Authors: Bridger Herman <herma582@umn.edu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as Components from './Components.js';
import { globals } from '../../../common/globals.js';
import { CACHE_UPDATE } from '../../../common/StateManager.js';

const typeMap = {
    'colormap': 'IVLab.ABREngine.ColormapVisAsset',
    'glyph': 'IVLab.ABREngine.GlyphVisAsset',
    'line': 'IVLab.ABREngine.LineTextureVisAsset',
    'texture': 'IVLab.ABREngine.SurfaceTextureVisAsset',
};

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


    let outTimer = null;
    let $visAssetMenu = $('<ul>', {
        id: 'vis-asset-menu',
        css: { visibility: 'hidden', position: 'fixed' },
    }).append(
        $('<li>').append($('<div>', { title: 'Clear all unused VisAssets' }).append(
            $('<span>', { class: 'material-icons', text: 'delete_sweep' })
        ).append(
            $('<span>', { text: 'Clear unused...'})
        ).on('click', (evt) => {

            let usedUuids = globals.stateManager.findAll((s) => {
                return s.hasOwnProperty('inputGenre') &&
                s['inputGenre'] == 'VisAsset'
            }).map((v) => v.inputValue);

            let visAssetsToRemove = Object.keys(globals.stateManager.getCache('visassets')).filter((v) => usedUuids.indexOf(v) < 0);

            let confirmed = confirm(`Really delete ${visAssetsToRemove.length} VisAssets?`);
            if (confirmed) {
                for (const va of visAssetsToRemove) {
                    fetch(`/api/remove-visasset/${va}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        mode: 'same-origin',
                    })
                }
            }
        })
    )).menu().on('mouseout', (evt) => {
        outTimer = setTimeout(() => $('#vis-asset-menu').css('visibility', 'hidden'), 500);
    }).on('mouseover', (evt) => {
        clearTimeout(outTimer);
        outTimer = null;
    });

    $designPanel.append($('<div>', {
        class: 'section-header'
    }).append($('<p>', { text: 'VisAssets' })
    ).append(
        $('<button>', {
            class: 'rounded',
            text: '...',
            title: 'Show additional options...'
        }).on('click', (evt) => {
            $visAssetMenu.css('left', $(evt.target).position().left - $visAssetMenu.width() - $(evt.target).width());
            $visAssetMenu.css('top', $(evt.target).position().top + $visAssetMenu.height() + $(evt.target).height());
            let visibility = $('#vis-asset-menu').css('visibility');
            let newVisibility = visibility == 'visible' ? 'hidden' : 'visible';
            $visAssetMenu.css('visibility', newVisibility);
        })
    )).append($visAssetMenu);

    // Populate the VisAssets
    let visassets = globals.stateManager.getCache('visassets');
    let visassetsCopy = JSON.parse(JSON.stringify(visassets));
    let localVisAssets = globals.stateManager.state.localVisAssets;
    if (localVisAssets) {
        for (const va in localVisAssets) {
            visassetsCopy[va] = localVisAssets[va].artifactJson;
        }
    }
    let visassetsByType = {};

    // Break up by type
    for (const t in typeMap) {
        visassetsByType[t] = [];
    }
    
    for (const va in visassetsCopy) {
        let type = visassetsCopy[va].type;
        let artifactType = visassetsCopy[va].artifactType;
        if (typeof(artifactType) !== 'undefined') {
            console.warn('Use of VisAsset field `artifactType` is deprecated, use `type` instead');
        }
        type = type ? type : artifactType;
        let mockInput = {
            inputGenre: 'VisAsset',
            inputValue: va ,
            inputType: typeMap[type]
        }
        let $puzzlePiece = Components.SwatchInputPuzzlePiece(typeMap[type], mockInput);
        visassetsByType[type].push($puzzlePiece);
    }

    for (const t in visassetsByType) {
        let typeCap = t[0].toUpperCase() + t.slice(1);
        let $title = $('<span>');
        $title.append(Components.PuzzleConnector(typeMap[t]))
        $title.append($('<p>', { text: typeCap }))
        let $visAssetList = Components.SwatchList($title, visassetsByType[t]);
        $designPanel.append($visAssetList);
    }

    return $designPanel;
}
