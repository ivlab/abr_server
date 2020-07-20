/* RenderingStrategy.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Blocks that specifically pertain to a Rendering Strategy
 */

import { PuzzleSocket, Swatch, PuzzleConnector } from './Blocks.js'
import { NumericInput, NumericInputSwatch } from './SourceBlocks.js'
import { sendInputUpdate, sendRenderStrategyUpdate } from '../MessageUtils.js'
import { uuid } from '../UUID.js'
import { messenger } from '../AbrMessenger.js';

// Generate a list of artifacts and variables from a render strategy
function generateParameters(inputs, varTypes, artifactTypes) {
    // Convert each input of the rendering strategy into a map
    // (parameterName -> {parameterData...})
    let variables = {};
    let artifacts = {};
    inputs.forEach((input) => {
        let paramName = input.parameterName;
        if (varTypes.indexOf(input.inputType) >= 0) {
            variables[paramName] = input;
        } else if (artifactTypes.indexOf(input.inputType) >= 0) {
            artifacts[paramName] = input;
        }
    });

    // Display the parameters in the order that we find them in the header
    // (which is the order in the ABR Engine code)
    let parameterNames = new Set();
    inputs.forEach((input) => {
        parameterNames.add(input.parameterName);
    });

    // Get a list of all unique names
    let parameters = {};
    for (const name of parameterNames) {
        parameters[name] = {'variable': variables[name], 'artifact': artifacts[name]};
    }

    return parameters;
}

export function swapConnectionUUIDs(oldUUID, newUUID, rsData) {
    let connections = rsData.connections;
    for (var param in connections) {
        if (connections[param] == oldUUID) {
            connections[param] = newUUID;
        }
    }
    rsData.connections = connections;
    return rsData;
}

// The draggable block for a rendering strategy
// `existing` fields allow us to instantiate an RS that is already on the
// page (useful for state refreshes)
export function RenderingStrategy(
    name,
    inputs,
    topology,
    type,
    existingUUID,
    existingKeydataUUID,
    existingConnections,
    uiMetadata,
    label,
    header,
) {
    let parameters = generateParameters(inputs, header.variableTypes, header.artifactTypes);
    let connectionMap;
    if (!existingConnections) {
        connectionMap = {};
        for (const p in parameters) {
            // Get the connection socket name and initialize to null
            if (parameters[p].variable) {
                connectionMap[parameters[p].variable[0]] = null;
            }
            if (parameters[p].artifact) {
                connectionMap[parameters[p].artifact[0]] = null;
            }
        }
    } else {
        connectionMap = existingConnections;
    }

    let hidden;
    if (uiMetadata && uiMetadata.hasOwnProperty('hidden')) {
        hidden = uiMetadata.hidden;
    } else {
        hidden = false;
    }

    label = label || name;
    let $baseBlock = $('<div>', {
        class: 'rendering-strategy',
    }).append(
        $('<div>', {class: 'block-title'}).append(
            $('<div>', {
                text: label,
                css: {cursor: 'pointer'},
            }).on('click', (evt) => {
                if ($(evt.target).parents('.rendering-strategy').hasClass('noclick')) {
                    $(evt.target).parents('.rendering-strategy').removeClass('noclick');
                    return;
                }
                $('<div>').dialog({
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        "Rename": function() {
                            $rs.data('label', $(this).find('input').val());
                            sendRenderStrategyUpdate($rs);
                            $(this).dialog('close');
                        },
                        "Cancel": function () {
                            $(this).dialog('close');
                        }
                    },
                }).append($('<p>', {
                    text: 'Rename:'
                })).append(
                    $('<input>', {
                        type: 'text',
                        val: label,
                    }).on('keyup', (evt) => {
                        if (evt.key == 'Enter') {
                            $rs.data('label', $(evt.target).val());
                            sendRenderStrategyUpdate($rs);
                            $(evt.target).closest('.ui-dialog-content').dialog('close');
                        }
                    }).attr('tabindex', -1)
                )
            })
        ).append(
            $('<button>', {
                text: hidden ? 'visibility_off' : 'visibility',
                class: 'material-icons'
            }).on('click', (evt) => {
                let $rs = $(evt.target).parents('.rendering-strategy');
                let rsMetadata = $rs.data('uiMetadata');
                if ($(evt.target).text() == 'visibility') {
                    $(evt.target).text('visibility_off');
                    rsMetadata.hidden = true;
                } else if ($(evt.target).text() == 'visibility_off') {
                    $(evt.target).text('visibility');
                    rsMetadata.hidden = false;
                }

                $rs.data('uiMetadata', rsMetadata);
                sendRenderStrategyUpdate($rs);
            })
        )
    ).data({
        label: label,
        topology: topology,
        keydataUUID: existingKeydataUUID,
        connections: connectionMap,
        type: type,
        uuid: existingUUID || uuid(),
        uiMetadata: uiMetadata || {},
    }).draggable();

    // Create the keydata socket
    let $keyDataParameter = $('<div>', { class: 'parameter keydata-parameter' }).append(
        PuzzleConnector(topology, 'keydata-connector', true)
    ).append(
        PuzzleSocket(
            'Key Data',
            'keydata-socket',
            '.keydata',
            ['keydata', 'keydata-connector'],
            ($draggable, $target, $rs) => { // On drop
                let keydataUUID = $draggable.data('uuid');
                $rs.data('keydataUUID', keydataUUID);
                // Set the RS label to match key data, if it's still the default
                if ($rs.data('label') == name) {
                    $rs.data('label', $draggable.data('label'));
                }
                return $rs;
            },
            ($draggable, $target, $rs) => { // On out
                $rs.data('keydataUUID', null);
                return $rs;
            }
        )
    ).append(
        $('<img>', {
            class: 'rendering-strategy-preview',
            src: `${STATIC_URL}composition/rendering_strategy_preview/${name}.png`,
        })
    );

    $baseBlock.append($keyDataParameter);

    let expanded;
    if (uiMetadata && uiMetadata.hasOwnProperty('expanded')) {
        expanded = uiMetadata.expanded;
    } else {
        expanded = true;
    }

    $baseBlock.append(
        $('<span>').append(
            $('<button>', {
                class: 'parameter-expander' + (expanded ? ' expanded' : ''),
                html: expanded ? '&wedgeq;' : '&ctdot;',
                title: expanded ? 'Show Less' : 'Show More',
            }).on('click', (evt) => {
                $(evt.target).toggleClass('expanded');
                let $rs = $(evt.target).parents('.rendering-strategy');
                let rsMetadata = $rs.data('uiMetadata');

                if ($(evt.target).hasClass('expanded')) {
                    $(evt.target).html('&wedgeq;');
                    rsMetadata.expanded = true;
                    $(evt.target).parents('.rendering-strategy')
                        .find('.parameter-list')
                        .css('display', 'block');
                } else {
                    rsMetadata.expanded = false;
                    $(evt.target).html('&ctdot;');
                    $(evt.target).parents('.rendering-strategy')
                        .find('.parameter-list')
                        .css('display', 'none');
                }
                $rs.data('uiMetadata', rsMetadata);

                sendRenderStrategyUpdate($rs);
            })
        )
    );

    let $parameters = $('<div>', { class: 'parameter-list' });
    for (const p in parameters) {
        let advanced = true;
        for (const input in parameters[p]) {
            if (parameters[p][input]) {
                advanced = advanced && parameters[p][input].advancedOnly;
            }
        }
        if (!advanced) {
            $parameters.append(RenderingStrategyParameter(p, parameters[p]));
        }
    }

    if (!expanded) {
        $parameters.css('display', 'none');
    }

    $baseBlock.append($parameters);
    let $rs = RenderStrategyUpdateOnDrag($baseBlock);

    // Move to the proper position
    if (uiMetadata && uiMetadata.hasOwnProperty('position')) {
        // Make sure the RS is within the bounds of the composition loader
        let pos = uiMetadata.position;
        pos.left = pos.left < 0 ? 0 : pos.left;
        pos.top = pos.top < 0 ? 0 : pos.top;

        $rs.css('position', 'absolute');
        $rs.css('top', pos.top);
        $rs.css('left', pos.left);
    }

    return $rs;
}

// Rendering strategy block in the sidebar
export function RenderingStrategySwatch(name, parameters, topology, type, header) {
    let $swatch = Swatch(
        RenderingStrategy,
        [name, parameters, topology, type, undefined, undefined, undefined, undefined, undefined, header],
        true,
        true,
        $('#composition-loader'), // Instantiated rendering Strategies should be place in the composition loading container
        false, // Don't trigger the RS's actual stop handler, only the swatch one
    );

    // Remove everything other than the title and preview image
    $swatch.find('input').attr('readonly', true);
    $swatch.find('.block-title button').remove();
    $swatch.children('.parameter-list').empty();
    $swatch.children('.parameter').remove();
    $swatch.find('.parameter-expander').parent().remove();
    $swatch.append(
        $('<img>', {
            class: 'rendering-strategy-preview',
            src: `${STATIC_URL}composition/rendering_strategy_preview/${name}.png`,
        })
    );
    return $swatch;
}

// A parameter (a row of a rendering strategy)
// Parameters take two inputs (a variable and an artifact)
export function RenderingStrategyParameter(parameterName, parameterData) {
    let $parameter = $('<div>', {
        class: 'parameter',
    });
    let variable = parameterData.variable;
    let artifact = parameterData.artifact;

    let onDrop = ($draggable, $target, $rs) => { // On drop
        let socketName = $target.data('socketName');
        let connections = $rs.data('connections');
        connections[socketName] = $draggable.data('uuid');
        $rs.data('connections', connections);
        return $rs;
    };
    let onOut = ($draggable, $target, $rs) => { // On out
        // If it's a singleton to discard (i.e. remapped vars or numeric
        // inputs), then tell the engine to delete it
        if ($draggable.hasClass('singleton-discard')) {
            messenger.sendUpdate({
                type: 'DeleteNode',
                uuid: $draggable.data('uuid'),
                deleteVisAsset: false,
            });
        }
        let socketName = $target.data('socketName');
        let connections = $rs.data('connections');
        connections[socketName] = null;
        $rs.data('connections', connections);
        return $rs;
    };

    // Add the variable socket
    if (variable && !variable.advancedOnly) {
        $parameter.append(
            $('<div>', { class: 'parameter-input' }).append(
                PuzzleConnector(variable.inputType, '', true)
            )
        );

        $parameter.append(
            PuzzleSocket(
                variable.inputName + ` [${variable.defaultText}]`,
                'left-socket',
                '.variable',
                ['variable', ''],
                onDrop,
                onOut,
            ).data({
                socketName: variable.inputName,
                socketType: variable.inputType,
            }).attr('title', variable.tooltipText)
        );
    }

    $parameter.append(
        $('<p>', { class: 'parameter-title', text: `${parameterName}` })
    );

    // Add the artifact socket
    if (artifact && !artifact.advancedOnly) {
        $parameter.append(
            $('<div>', { class: 'parameter-input' }).append(
                PuzzleConnector(artifact.inputType, '', true)
            )
        );

        let $artifactSocket = PuzzleSocket(
            artifact.inputName + ` [${artifact.defaultText}]`,
            'right-socket',
            '.artifact',
            ['artifact', '', true],
            onDrop,
            onOut,
            '-1.2rem', // Adjust left for the width of the puzzle connector
        ).data({
            socketName: artifact.inputName,
            socketType: artifact.inputType,
        }).attr('title', artifact.tooltipText);

        // Hack to allow creation of numeric/checkbox inputs
        if (artifact.inputType == 'RealNumber' || artifact.inputType == 'Checkbox') {
            let socketName = $artifactSocket.data('socketName');
            $artifactSocket.css('cursor', 'pointer');
            let oldTitle = $artifactSocket.attr('title');
            $artifactSocket.attr('title', `${oldTitle} (Click to create numeric input)`)
            $artifactSocket.on('click', (evt) => {
                // Only create numeric input if one isn't already there
                if ($artifactSocket.find('.block').length == 0) {
                    let nodeData;
                    if (artifact.inputType == 'RealNumber') {
                        let defaultValue = parseFloat(artifact.defaultText);
                        nodeData = {
                            label: socketName,
                            uuid: uuid(),
                            type: artifact.inputType,
                            floatVal: defaultValue / 100.0, // Use as percentage
                            inputs: {},
                        };
                    } else if (artifact.inputType == 'Checkbox') {
                        let defaultValue = artifact.defaultText === 'true';
                        nodeData = {
                            label: socketName,
                            uuid: uuid(),
                            type: artifact.inputType,
                            boolVal: defaultValue,
                            inputs: {},
                        };
                    }
                    let $block = NumericInput(
                        nodeData,
                        true,
                    );

                    // Put it in the list in the design palette
                    $('#numeric-input-list').append(NumericInputSwatch($block));
                    sendInputUpdate($block.data());

                    // Put it in the render strategy
                    $artifactSocket.append($block);
                    let $rs = $(evt.target).parents('.rendering-strategy');
                    let connections = $rs.data('connections');
                    connections[socketName] = $block.data('uuid');
                    $rs.data('connections', connections);
                    sendRenderStrategyUpdate($rs);
                }
            });
        }

        $parameter.append(
            $artifactSocket
        );
    }

    return $parameter;
}

// Rendering strategy draggable that sends and ABR update whenever it stops being
// dragged
export function RenderStrategyUpdateOnDrag($instance) {
    return $instance.draggable({
        start: (evt, _ui) => {
            $(evt.target).addClass('noclick'); //https://stackoverflow.com/a/2526029 
        },
        stop: (evt, _ui) => {
            let uiMetadata = $(evt.target).data('uiMetadata');
            uiMetadata.position = $(evt.target).position();
            $(evt.target).data('uiMetadata', uiMetadata);
            sendRenderStrategyUpdate($(evt.target));
        }
    })
}