/* Primitives.js
 *
 * Primitive inputs such as length, angle, percent, etc.
 *
 * Copyright (C) 2021, University of Minnesota
 * Authors: Bridger Herman <herma582@umn.edu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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