/* components/SwatchList.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Generic list of swatches (key data, plates, visassets, etc.)
 */

import * as Components from './Components.js';

// Items is an array of jQuery objects
// Can specify if it should be collapsed or not
export function SwatchList(name, items) {
    let $list = $('<div>', {
        class: 'swatch-list',
    });

    for (const $item of items) {
        $list.append($item);
    }

    return Components.CollapsibleDiv(name, $list);
}