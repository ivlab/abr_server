/* Blocks.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Puzzle-piece blocks and their corresponding sockets and swatches
 *  - Socket: what puzzle piece blocks get dragged and dropped into
 *  - Swatch: instance of puzzle piece that exists in the palette (to be dragged
 *            into the composition panel)
 */

import { sendRenderStrategyUpdate, sendInputUpdate, sendRenderStrategyUpdateData } from '../MessageUtils.js'
import { storage } from '../storage.js';
import { uuid as generateUUID } from '../UUID.js';
import { swapConnectionUUIDs } from './RenderingStrategy.js';

function doubleClickToRemap(evt) {
    $('#thumbnail-tooltip').css('visibility', 'hidden');
    let $rs = $(evt.target).parents('.rendering-strategy');
    let rsData = $rs.data();
    let dataLabel = '';
    if ($rs.length > 0) {
        // Find the key data
        let keydataUUID = rsData.keydataUUID;
        let keydata = storage.cachedState.header.availableData.keyData.find((d) => d.uuid == keydataUUID)
        if (keydataUUID && keydata) {
            dataLabel += `&data-label=${keydata.label}`;
        }

        // Find the variable
        // Assume that if we're double-clicking to open, it's a colormap
        let colorVariableSocket = 'Color Variable';
        let colorVariableUUID = rsData.connections[colorVariableSocket];
        if (colorVariableUUID) {
            let scalarData = storage.cachedState.header.availableData.scalarVariables.find((s) => s.uuid == colorVariableUUID);
            let remappedData = storage.cachedState.rangedScalars.find((v) => v.uuid == colorVariableUUID);
            if (typeof(scalarData) !== 'undefined') {
                // Create a remapped version of it
                let remappedUUID = generateUUID();
                let newRemappedData = {
                    uuid: remappedUUID,
                    type: 'RangedScalarDataVariable',
                    label: scalarData.label,
                    minValue: scalarData.minValue,
                    maxValue: scalarData.maxValue,
                    inputs: {
                        InputVariable: scalarData.uuid,
                    },
                };
                // Tell the engine about the newly remapped UUID
                sendInputUpdate(newRemappedData);

                // Update the RS data and send it to the engine
                rsData = swapConnectionUUIDs(colorVariableUUID, remappedUUID, rsData);
                sendRenderStrategyUpdateData(rsData);

                dataLabel += `&variable-info=${encodeURIComponent(JSON.stringify(newRemappedData))}`;
            }
            if (typeof(remappedData) !== 'undefined') {
                // The var is already remapped
                dataLabel += `&variable-info=${encodeURIComponent(JSON.stringify(remappedData))}`;
            }
        }
    }

    let colorMapUUID;
    if ($rs.length > 0) {
        let colorMapSocket = 'Colormap';
        colorMapUUID = rsData.connections[colorMapSocket];
    } else {
        let $puzzlePiece = $(evt.target).parents('.puzzle-piece.artifact');
        if ($puzzlePiece.length > 0) {
            colorMapUUID = $puzzlePiece.data('uuid');
        }
    }

    if (typeof(colorMapUUID) !== 'undefined') {
        // Make a copy of the visasset
        let newUuid = generateUUID();
        $.ajax({
            url: '/api/copy-colormap/',
            type: 'post',
            data: JSON.stringify({'oldUuid': colorMapUUID, 'newUuid': newUuid}),
        })
            .then((msg) => {
                let useNewUuid = msg != 'VisAsset already state specific and copy not forced';
                if (!useNewUuid) {
                    newUuid = colorMapUUID;
                }

                // Add this to a set in storage so that we only refresh the thumbnails that we need to
                let needThumbUpdate = storage.needThumbUpdate || new Set();
                needThumbUpdate.add(newUuid);
                storage.needThumbUpdate = needThumbUpdate;

                // Update the RS data and send it to the engine
                rsData = swapConnectionUUIDs(colorMapUUID, newUuid, rsData);
                sendRenderStrategyUpdateData(rsData);

                let win = window.open(`http://${window.location.host}/scale-editor/?colormap-uuid=${newUuid}${dataLabel}`);
                win.focus();
            })
            .catch((err) => alert('Unable to copy visasset for editing'));
    } else {
        let win = window.open(`http://${window.location.host}/scale-editor/${dataLabel}`);
        win.focus();
    }
}

// A connector for a puzzle piece
export function PuzzleConnector(type, addClasses='', background=false) {
    let backgroundClass = background ? 'background' : 'foreground-contrast';
    let $connector = $('<div>', { class: `puzzle-connector ${backgroundClass} ${addClasses}` })
        .css('mask', `url(${STATIC_URL}composition/puzzle_pieces/${type}.svg)`)
        .css('-webkit-mask', `url(${STATIC_URL}composition/puzzle_pieces/${type}.svg)`);
    return $connector;
}

// Generic swatch from a block. Constructs a block with the given arguments
// when dropped. Optionally, the instantiated blocks can be appended to the
// DOM as a child of a specific jQuery object. If undefined, defaults to
// <body>.
export function Swatch(BlockClass, args, dropAnywhere=false, sendAbrUpdate=false, $appendInstanceTo='body', triggerOldStop=true) {
    let $instance = BlockClass(...args);
    let oldStop = $instance.draggable('option', 'stop');
    return BlockClass(...args)
        .removeClass('block')
        .addClass('swatch')
        .draggable({
            helper: 'clone',
            stop: (evt, ui) => {
                if (oldStop && triggerOldStop) {
                    oldStop(evt, ui);
                }
                // Only clone it if it should be cloned (i.e. not puzzle
                // pieces)
                if (dropAnywhere) {
                    let $composition = $('#composition-loader');
                    let pos = ui.helper.position();
                    let compTop = $composition.position().top;
                    let compLeft = $composition.position().left;
                    pos.left = pos.left - compLeft;
                    pos.top = pos.top - compTop;

                    $instance.css('position', 'absolute');
                    $instance.css('top', pos.top);
                    $instance.css('left', pos.left);

                    let uiMetadata = $instance.data('uiMetadata') || {};
                    uiMetadata.position = pos;

                    $instance.data('uiMetadata', uiMetadata);
                    $instance.appendTo($appendInstanceTo);
                    // Send an AbrUpdate if we need to
                    if (sendAbrUpdate) {
                        sendRenderStrategyUpdate($instance);
                    }
                }

            },
        });
}

// A puzzle piece label
export function PuzzleLabel(name, useHtml=false) {
    if (!useHtml) {
        return $('<div>', { class: 'puzzle-label' }).append($('<p>', { text: name }));
    } else {
        return $('<div>', { class: 'puzzle-label', html: name });
    }
}

// `label`: What text should appear on the socket
// `accept`: What can the socket accept
// `puzzleBlockArgs`: Additional arguments to pass to the puzzle block that
//     will be instantiated when the 'drop' event is fired
// `updateOnDrop`: Callback to update the ABR state with new information
//     once a 'drop' event is fired (takes the UI draggable and a
//     RenderStrategy jquery object, does something with the RS's internal
//     data, and returns the modified RS)
// `updateOnOut`: Same as `updateOnDrop` but is called on 'out' event
export function PuzzleSocket(label, addClasses, accept, puzzleBlockArgs, updateOnDrop, updateOnOut, leftAdjust=0) {
    return $('<div>', {
        class: `socket ${addClasses}`,
    }).append(
        $('<p>', { text: label })
    ).droppable({
        accept: accept,
        tolerance: "touch",
        drop: (evt, ui) => {
            // Clear out the element in case there was anything there before
            $(evt.target).find('.puzzle-piece').remove();

            // Assume that the block will be directly dropped into the
            // socket
            let type = ui.draggable.data('type');
            let $instance = PuzzleBlock(ui.draggable.data(), type, ...puzzleBlockArgs);
            $instance.css('position', 'absolute');
            $instance.css('top', 0);
            $instance.css('left', leftAdjust);

            // Update the RenderStrategy to include the dropped keydata
            let $renderStrategy = $(evt.target).parents('.rendering-strategy');

            // Update the data
            $renderStrategy = updateOnDrop(ui.draggable, $(evt.target), $renderStrategy);

            // Send an update to the ABR engine
            sendRenderStrategyUpdate($renderStrategy);

            // Put the new, instantiated block into the DOM
            $(evt.target).append($instance);
        },
        out: (evt, ui) => {
            // Discard the block as soon as it leaves the socket
            if ($(evt.target).has(ui.draggable).length > 0) {
                // Update the RenderStrategy to include the dropped values
                let $renderStrategy = $(evt.target).parents('.rendering-strategy');

                // Update the data
                $renderStrategy = updateOnOut(ui.draggable, $(evt.target), $renderStrategy);

                // Send an update to the ABR engine
                sendRenderStrategyUpdate($renderStrategy);

                // Remove the element
                $(ui.draggable).remove();

                // Make sure the tooltip thumbnails go away properly
                $('#thumbnail-tooltip').css('visibility', 'hidden');
            }
        }
    });
}

// The draggable block for the palette (data, variable, or artifact)
export function PuzzleBlock(
    nodeData,
    type,
    addClasses,
    addConnectorClasses,
    leftConnector,
    useThumbnail,
    overrideLabel,
) {
    nodeData['type'] = type;
    let $block = $('<div>', {
        class: `block puzzle-piece ${addClasses}`,
    }).data(nodeData).draggable({
        start: (evt, _ui) => {
            // Match the label and type to the sockets that can receive it
            let label = $(evt.target).data('label');
            let type = $(evt.target).data('type');

            // Hack to support ranged scalars
            type = type == 'RangedScalarDataVariable' ? 'IScalarDataVariable' : type;

            // Find what can support this puzzle piece
            let state = storage.cachedState;

            let $rss = $('.rendering-strategy');
            if (state.header.variableTypes.indexOf(type) >= 0) {
                let supportedData = state.header.availableData.keyData.filter((d) => {
                    return d.scalarVariables.concat(d.vectorVariables).indexOf(label) >= 0
                });
                let dataUUIDs = supportedData.map((d) => d.uuid);

                // Find which RS's have these keydata...
                let rsUUIDsWithData = state.compositionNodes
                    .filter((rs) => dataUUIDs.indexOf(rs.keydataUUID) >= 0)
                    .map((rs) => rs.uuid);

                // ... and obtain the corresponding DOM elements
                $rss = $rss.filter((_i, el) => rsUUIDsWithData.indexOf($(el).data('uuid')) >= 0);
            }

            // Lastly, find the sockets that can take this data
            $rss.find('.socket').each((_i, el) => {
                let socketType = $(el).data('socketType');
                if (socketType == type) {
                    $(el).addClass('highlighted');
                }
            })
        },
        stop: (_evt, _ui) => {
            $('.socket').removeClass('highlighted');
        },
    });

    let $label;
    let html = false;
    if (useThumbnail) {
        // Only allow double clicking on colormaps
        $label = ArtifactThumbnail(nodeData.uuid, type == 'IColormap');
        html = true;
    } else if (overrideLabel) {
        $label = overrideLabel;
        html = true;
    } else {
        $label = nodeData.label;
    }

    let $connector = PuzzleConnector(type, addConnectorClasses);
    // If the connector should be on the right, leave the order. Otherwise,
    // make the connector show up to the left of the label
    if (!leftConnector) {
        $block.append(PuzzleLabel($label, html));
        $block.append($connector);
    } else {
        $block.append($connector);
        $block.append(PuzzleLabel($label, html));
    }

    $block.attr('title', nodeData.label);

    return $block;
}

// Version of the key data block that sits in the palette
export function PuzzleSwatch(nodeData, topology, addClasses='', addConnectorClasses='', leftConnector=false, useThumbnail=false, overrideLabel=undefined) {
    let $swatch = Swatch(
        PuzzleBlock,
        [nodeData, topology, addClasses, addConnectorClasses, leftConnector, useThumbnail, overrideLabel],
    );
    return $swatch;
}

// Keydata-related block
export function KeydataBlock(nodeData) {
    return PuzzleBlock(
        nodeData,
        nodeData.topology,
        'keydata',
        'keydata-connector',
        false,
        false,
        $('<p>', {html: `${nodeData.label}<br>`}).append(
            $('<button>', {
                class: 'material-icons solo-button',
                text: 'adjust',
                title: 'Solo all variables associated with this key',
            }).on('click', (evt) => {
                $(evt.target).toggleClass('soloed');
                let soloed = $(evt.target).hasClass('soloed');
                
                let matchFn = (_i, b) => $(b).parents('.keydata').data('label') == nodeData.label;
                // Solo all matching solo buttons and unsolo non-matching
                if (soloed) {
                    $('.solo-button').filter(matchFn).addClass('soloed');
                    $('.solo-button').not(matchFn).removeClass('soloed');
                } else {
                    $('.solo-button').removeClass('soloed');
                }

                let keydataBlock = $(evt.target).parents('.keydata');

                // Find the variables that this keydata supports
                let supportedVarLabels = keydataBlock.data('scalarVariables').concat(keydataBlock.data('vectorVariables'));

                // Select all their corresponding elements
                let supportedVars = $('.puzzle-piece.variable').filter((_i, v) => supportedVarLabels.indexOf($(v).data('label')) >= 0)
                let unsupportedVars = $('.puzzle-piece.variable').filter((_i, v) => supportedVarLabels.indexOf($(v).data('label')) < 0)

                if (soloed) {
                    supportedVars.css('visibility', 'visible');
                    unsupportedVars.css('visibility', 'hidden');
                } else {
                    supportedVars.css('visibility', 'visible');
                    unsupportedVars.css('visibility', 'visible');
                }
            })
        )
    )
}

export function KeydataSwatch(nodeData) {
    return Swatch(KeydataBlock, [nodeData]);
}

export function RemappedPuzzleBlock(nodeData) {
    let origLabel = nodeData.label;
    let labelStr = `${nodeData.minValue.toFixed(2)} - ${nodeData.maxValue.toFixed(2)}`;
    let $overrideLabel = $('<div>', { class: 'outer-align' }).append(
        $('<div>', { class: 'inner-align' }).append(
            $('<p>', { html: `${origLabel}<br>${labelStr}`})
        )
    );

    let $block = PuzzleBlock(
        nodeData,
        nodeData.type,
        'variable singleton-discard',
        '',
        false,
        false,
        $overrideLabel,
    );

    $block.prop('title', `${origLabel}: Double click to remap`);
    $block.on('dblclick', doubleClickToRemap);
    $block.css('cursor', 'pointer');
    return $block;
}

export function RemappedPuzzleSwatch(nodeData) {
    return Swatch(RemappedPuzzleBlock, [nodeData]);
}

// Allow scalar swatches to be clicked to instantiate a new Scalar Remapper
export function ClickableSwatch($swatch, onClick) {
    $swatch.css('cursor', 'pointer');
    let oldTitle = $swatch.attr('title') || '';
    $swatch.attr('title', `${oldTitle} (Click to remap '${$swatch.data('label')}')`);

    $swatch.on('click', onClick);
    return $swatch;
}

// A thumbnail that can get larger when hovered over
export function ArtifactThumbnail(uuid, dblclickToOpen=false) {
    let $tooltip = $('#thumbnail-tooltip');
    let tooltipOffset = 20; // pixels to the upper right of the mouse

    // Only cache-bust the thumbnails that we need to
    let src = `${MEDIA_URL}visassets/${uuid}/thumbnail.png`;
    if (storage.needThumbUpdate && storage.needThumbUpdate.has(uuid)) {
        src += `?${new Date().getTime()}`;
    }

    let $img = $('<img>', {
        class: 'artifact-thumbnail',
        src: src,
    });

    let $clone = $img.clone()
        .css('max-width', '50rem')
        .css('max-height', '10rem');

    $img.on('mouseover', (_evt) => {
        $tooltip.css('visibility', 'visible');
        $tooltip.html($clone);
    }).on('mousemove', (evt) => {
        $tooltip.css('top', `calc(${evt.pageY - $clone.height() - tooltipOffset}px)`);
        $tooltip.css('left', `calc(${evt.pageX - $clone.width() - tooltipOffset}px)`);
    }).on('mouseout', (_evt) => {
        $tooltip.css('visibility', 'hidden');
    });

    if (dblclickToOpen) {
        $img.prop('title', 'Double click to edit');
        $img.css('cursor', 'pointer');
        $img.on('dblclick', doubleClickToRemap)
    }

    return $img;
}