/* PuzzlePiece.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

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
    if (inputProps.inputGenre.const == 'VisAsset') {
        if (!inputProps?.inputValue) {
            $el = PuzzlePiece(inputName, inputProps.inputType.const, true, '');
        } else {
            const cssObjectFitMap = {
                'IVLab.ABREngine.ColormapVisAsset': 'fill',
                'IVLab.ABREngine.LineTextureVisAsset': 'cover',
                'IVLab.ABREngine.SurfaceTextureVisAsset': 'contain',
                'IVLab.ABREngine.GlyphVisAsset': 'contain',
            }
            $el = PuzzlePieceWithThumbnail(
                inputProps.inputValue.const,
                inputProps.inputType.const,
                true,
                '',
                cssObjectFitMap[inputProps.inputType.const]
            );
        }
    } else if (inputProps.inputGenre.const == 'Variable') {
        $el = PuzzlePiece(inputName, inputProps.inputType.const, false, '');
    } else if (inputProps.inputGenre.const == 'KeyData') {
        $el = PuzzlePiece(inputName, inputProps.inputType.const, false, 'keydata');
    } else if (inputProps.inputGenre.const == 'Primitive') {
        $el = $('<p>', {text: inputName});
    }

    // Assign the constant data (NOTHING from state)
    $el.data('inputName', inputName);
    $el.data('parameterName', inputProps?.parameterName?.const);
    $el.data('inputGenre', inputProps?.inputGenre?.const);
    $el.data('inputType', inputProps?.inputType?.const);
    $el.data('inputValue', inputProps?.inputValue?.const);
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