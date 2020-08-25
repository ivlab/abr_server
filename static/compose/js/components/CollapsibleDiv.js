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
    collapsed=true,
) {
    let $collapsibleDiv = $('<div>', {
        class: 'collapsible-div rounded',
    }).append(
        $('<div>', {
            class: 'collapsible-header',
            text: header
        }).on('click', (evt) => {
            $(evt.target).toggleClass('active');
            let content = evt.target.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        })
    ).append(
        $('<div>', { class: 'collapsible-content' }).append($contents)
    );

    if (!collapsed) {
        $collapsibleDiv.find('.collapsible-header').trigger('click');
    }
    return $collapsibleDiv;
}