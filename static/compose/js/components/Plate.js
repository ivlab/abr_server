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
import { uuid } from '../../../common/UUID.js';
import { globals } from '../../../common/globals.js';

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
            pos.left -= $composition.position().left;
            pos.top -= $composition.position().top;

            // Instantiate a new data impression in the UI
            let imprId = uuid();
            let $instance = DataImpression(plateType, imprId, plateType, {
                position: pos,
            });

            $instance.appendTo($composition);

            let impression = {
                plateType,
                uuid: imprId,
                name: globals.schema.definitions?.Impression?.properties?.name?.default ?? "Data Impression",
            };
            globals.stateManager.update('impressions/' + imprId, impression);
            globals.stateManager.update('uiData/compose/impressionData/' + imprId + '/position', pos);
        }
    });

    return $plate;
}