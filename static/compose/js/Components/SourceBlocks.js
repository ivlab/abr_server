/* SourceBlocks.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Blocks that stand in for a variable or artifact, but are directly
 * controllable by the user
 */

import { PuzzleLabel, Swatch, PuzzleConnector, RemappedPuzzleSwatch } from './Blocks.js'
import { DataRemappingSlider } from './Inputs.js'
import { sendInputUpdate } from '../MessageUtils.js'
import { messenger } from '../AbrMessenger.js';
import { storage } from '../storage.js';

// Numeric input block
export function NumericInput(nodeData) {
    // Source block has similar attributes to an artifact
    let $block = $('<div>', {
        class: `block puzzle-piece artifact numeric-input singleton-discard`,
    }).data(nodeData).draggable();

    let $connector = PuzzleConnector(nodeData.type);

    // Allow user to change the name of this block
    $block.append($connector);

    let inputParameters;
    let keydownCallback;
    let refreshButtonCallback;
    let onchangeCallback;
    if (nodeData.type == 'RealNumber') {
        inputParameters = {
            type: 'number',
            step: '0.1',
            value: nodeData.floatVal * 100, // Use as percentage
        };
        keydownCallback = (evt) => {
            if (evt.key == 'Enter') {
                let value = parseFloat($(evt.target).val());
                $block.data('floatVal', value / 100.0); // Use as percentage
                sendInputUpdate($block.data());
                $(evt.target).parents('.puzzle-piece-input').find('button.refresh-button').attr('disabled', true);
            }
        };
        refreshButtonCallback = (evt) => {
            if ($(evt.target).hasClass('refresh-button')) {
                let value = parseFloat($(evt.target).parents('.puzzle-piece-input').find('input').val());
                $block.data('floatVal', value / 100.0); // Use as percentage
                sendInputUpdate($block.data());
                $(evt.target).attr('disabled', true);
            }
        };
    } else if (nodeData.type == 'Checkbox') {
        inputParameters = {
            type: 'checkbox',
            checked: nodeData.boolVal,
        };
        keydownCallback = (evt) => {
            if (evt.key == 'Enter') {
                let value = $(evt.target).is(':checked');
                $block.data('boolVal', value);
                sendInputUpdate($block.data());
                $(evt.target).parents('.puzzle-piece-input').find('button.refresh-button').attr('disabled', true);
            }
        };
        refreshButtonCallback = (evt) => {
            if ($(evt.target).hasClass('refresh-button')) {
                let value = $(evt.target).parents('.puzzle-piece-input').find('input').is(':checked');
                $block.data('boolVal', value);
                sendInputUpdate($block.data());
                $(evt.target).attr('disabled', true);
            }
        };
        onchangeCallback = (evt) => {
            let value = $(evt.target).parents('.puzzle-piece-input').find('input').is(':checked');
            $block.data('boolVal', value);
            sendInputUpdate($block.data());
            $(evt.target).parents('.puzzle-piece-input').find('button.refresh-button').attr('disabled', true);
        }
    }

    let $input = $('<input>', inputParameters).on('input', (evt) => {
                    $(evt.target).parents('.puzzle-piece-input').find('button.refresh-button').attr('disabled', false);
                }).on('keydown', keydownCallback)
                .on('change', onchangeCallback);

    $block.append(
        $('<div>', {class: 'puzzle-piece-input'}).append(
            nodeData.type == 'RealNumber' ? $('<div>', {class: 'inline'}).append($input).append($('<span>', {text: '%'})) : $input,
        ).append(
            $('<button>', {
                class: 'refresh-button material-icons',
                html: 'sync', // Refresh button
                disabled: true,
            }).on('click', refreshButtonCallback)
        )
    )

    return $block;
}

// Version of the key data block that sits in the palette
export function NumericInputSwatch(nodeData) {
    let a = Swatch(
        NumericInput,
        [nodeData],
    );

    return a;
}

export function ScalarRemapper(scalarData, remapperData) {
    let origLabel = scalarData.label;
    let $remapper = $('<div>', {
        class: 'remapper scalar-remapper',
    }).append(
        $('<h3>', {text: `Remapping for ${origLabel}`})
    );
    $remapper.data(remapperData);

    let userLabelList = [];
    let state = storage.cachedState;
    for (const rs of state.compositionNodes) {
        // https://stackoverflow.com/a/9907887
        let inputName = Object.keys(rs.connections)
            .find(key => rs.connections[key] === remapperData.uuid);

        if (inputName) {
            userLabelList.push(`${rs.label} (${inputName})`);
        }
    }

    let $users = $('<ul>');
    if (userLabelList.length > 0) {
        for (const user of userLabelList) {
            $users.append($('<li>', {text: user}));
        }
    } else {
        $users.append($('<p>', {text: '[None]'}))
    }

    $remapper.append(
        DataRemappingSlider(
            scalarData.minValue,
            scalarData.maxValue,
            remapperData.minValue,
            remapperData.maxValue,
            (evt, ui) => {
                // Send an update when a remapping operation is finished
                $remapper.data('minValue', ui.values[0]);
                $remapper.data('maxValue', ui.values[1]);
                sendInputUpdate($remapper.data());
            },
            (evt) => {
                if ($(evt.target).is('.min-max-box:nth-child(1)')) {
                    $remapper.data('minValue', parseFloat($(evt.target).val()));
                    sendInputUpdate($remapper.data());
                } else if ($(evt.target).is('.min-max-box:nth-child(2)')) {
                    $remapper.data('maxValue', parseFloat($(evt.target).val()));
                    sendInputUpdate($remapper.data());
                }
            }
        )
    ).append(
        RemappedPuzzleSwatch(remapperData)
    ).append(
        $('<p>', {text: 'Users:'})
    ).append(
        $users
    ).append(
        $('<button>', {
            text: 'delete_forever',
            class: 'centered material-icons',
            title: 'Delete this remapper',
        }).on('click', (evt) => {
            messenger.sendUpdate({
                type: 'DeleteNode',
                uuid: remapperData.uuid,
                deleteVisAsset: false,
            });
            $remapper.remove();
        })
    );
    return $remapper;
}
