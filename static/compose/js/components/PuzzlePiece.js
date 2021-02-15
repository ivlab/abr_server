/* PuzzlePiece.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

export function PuzzlePiece(label, inputType, inputGenre, parameterName) {
    let $element = $('<div>', {
        class: 'puzzle-piece rounded'
    });

    let $connector = PuzzleConnector(inputType);

    // If the connector should be on the right, leave the order. Otherwise,
    // make the connector show up to the left of the label
    let leftConnector = true;
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

// A connector for a puzzle piece
export function PuzzleConnector(type, addClasses='', background=false) {
    let backgroundClass = background ? 'background' : 'foreground-contrast';
    let $connector = $('<div>', { class: `puzzle-connector ${backgroundClass} ${addClasses}` })
        .css('mask', `url(${STATIC_URL}composition/puzzle_pieces/${type}.svg)`)
        .css('-webkit-mask', `url(${STATIC_URL}composition/puzzle_pieces/${type}.svg)`);
    return $connector;
}

// A puzzle piece label
function PuzzleLabel(name, useHtml=false) {
    if (!useHtml) {
        return $('<div>', { class: 'puzzle-label' }).append($('<p>', { text: name }));
    } else {
        return $('<div>', { class: 'puzzle-label', html: name });
    }
}