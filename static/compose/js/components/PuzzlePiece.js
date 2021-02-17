/* PuzzlePiece.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { resolveSchemaConsts } from "../../../common/StateManager.js";
import { PrimitiveInput } from "./Primitives.js";

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
    let thumbUrl = `/media/visassets/${uuid}/thumbnail.png`;
    let $thumb = $('<img>', {
        class: 'artifact-thumbnail rounded',
        src: thumbUrl,
    });
    if (cssObjectFit) {
        $thumb.css('object-fit', cssObjectFit);
    }
    return PuzzlePiece($thumb, inputType, leftConnector, addClasses);
}

// Can be either something waiting for an input or the input itself
export function InputPuzzlePiece(inputName, inputProps) {
    let $el;
    let resolvedProps = resolveSchemaConsts(inputProps);
    if (resolvedProps.inputGenre == 'VisAsset') {
        if (!resolvedProps?.inputValue) {
            $el = PuzzlePiece(inputName, resolvedProps.inputType, true, '');
        } else {
            const cssObjectFitMap = {
                'IVLab.ABREngine.ColormapVisAsset': 'fill',
                'IVLab.ABREngine.LineTextureVisAsset': 'cover',
                'IVLab.ABREngine.SurfaceTextureVisAsset': 'contain',
                'IVLab.ABREngine.GlyphVisAsset': 'contain',
            }
            $el = PuzzlePieceWithThumbnail(
                resolvedProps.inputValue,
                resolvedProps.inputType,
                true,
                '',
                cssObjectFitMap[resolvedProps.inputType]
            );
        }
    } else if (resolvedProps.inputGenre == 'Variable') {
        $el = PuzzlePiece(inputName, resolvedProps.inputType, false, '');
    } else if (resolvedProps.inputGenre == 'KeyData') {
        $el = PuzzlePiece(inputName, resolvedProps.inputType, false, 'keydata');
    } else if (resolvedProps.inputGenre == 'Primitive') {
        $el = PrimitiveInput(inputName, resolvedProps);
    }

    // Assign the constant data (NOTHING from state)
    $el.data('inputName', inputName);
    $el.data('parameterName', resolvedProps?.parameterName);
    $el.data('inputGenre', resolvedProps?.inputGenre);
    $el.data('inputType', resolvedProps?.inputType);
    $el.data('inputValue', resolvedProps?.inputValue);
    return $el;
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