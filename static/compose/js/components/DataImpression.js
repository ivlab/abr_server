/* DataImpression.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Instantiated form of a Plate, contains inputs that can be changed by an artist
 */

import { globals } from "../../../common/globals.js";
import { COMPOSITION_LOADER_ID } from '../components/Components.js';

export function DataImpression(plateType, uuid, name, impressionData) {
    let $element = $('<div>', { class: 'data-impression rounded' })
        .data({ uuid });

    let $composition = $('#' + COMPOSITION_LOADER_ID);
    $element.css({
        position: 'absolute',
        top: impressionData?.position?.top ?? $composition.css('left'),
        left: impressionData?.position?.left ?? $composition.css('top'),
    });

    $element.append($('<div>', {
        class: 'data-impression-header rounded',
    }).css({ cursor: 'grabbing'}).append($('<p>', {
        text: name,
    })));

    // $element.append($('<img>', {
    //     class: 'plate-thumbnail',
    //     src: `${STATIC_URL}compose/plate_thumbnail/${plateType}.png`,
    // }));

    let plateSchema = globals.schema.definitions.Plates[plateType];
    for (const propName in plateSchema.properties) {
        $element.append(Parameter(propName, plateSchema.properties[propName]));
    }

    // Only need to update the UI position when dragging, not the whole impression
    $element.draggable({
        handle: '.data-impression-header',
        stop: (evt, ui) => {
            let pos = ui.helper.position();
            let imprId = $(evt.target).data('uuid');
            globals.stateManager.update('uiData/compose/impressionData/' + imprId + '/position', pos);
        }
    });

    return $element;
}

export function InputSocket(inputName, inputType, parameterName, inputGenre, inputValue) {

}

function Parameter(propName, prop) {
    return $('<p>', {text:propName});
}