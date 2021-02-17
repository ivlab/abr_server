/* components/CompositionPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Composition panel (Center of the ABR Compose UI)
 */

import { globals } from "../../../common/globals.js";

export const COMPOSITION_ID = 'composition-panel';
export const COMPOSITION_LOADER_ID = 'composition-loader';

export function CompositionPanel() {
    let $compositionPanel = $('<div>', {
        class: 'panel',
        id: COMPOSITION_ID,
    });

    $compositionPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Visualization Composition',
    }));

    // The composition data impressions are loaded here
    let initPos = {left: 0, top: 0};
    let $loader = $('<div>', {
        id: COMPOSITION_LOADER_ID,
    }).draggable({
        stop: (evt, _ui) => {
            // Snap back into place if we've scrolled off to the left or top
            // let pos = $(evt.target).position();
            // console.log(pos);
            // console.log(initPos);
            // if (pos.left > initPos.left) {
            //     $(evt.target).css('left', 0);
            // }
            // if (pos.top > initPos.top) {
            //     $(evt.target).css('top', 0);
            // }
        }
    });

    $compositionPanel.append($('<div>', {
        id: 'composition-scrollbox',
    }).append($loader));


    // Add the trash can functionality
    let $trash = $('<div>', {class: 'trash'}).append(
        $('<img>', {
            src: `${STATIC_URL}/compose/trash.svg`,
        })
    ).droppable({
        tolerance: 'pointer',
        drop: (_evt, ui) => {
            let value = $(ui.draggable).data('uuid');
            if (value) {
                $(ui.draggable).remove();
                globals.stateManager.removeAll(value);
            }
        },
        // Indicate that it's about to be deleted
        over: (_evt, ui) => {
            let value = $(ui.draggable).data('uuid');
            if (value) {
                $(ui.helper).addClass('removing');
                $(ui.helper).css('opacity', '25%');
            }
        },
        out: (_evt, ui) => {
            $(ui.helper).removeClass('removing');
            $(ui.helper).css('opacity', '100%');
        }
    }); 

    $compositionPanel.append($trash);

    return $compositionPanel;
}
