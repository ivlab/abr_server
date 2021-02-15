/* DataImpression.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Instantiated form of a Plate, contains inputs that can be changed by an artist
 */

import { globals } from "../../../common/globals.js";
import { COMPOSITION_LOADER_ID } from '../components/Components.js';
import { PuzzlePiece } from "./PuzzlePiece.js";

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

    let plateSchema = globals.schema.definitions.Plates[plateType].properties;

    // Separate out all the inputs into their individual parameters
    let parameterMapping = {};
    for (const inputName in plateSchema) {
        let parameterName = plateSchema[inputName].properties.parameterName.const;
        if (parameterName in parameterMapping) {
            parameterMapping[parameterName].push(inputName);
        } else {
            parameterMapping[parameterName] = [inputName];
        }
    }

    // Add a new row of inputs for each parameter
    for (const parameter in parameterMapping) {
        let $param = Parameter(parameter);
        for (const inputName of parameterMapping[parameter]) {
            $param.append(InputSocket(inputName, plateSchema[inputName].properties));
        }
        $element.append($param);
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

function InputSocket(inputName, inputProps) {
    let leftConnector = inputProps.inputGenre.const == 'VisAsset';
    let addClasses = inputProps.inputGenre.const == 'KeyData' ? 'keydata' : '';
    let $socket;
    if (inputProps.inputGenre.const != 'Primitive') {
        $socket = PuzzlePiece(inputName, inputProps.inputType.const, leftConnector, addClasses);
    } else {
        $socket = $('<p>', {text: inputName});
    }
    return $socket;
}

function Parameter(parameterName) {
    return $('<div>', { class: 'parameter' }).append(
        $('<p>', { class: "parameter-label", text: parameterName})
    );
}