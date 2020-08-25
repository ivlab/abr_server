/* components/Plate.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Construct a representation of a "Plate" for ABR. Instantiated into a data
 * impression When dragged into the composition panel.
 */

export function Plate(plateType) {
    let $plate = $('<div>', {
        class: 'plate',
    }).data({
        plateType: plateType,
    });

    $plate.append($('<div>', {
        class: 'plate-header',
        text: plateType,
    }));

    $plate.append($('<img>', {
        class: 'plate-thumbnail',
        src: `${STATIC_URL}compose/plate_thumbnail/${plateType}.png`,
    }));

    return $plate;
}