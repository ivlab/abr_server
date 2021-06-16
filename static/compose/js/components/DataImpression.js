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
    let $tower = $('<div>', {
        class: 'data-impression-tower rounded',
    });
    $element.append($tower);

    let $composition = $('#' + COMPOSITION_LOADER_ID);
    let position = {
        top: $composition.css('left'),
        left: $composition.css('top'),
    }
    if (impressionData && impressionData.position) {
        position = impressionData.position;
    }
    $element.css({
        position: 'absolute',
        top: position.top,
        left: position.left,
    });

    let collapsed = false;
    if (impressionData && impressionData.collapsed) {
        collapsed = true;
    }

    $element.append($('<div>', {
        class: 'data-impression-header rounded-top',
    }).css({ cursor: 'grabbing'}).append(
        $('<p>', { text: name, })
    ).append(
        $('<button>', {
            class: 'rounded',
            html: collapsed ? '+' : '&ndash;',
            title: collapsed ? 'Show More' : 'Show Less'
        }).on('click', (evt) => {
            globals.stateManager.update(`/uiData/compose/impressionData/${uuid}/collapsed`, !collapsed);
        })
    ));

    let inputValues = null;
    if (globals.stateManager.state && globals.stateManager.state.impressions)
    {
        if (globals.stateManager.state.impressions[uuid]) {
            inputValues = globals.stateManager.state.impressions[uuid].inputValues;
        }
    }

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

    $element.append(DataImpressionSummary(uuid, name, impressionData, inputValues, parameterMapping));

    let $parameterList = $('<div>', {
        class: 'parameter-list',
    });

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
        $parameterList.append($param);
    }

    if (!collapsed) {
        $element.append($parameterList);
    }

    // Only need to update the UI position when dragging, not the whole impression
    $element.draggable({
        handle: '.data-impression-header',
        drag: (evt, ui) => {
            evt.stopPropagation();
        },
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
    $dropZone.addClass('drop-zone');

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
            let impressionState;
            if (globals.stateManager.state['impressions'] && globals.stateManager.state['impressions'][impressionId]) {
                impressionState = globals.stateManager.state['impressions'][impressionId];
            }
            let inputState;
            if (impressionState && impressionState.inputValues && impressionState.inputValues[inputName]) {
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
        $('<div>', { class: "parameter-label" }).append(
            $('<p>', { text: parameterName })
        )
    );
}

function DataImpressionSummary(uuid, name, impressionData, inputValues, parameterMapping) {
    let oldVisibility = true;
    if (globals.stateManager.state.impressions && globals.stateManager.state.impressions[uuid]) {
        if (globals.stateManager.state.impressions[uuid].renderHints) {
            oldVisibility = globals.stateManager.state.impressions[uuid].renderHints.Visible;
        }
    }
    let $el = $('<div>', {
        class: 'data-impression-summary rounded-bottom'
    }).append(
        $('<div>', { class: 'impression-controls' }).append(
            $('<button>', {
                class: 'material-icons rounded',
                text: oldVisibility ? 'visibility' : 'visibility_off',
                title: oldVisibility ? 'This data impression is visible' : 'This data impression is not shown',
            }).on('click', (evt) => {
                globals.stateManager.update(`/impressions/${uuid}/renderHints/Visible`, !oldVisibility);
            })
        ).append(
            $('<button>', {
                class: 'material-icons rounded',
                text: 'edit',
                title: 'Rename data impression'
            }).on('click', (evt) => {
                let newName = prompt('Rename data impression:', name);
                globals.stateManager.update(`/impressions/${uuid}/name`, newName);
            })
        )
    );

    if (impressionData && impressionData.collapsed) {
        $el.append($('<hr>'))
        let $props = $('<div>', {
            class: 'summary-properties parameter'
        });
        for (const parameter in parameterMapping) {
            for (const inputName of parameterMapping[parameter]) {
                if (inputValues && inputValues[inputName]) {
                    // Display a non-editable version of the piece in the summary block
                    let $input = AssignedInputPuzzlePiece(inputName, inputValues[inputName]);
                    $input.css('position', 'relative');
                    $input.css('height', '2rem');
                    $input.off('click');
                    if ($input.hasClass('ui-draggable')) {
                        $input.draggable('destroy');
                    }

                    // Special case for primitive inputs
                    let textInput = $input.find('input');
                    let inputVal = textInput.val();
                    if (inputVal) {
                        textInput.remove();
                        let text = $input.find('.puzzle-label').text();
                        $input.find('.puzzle-label').text(`${text}: ${inputVal}`);
                    }
                    $input.removeClass('hover-bright');
                    $props.append($input);
                }
            }
        }
        $el.append($props);
    }

    return $el;
}