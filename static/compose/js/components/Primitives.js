/* Primitives.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Primitive inputs such as length, angle, percent, etc.
 */

import { globals } from "../../../common/globals.js";

export function PrimitiveInput(inputName, shortInputName, resolvedProps) {
    let $el = $('<div>', {
        class: 'puzzle-label rounded',
    });
    $el.append($('<p>', {
        class: 'primitive-name',
        text: shortInputName,
    }));
    let $input = $('<input>', {
        class: 'primitive-input',
        type: 'text',
        val: resolvedProps.inputValue
    }).on('change', (evt) => {
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
        if (impressionState && impressionState.inputValues && impressionState.inputValues[inputName]) {
            inputState = impressionState.inputValues[inputName];
        } else {
            inputState = defaultInputs;
        }

        // Assign the new input
        let oldInputValue = inputState['inputValue'];
        inputState['inputValue'] = $(evt.target).val();

        // Send the update to the server
        globals.stateManager.update(`impressions/${impressionId}/inputValues/${inputName}`, inputState).then(() => {
            $(evt.target).attr('disabled', false);
        }).catch((err) => {
            alert(`'${inputState['inputValue']}' is not valid for type ${resolvedProps.inputType}.`)
            globals.stateManager.refreshState();
        });
        
        // Temporarily disable until we've heard back from the server
        $(evt.target).attr('disabled', true);
    });

    $el.append($input);
    let $container = $('<div>', { class: 'puzzle-piece rounded' });
    $container.append($el);
    return $container;
}