/* DataImpression.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Instantiated form of a Plate, contains inputs that can be changed by an artist
 */

import { globals } from "../../../common/globals.js";
import { CACHE_UPDATE } from '../../../common/StateManager.js';
import { COMPOSITION_LOADER_ID } from '../components/Components.js';
import { InputPuzzlePiece, AssignedInputPuzzlePiece } from "./PuzzlePiece.js";

export function DataImpression(plateType, uuid, name, impressionData) {
    let $element = $('<div>', { class: 'data-impression rounded' })
        .data({
            uuid,
            plateType,
        });

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

    let inputValues = null;
    if (globals.stateManager.state?.impressions)
    {
        inputValues = globals.stateManager.state.impressions[uuid]?.inputValues;
    }

    // Add a new row of inputs for each parameter
    for (const parameter in parameterMapping) {
        let $param = Parameter(parameter);
        // Construct each input, and overlay the value puzzle piece if it exists
        for (const inputName of parameterMapping[parameter]) {
            let $socket = InputSocket(inputName, plateSchema[inputName].properties);
            if (inputValues && inputValues[inputName]) {
                let $input = AssignedInputPuzzlePiece(inputName, inputValues[inputName]);
                $input.appendTo($socket);

                // Prime the input to be reloaded and replaced when visassets
                // get updated
                globals.stateManager.subscribeCache('visassets', $socket);
                $socket.on(CACHE_UPDATE + 'visassets', (evt) => {
                    evt.stopPropagation();
                    let $reloaded = AssignedInputPuzzlePiece(inputName, inputValues[inputName]);
                    $input.replaceWith($reloaded);
                });
            }
            $param.append($socket);
        }
        $element.append($param);
    }

    // Only need to update the UI position when dragging, not the whole impression
    $element.draggable({
        handle: '.data-impression-header',
        stop: (evt, ui) => {
            // If we're not hovering over the trash, send the update
            if (!$(ui.helper).hasClass('removing')) {
                let pos = ui.helper.position();
                let imprId = $(evt.target).data('uuid');
                globals.stateManager.update('uiData/compose/impressionData/' + imprId + '/position', pos);
            }
        }
    });

    return $element;
}

// A socket that can be dropped into
function InputSocket(inputName, inputProps) {
    let $socket = $('<div>', {
        class: 'input-socket',
    });
    // It's an input, but we can't drag it
    let $dropZone = InputPuzzlePiece(inputName, inputProps);

    $dropZone.droppable({
        drop: (evt, ui) => {
            // Get the impression that this input is a part of
            let $impression = $(evt.target).closest('.data-impression');
            let impressionId = $impression.data('uuid');
            let plateType = $impression.data('plateType');

            // Get the default values for this input, in case there's nothing
            // there already
            let defaultInputsSchema = globals.schema.definitions.Plates[plateType].properties[inputName].properties;
            let defaultInputs = {};
            for (const p in defaultInputsSchema) {
                defaultInputs[p] = defaultInputsSchema[p].const;
            }

            // See if there's an input there already, if not assign the defaults
            let impressionState = globals.stateManager.state['impressions'][impressionId];
            let inputState;
            if (impressionState?.inputValues && impressionState?.inputValues[inputName]) {
                inputState = impressionState.inputValues[inputName];
            } else {
                inputState = defaultInputs;
            }

            // Ensure the dropped type matches the actual type
            let droppedType = ui.draggable.data('inputType');
            if (droppedType == inputProps.inputType.const) {
                // Update the inputState
                let droppedValue = ui.draggable.data('inputValue');
                inputState['inputValue'] = droppedValue;

                // Send the update to the server
                globals.stateManager.update(`impressions/${impressionId}/inputValues/${inputName}`, inputState);
                
                // Append a temp version that will be replaced when we get an
                // update back from the server
                let $tmp = ui.draggable.clone();
                $tmp.addClass('tentative');
                $tmp.css('position', 'absolute');
                $tmp.css('top', 0);
                $tmp.css('left', 0);
                $tmp.appendTo($socket);
            }
        }
    });

    $socket.append($dropZone);

    return $socket;
}

function Parameter(parameterName) {
    return $('<div>', { class: 'parameter' }).append(
        $('<p>', { class: "parameter-label", text: parameterName})
    );
}