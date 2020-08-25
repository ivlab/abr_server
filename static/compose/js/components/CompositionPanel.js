/* components/CompositionPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Composition panel (Center of the ABR Compose UI)
 */

export function CompositionPanel() {
    let $compositionPanel = $('<div>', {
        class: 'panel',
        id: 'composition-panel',
    });

    $compositionPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Visualization Composition',
    }));

    // The composition data impressions are loaded here
    let initPos = {left: 0, top: 0};
    let $loader = $('<div>', {
        id: 'composition-loader',
    }).draggable({
        stop: (evt, _ui) => {
            let pos = $(evt.target).position();
            if (pos.left > initPos.left) {
                $(evt.target).css('left', 0);
            }
            if (pos.top > initPos.top) {
                $(evt.target).css('top', 0);
            }
        }
    });

    $compositionPanel.append($('<div>', {
        id: 'composition-scrollbox',
    }).append($loader));

    return $compositionPanel;
}
