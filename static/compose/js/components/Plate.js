/* components/Plate.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Construct a representation of a "Plate" for ABR. Instantiated into a data
 * impression When dragged into the composition panel.
 */

import { globals } from '../../../common/globals.js';


export function Plate(plateType) {
    let plateSchema = globals.schema.definitions.Plates[plateType];

    let $plate = $('<div>', {
        class: 'plate',
    }).data({
        plateType: plateType,
    });

    $plate.append($('<div>', {
        text: plateType,
    }));

    return $plate;
}