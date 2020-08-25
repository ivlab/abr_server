/* components/CompositionPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Composition panel (Center of the ABR Compose UI)
 */

export function CompositionPanel() {
    let $compositionPanel = $('<div>', {
        class: 'panel',
        id: 'composition-panel',
    });

    $compositionPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Visualization Composition',
    }));

    return $compositionPanel;
}
