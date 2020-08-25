/* components/CollapsibleDiv.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Collapsable div (expands and collapses when clicked)
 */

// Wrap the contents with an expandable div
export function CollapsibleDiv(header, $contents) {
    return $('<div>').append(
        $('<div>', {
            class: 'collapsible-header',
            text: header
        }
        ).on('click', (evt) => {
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
}