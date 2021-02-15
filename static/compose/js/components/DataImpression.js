/* DataImpression.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Instantiated form of a Plate, contains inputs that can be changed by an artist
 */

import { globals } from "../../../common/globals.js";

export function DataImpression(plateType, uuid, name, impressionData) {
    let $element = $('<div>', { class: 'data-impression rounded' })
        .data({ uuid });

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

    $element.draggable({
        handle: '.data-impression-header'
    });

    return $element;
}

export function InputSocket(inputName, inputType, parameterName, inputGenre, inputValue) {

}

function Parameter(propName, prop) {
    return $('<p>', {text:propName});
}