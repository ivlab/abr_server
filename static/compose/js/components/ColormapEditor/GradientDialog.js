/* GradientDialog.js
 *
 * Dialog that enables a user to modify gradients
 *
 * Copyright (C) 2021, University of Minnesota
 * Authors:
 *   Bridger Herman <herma582@umn.edu>
 *   Kiet Tran <tran0563@umn.edu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { globals } from '../../../../common/globals.js';
import { uuid } from '../../../../common/UUID.js';
import { DataPath } from '../../../../common/DataPath.js';
import { ColorMap, floatToHex, hexToFloat } from './color.js';
import { ColorThumb, DataRemappingSlider } from './components.js';
import { ScrubbableInput } from '../Primitives.js';

const margin = { top: 10, right: 50, bottom: 20, left: 50 };
const dialogWidth = 700;
const width = dialogWidth - margin.left - margin.right;
const height = 100 - margin.top - margin.bottom;

const DEFAULT_GRADIENT = {
    "points": [
        0.0,
        1.0,
    ],
    "values": [
        '0%',
        '100%'
    ],
};

var currentGradient = null;
var currentGradientUuid = null;

export async function GradientDialog(gradientUuid) {

    if (gradientUuid == null) {
        gradientUuid = uuid();
        currentGradient = DEFAULT_GRADIENT;
    } else {
        let numGradients = globals.stateManager.length(['primitiveGradients']);
        if (gradientUuid < numGradients) {
            currentGradient = globals.stateManager.state['primitiveGradients'][gradientUuid];
        } else {
            alert('No gradient to edit!');
            return;
        }
    }

    if (currentGradient.points.length != currentGradient.values.length) {
        alert('Gradient is incorrectly formatted.');
        return;
    }

    currentGradientUuid = gradientUuid;

    // There can only be one colormap editor
    if ($('.gradient-editor').length > 0 && $('.gradient-editor').dialog('isOpen')) {
        alert('There is already a gradient editor open.');
        return;
    }

    // Get rid of any previous instances of the gradient editor that were hidden
    // jQuery UI dialogs just hide the dialog when it's closed
    $('.gradient-editor').remove();

    let $gradientEditor = $('<div>', {
        id: 'gradient-editor',
        class: 'gradient-editor',
        css: { padding: '0' }
    });

    $gradientEditor.dialog({
        'title': 'Gradient Editor',
        'minWidth': dialogWidth,
    });

    // Append the gradient view area
    $gradientEditor.append($('<div>', {
        id: 'gradient-view',
        height: height,
        width: width,
        css: {
            position: 'relative',
            left: margin.left
        }
    }));

    let $trash = $('<img>', {
        id: 'trash',
        src: `${STATIC_URL}compose/trash.svg`,
    }).droppable({
        tolerance: 'touch',
        accept: '.color-thumb',
        drop: (evt, ui) => {
            $(ui.draggable).remove();
        },
        // Indicate that it's about to be deleted
        over: (_evt, ui) => {
            $(ui.helper).css('opacity', '25%');
        },
        out: (_evt, ui) => {
            $(ui.helper).css('opacity', '100%');
        }
    }).attr('title', 'Drop a color swatch here to discard');

    $gradientEditor.append($trash);

    for (const i in currentGradient.points) {
        let point = currentGradient.points[i];
        let value = currentGradient.values[i];

        let $input = $('<input>', {
            class: 'primitive-input no-drag',
            type: 'text',
            val: value,
            width: '3em',
        });
        $input.on('dragstart', (evt) => evt.stopPropagation() && console.log('start'));
        $input.on('drag', (evt) => evt.stopPropagation() && console.log('drag'));
        $input.on('dragstop', (evt) => evt.stopPropagation() && console.log('stop'));

        let $label = ScrubbableInput($input, 'IVLab.ABREngine.PercentPrimitive');
        $label.addClass('gradient-stop');
        $('#gradient-view').append($label)
        $label.draggable({
            axis: 'x',
            stop: (evt, ui) => {
                saveGradient();
            },
        });

        let mapWidth = width;
        let positionX = (point * mapWidth) - ($label.width() / 2.0);
        $label.css('position', 'absolute');
        $label.css('left', positionX);
    }

}

async function saveGradient() {
    currentGradient = gradientFromStops();
    globals.stateManager.update('primitiveGradients/' + currentGradientUuid, currentGradient);
}

function gradientFromStops() {
    let points = [];
    let values = [];
    $('.gradient-stop').each((i, el) => {
        let percentage = ($(el).position().left + $(el).width() / 2.0) / width;
        points.push(percentage);
        values.push($(el).find('input').val());
    });
    return {
        points,
        values
    };
}

function updateGradient() {
}
