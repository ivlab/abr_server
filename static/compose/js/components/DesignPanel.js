/* components/DesignPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Design panel (right side of the ABR Compose UI)
 */

import * as Components from './Components.js';
import { globals } from '../../../common/globals.js';

export function DesignPanel() {
    let $designPanel = $('<div>', {
        class: 'panel',
        id: 'design-panel',
    });

    $designPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Design Palette',
    }));

    // Populate the plates
    let plateTypes = Object.keys(globals.schema.definitions.Plates)
        .map((plt) => Components.Plate(plt));

    let $plateList = Components.SwatchList(plateTypes);

    $designPanel.append($plateList);

    return $designPanel;
}
