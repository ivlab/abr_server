/* PuzzlePiece.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { DataPath } from "../../../common/DataPath.js";
import { globals } from "../../../common/globals.js";
import { CACHE_UPDATE, resolveSchemaConsts } from "../../../common/StateManager.js";
import { ColorMap } from "./ColormapEditor/color.js";
import { ColormapDialog } from "./ColormapEditor/ColormapDialog.js";
import { PrimitiveInput } from "./Primitives.js";
import { VariableList } from "./VariableList.js";

export function PuzzlePiece(label, inputType, leftConnector, addClasses) {
    let $element = $('<div>', {
        class: 'puzzle-piece rounded ' + addClasses,
    });

    let $connector = PuzzleConnector(inputType, addClasses);

    // If the connector should be on the right, leave the order. Otherwise,
    // make the connector show up to the left of the label
    if (!leftConnector) {
        $element.append(PuzzleLabel(label));
        $element.append($connector);
    } else {
        $element.append($connector);
        $element.append(PuzzleLabel(label));
    }

    $element.attr('title', label);
    return $element;
}

export function PuzzlePieceWithThumbnail(uuid, inputType, leftConnector, addClasses, cssObjectFit) {
    let thumbUrl;
    let visassets = globals.stateManager.getCache('visassets');
    let localVisAssets = globals.stateManager.state.localVisAssets;
    if (visassets && visassets[uuid]) {
        let previewImg = visassets[uuid]['preview'];
        thumbUrl = `/media/visassets/${uuid}/${previewImg}`;
    } else if (localVisAssets && localVisAssets[uuid]) {
        // TODO assuming colormap xml for now
        let colormapXml = localVisAssets[uuid].artifactDataContents['colormap.xml'];
        let colormapObj = ColorMap.fromXML(colormapXml);
        thumbUrl = colormapObj.toBase64(true);
    } else {
        thumbUrl = `${STATIC_URL}compose/${inputType}_default.png`;
    }
    let $thumb = $('<img>', {
        class: 'artifact-thumbnail rounded',
        src: thumbUrl,
    });
    if (cssObjectFit) {
        $thumb.css('object-fit', cssObjectFit);
    }

    let $ret = PuzzlePiece($thumb, inputType, leftConnector, addClasses);

    // If it's a localVisAsset, indicate it as such
    if (globals.stateManager.keyExists(['localVisAssets'], uuid)) {
        $ret.find('.puzzle-label').append($('<p>', {
            class: 'custom-indicator rounded',
            attr: { title: 'This colormap is custom' },
            text: 'C',
        }));
    }

    return $ret;

}

// Can be either something waiting for an input or the input itself
export function InputPuzzlePiece(inputName, inputProps) {
    let $el;
    let resolvedProps = resolveSchemaConsts(inputProps);
    if (resolvedProps.inputGenre == 'VisAsset') {
        if (resolvedProps && !resolvedProps.inputValue) {
            $el = PuzzlePiece(inputName, resolvedProps.inputType, true, '');
        } else {
            const cssObjectFitMap = {
                'IVLab.ABREngine.ColormapVisAsset': 'fill',
                'IVLab.ABREngine.LineTextureVisAsset': 'cover',
                'IVLab.ABREngine.SurfaceTextureVisAsset': 'contain',
                'IVLab.ABREngine.GlyphVisAsset': 'contain',
            }
            let args = [
                resolvedProps.inputValue,
                resolvedProps.inputType,
                true,
                '',
                cssObjectFitMap[resolvedProps.inputType]
            ];

            $el = PuzzlePieceWithThumbnail(...args);

            // Allow the colormap to be edited
            if (resolvedProps.inputType == 'IVLab.ABREngine.ColormapVisAsset') {
                $el.attr('title', 'Click to customize');
                $el.addClass('hover-bright');
                let dragging = false;
                $el.on('dragstart', () => dragging = true);
                $el.on('dragend', () => dragging = false);
                $el.css('cursor', 'pointer');
                $el.on('click', (evt) => {
                    if (!dragging) {
                        let impressionUuid = $el.parents('.data-impression').data('uuid');

                        let colorVars = globals.stateManager.findPath((s) => {
                            return s.hasOwnProperty('inputGenre') &&
                                s['inputGenre'] == 'Variable' && 
                            s.hasOwnProperty('inputType') &&
                                s['inputType'] == 'IVLab.ABREngine.ScalarDataVariable' && 
                            s.hasOwnProperty('parameterName') &&
                                s['parameterName'] == 'Color'
                        });

                        let colorVarPath = colorVars.find((p) => p.split('/')[2] == impressionUuid);

                        let keyDatas = globals.stateManager.findPath((s) => {
                            return s.hasOwnProperty('inputGenre') &&
                                s['inputGenre'] == 'KeyData' && 
                            s.hasOwnProperty('parameterName') &&
                                s['parameterName'] == 'Key Data'
                        });

                        let keyDataPath = keyDatas.find((p) => p.split('/')[2] == impressionUuid);

                        let colorVar = null;
                        let keyData = null;
                        if (colorVarPath) { 
                            colorVar = globals.stateManager.getPath(colorVarPath);
                        }
                        if (keyDataPath) {
                            keyData = globals.stateManager.getPath(keyDataPath);
                        }

                        ColormapDialog(resolvedProps.inputValue, colorVar, keyData);
                    }
                });
            }
        }
    } else if (resolvedProps.inputGenre == 'Variable') {
        if (resolvedProps && resolvedProps.inputValue) {
            $el = PuzzlePiece(DataPath.getName(resolvedProps.inputValue), resolvedProps.inputType, false, '');
        } else {
            $el = PuzzlePiece(inputName, resolvedProps.inputType, false, '');
        }
        $el.attr('title', resolvedProps && resolvedProps.inputValue ? resolvedProps.inputValue : null);

        $el.attr('title', $el.attr('title') + '\nClick to change variable');
        $el.css('cursor', 'pointer');
        $el.addClass('hover-bright');
        let dragging = false;
        $el.on('dragstart', () => dragging = true);
        $el.on('dragend', () => dragging = false);

        // Allow the user to easily change the variable to another associated with this keydata
        $el.on('click', (evt) => {
            if (!resolvedProps.inputValue || dragging) {
                return;
            }
            let impressionUuid = $(evt.target).parents('.data-impression').data('uuid');
            let keyDatas = globals.stateManager.findPath((s) => {
                return s.hasOwnProperty('inputGenre') &&
                    s['inputGenre'] == 'KeyData' && 
                s.hasOwnProperty('parameterName') &&
                    s['parameterName'] == 'Key Data'
            });
            let keyDataPath = keyDatas.find((p) => p.split('/')[2] == impressionUuid);
            let keyDataInput = globals.stateManager.getPath(keyDataPath).inputValue;
            let [org, dataset, _, kd] = DataPath.getPathParts(keyDataInput);
            let rawMetadata = globals.dataCache[org][dataset][kd];
            let varNames = [];
            if (DataPath.getPathType(resolvedProps.inputValue) == 'ScalarVar') {
                varNames = rawMetadata.scalarArrayNames;
            } else if (DataPath.getPathType(resolvedProps.inputValue) == 'VectorVar') {
                varNames = rawMetadata.vectorArrayNames;
            }

            let impressionPath = keyDataPath.split('/').slice(0, 4);
            let statePath = impressionPath.join('/') + `/${inputName}`;
            let $varList = VariableList(varNames, statePath, resolvedProps);
            $varList.appendTo($el);
        })
    } else if (resolvedProps.inputGenre == 'KeyData') {
        if (resolvedProps && resolvedProps.inputValue) {
            $el = PuzzlePiece(DataPath.getName(resolvedProps.inputValue), resolvedProps.inputType, false, 'keydata');
        } else {
            $el = PuzzlePiece(inputName, resolvedProps.inputType, false, 'keydata');
        }
        $el.attr('title', resolvedProps && resolvedProps.inputValue ? resolvedProps.inputValue : null);
    } else if (resolvedProps.inputGenre == 'Primitive') {
        $el = PrimitiveInput(inputName, resolvedProps);
        $el.addClass('no-drag');
    }

    // Assign the constant data (NOTHING from state)
    $el.data('inputName', inputName);
    $el.data('parameterName', resolvedProps.parameterName);
    $el.data('inputGenre', resolvedProps.inputGenre);
    $el.data('inputType', resolvedProps.inputType);
    $el.data('inputValue', resolvedProps.inputValue);
    return $el;
}

// A puzzle piece that's already assigned on a data impression; when it's
// removed it will send a message to the server telling it that it's removed
export function AssignedInputPuzzlePiece(inputName, inputProps) {
    let $input = InputPuzzlePiece(inputName, inputProps);
    if (!$input.hasClass('no-drag')) {
        $input.draggable({
            cursor: 'grabbing',
            stop: (evt, _ui) => {
                // Unassign this input
                let uuid = $(evt.target).parents('.data-impression').data('uuid');
                globals.stateManager.removePath(`impressions/${uuid}/inputValues/${inputName}`);
            }
        });
    }
    $input.css('position', 'absolute');
    $input.css('top', 0);
    $input.css('left', 0);
    return $input;
}

// A "swatch"; a puzzle piece that lives in a palette
export function SwatchInputPuzzlePiece(inputName, inputProps) {
    return InputPuzzlePiece(inputName, inputProps).draggable({
        helper: 'clone',
        cursor: 'grabbing',
    })
}

// A connector for a puzzle piece
export function PuzzleConnector(type, addClasses='', background=false) {
    let backgroundClass = background ? 'background' : 'foreground-contrast';
    let $connector = $('<div>', { class: `puzzle-connector ${backgroundClass} ${addClasses}` })
        .css('mask', `url(${STATIC_URL}compose/puzzle_pieces/${type}.svg)`)
        .css('-webkit-mask', `url(${STATIC_URL}compose/puzzle_pieces/${type}.svg)`);
    return $connector;
}

// A puzzle piece label
function PuzzleLabel(name) {
    if (name instanceof jQuery) {
        return $('<div>', { class: 'puzzle-label rounded' }).append(name);
    } else {
        return $('<div>', { class: 'puzzle-label rounded' }).append($('<p>', { text: name }));
    }
}