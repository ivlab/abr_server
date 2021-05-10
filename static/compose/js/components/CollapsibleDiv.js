/* components/CollapsibleDiv.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Collapsable div (expands and collapses when clicked)
 */

// Wrap the contents with an expandable div
// Can optionally persist its state through refresh (uses session storage)
// Defaults to collapsed state
export function CollapsibleDiv(
    header,
    $contents,
) {
    let $header;
    if (header instanceof jQuery) {
        $header = header;
    } else {
        $header = $('<div>', {
            text: header
        });
    }
    $header.addClass('collapsible-header');

    let $collapsibleDiv = $('<div>', {
        class: 'collapsible-div rounded',
    }).append($header.on('click', (evt) => {
        let $target = $(evt.target).closest('.collapsible-header');
        $target.toggleClass('active');
        let content = $target[0].nextElementSibling;
        if (!$target.hasClass('active')) {
            content.style.maxHeight = null;
            $(content).css('visibility', 'hidden');
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
            $(content).css('visibility', 'visible');
        }
    })
    ).append(
        $('<div>', {
            class: 'collapsible-content rounded',
            css: { visibility: 'hidden' }
        }).append($contents)
    );
    return $collapsibleDiv;
}