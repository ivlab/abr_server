/* components/Plate.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Construct a representation of a "Plate" for ABR. Instantiated into a data
 * impression When dragged into the composition panel.
 */

import { COMPOSITION_LOADER_ID } from "./CompositionPanel.js";
import { DataImpression } from "./DataImpression.js";
import { uuid } from '../../../common/UUID.js'

export function Plate(plateType) {
    let $plate = $('<div>', {
        class: 'plate rounded',
    }).data({
        plateType: plateType,
    });

    $plate.append($('<div>', {
        class: 'plate-header rounded',
    }).append($('<p>', {
        class: 'plate-label',
        text: plateType,
    })));

    $plate.append($('<img>', {
        class: 'plate-thumbnail',
        src: `${STATIC_URL}compose/plate_thumbnail/${plateType}.png`,
    }));


    $plate.draggable({
        helper: 'clone',
        stop: (evt, ui) => {
            let $composition = $('#' + COMPOSITION_LOADER_ID);
            let pos = ui.helper.position();
            let compTop = $composition.position().top;
            let compLeft = $composition.position().left;
            pos.left = pos.left - compLeft;
            pos.top = pos.top - compTop;

            // Instantiate a new data impression in the UI
            let $instance = DataImpression(plateType, uuid(), plateType, {
                position: pos,
            });
            $instance.css('position', 'absolute');
            $instance.css('top', pos.top);
            $instance.css('left', pos.left);

            $instance.appendTo($composition);
        }
    });

    return $plate;
}