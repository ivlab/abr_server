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
import { getDisplayVal, getFloatVal, ScrubbableInput } from '../Primitives.js';
import { STATE_UPDATE_EVENT } from '../../../../common/StateManager.js';
import { createSvg } from '../../../../common/helpers.js';

const margin = { top: 10, right: 50, bottom: 20, left: 50 };
const dialogWidth = 700;
const width = dialogWidth - margin.left - margin.right;
const height = 100 - margin.top - margin.bottom;

// Label width + 2 * padding width
const labelWidth = 60 + 2 * 10;

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

// Returns the new uuid if there is one
export async function GradientDialog(gradientUuid) {
    setCurrentGradient(gradientUuid);

    if (currentGradient.points.length != currentGradient.values.length) {
        alert('Gradient is incorrectly formatted.');
        return;
    }

    // There can only be one colormap editor
    if ($('.gradient-editor').length > 0 && $('.gradient-editor').dialog('isOpen')) {
        alert('There is already a gradient editor open.');
        return;
    }

    // Wait until the state is ready before constructing dialog
    await saveGradient();

    // Get rid of any previous instances of the gradient editor that were hidden
    // jQuery UI dialogs just hide the dialog when it's closed
    $('.gradient-editor').remove();

    let $gradientEditor = $('<div>', {
        id: 'gradient-editor',
        class: 'gradient-editor',
        css: { padding: '0' }
    });

    $gradientEditor.dialog({
        'title': 'Opacity Map Editor',
        'minWidth': dialogWidth,
    });

    // Add the visualization of the current colormap, if there is one
    let pairedColormapUuid = null;
    let impressions = globals.stateManager.findAll((s) => {
        if (s.inputValues && s.inputValues.Opacitymap && s.inputValues.Opacitymap.inputValue) {
            return s.inputValues.Opacitymap.inputValue == currentGradientUuid;
        } else {
            return false;
        }
    });
    // we did not find the impression
    if (impressions.length > 0) {
        // assume we found the impression that has this opacity map
        let impression = impressions[0];

        // Attempt to find colormap, if it exists
        if (impression.inputValues && impression.inputValues.Colormap && impression.inputValues.Colormap.inputValue) {
            pairedColormapUuid = impression.inputValues.Colormap.inputValue;
        }

        let thumbUrl = '';
        if (pairedColormapUuid) {
            let visassets = globals.stateManager.getCache('visassets');
            let localVisAssets = globals.stateManager.state.localVisAssets;
            if (visassets && visassets[pairedColormapUuid]) {
                let previewImg = visassets[pairedColormapUuid]['preview'];
                thumbUrl = `/media/visassets/${pairedColormapUuid}/${previewImg}`;
            } else if (localVisAssets && localVisAssets[pairedColormapUuid]) {
                // TODO assuming colormap xml for now
                let colormapXml = localVisAssets[pairedColormapUuid].artifactDataContents['colormap.xml'];
                let colormapObj = ColorMap.fromXML(colormapXml);
                thumbUrl = colormapObj.toBase64(true);
            }
        }

        $gradientEditor.append($('<img>', {
            id: 'colormap-gradient-vis',
            src: thumbUrl,
            width,
            height,
            css: {
                position: 'relative',
                left: margin.left
            }
        }));
    }

    // Add the visualization of the gradient
    $gradientEditor.append($('<img>', {
        id: 'gradient-vis',
        width,
        height,
        css: {
            position: 'relative',
            left: margin.left
        }
    }));

    // Append the gradient view area
    $gradientEditor.append($('<div>', {
        id: 'gradient-view',
        title: 'Double click to add a new gradient stop',
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
        accept: '.gradient-stop',
        drop: (evt, ui) => {
            $(ui.draggable).remove();
            currentGradient = gradientFromStops();
            saveGradient();
        },
        // Indicate that it's about to be deleted
        over: (_evt, ui) => {
            $(ui.helper).css('opacity', '25%');
        },
        out: (_evt, ui) => {
            $(ui.helper).css('opacity', '100%');
        }
    }).attr('title', 'Drop a gradient stop here to discard');

    $gradientEditor.append($trash);

    globals.stateManager.subscribe($('#gradient-view'));
    $('#gradient-view').on(STATE_UPDATE_EVENT, (evt) => {
        setCurrentGradient(currentGradientUuid);
        stopsFromGradient();
    });

    stopsFromGradient();

    $('#gradient-view').on('dblclick', (evt) => {
        let viewLeft = evt.target.getBoundingClientRect().x;
        let viewWidth = width;
        let clickPoint = (evt.clientX - viewLeft) / viewWidth;

        // insert in the correct place, sorted
        let i = 0;
        while (currentGradient.points[i] < clickPoint) {
            i++;
        }

        let clickValue = '0%';
        if (i == 0) {
            // first point
            currentGradient.points.unshift(clickPoint);
            currentGradient.values.unshift(clickValue);
        } else if (i == currentGradient.points.length - 1) {
            // last point
            currentGradient.points.push(clickPoint);
            currentGradient.values.push(clickValue);
        } else {
            // somewhere in the middle, interpolate correct click value
            let leftPoint = currentGradient.points[i - 1];
            let leftVal = currentGradient.values[i - 1]
            let rightPoint = currentGradient.points[i];
            let rightVal = currentGradient.values[i]

            let floatLeftVal = getFloatVal(leftVal, 'PercentPrimitive');
            let floatRightVal = getFloatVal(rightVal, 'PercentPrimitive');
            let percBetween = (clickPoint - leftPoint) / (rightPoint - leftPoint);
            let clickValue = ((floatRightVal - floatLeftVal) * percBetween) + floatLeftVal;
            let clickValueStr = getDisplayVal(clickValue, 'PercentPrimitive');

            currentGradient.points.splice(i, 0, clickPoint);
            currentGradient.values.splice(i, 0, clickValueStr);
        }

        stopsFromGradient();
        updateGradientVis();
        saveGradient();
    });

    updateGradientVis();
    return currentGradientUuid;
}

function setCurrentGradient(gradientUuid) {
    if (!gradientUuid) {
        gradientUuid = uuid();
        currentGradient = DEFAULT_GRADIENT;
    } else {
        if (globals.stateManager.state['primitiveGradients'] && globals.stateManager.state['primitiveGradients'][gradientUuid]) {
            currentGradient = globals.stateManager.state['primitiveGradients'][gradientUuid];
        } else {
            alert('No gradient to edit!');
            return;
        }
    }
    currentGradientUuid = gradientUuid;
}

async function saveGradient() {
    await globals.stateManager.update('primitiveGradients/' + currentGradientUuid, currentGradient);
}

function gradientFromStops() {
    let pointValuePairs = [];
    $('.gradient-stop').each((i, el) => {
        let stopWidth = $(el).get(0).clientWidth;
        let percentage = ($(el).position().left + stopWidth / 2.0) / width;
        let stopHeight = $(el).get(0).clientHeight;
        let value = 1.0 - (($(el).position().top + stopHeight / 2.0) / height);
        pointValuePairs.push([
            percentage,
            getDisplayVal(value, 'PercentPrimitive'),
        ]);
    });

    // Sort gradient for display / nicity
    pointValuePairs.sort();

    return {
        points: pointValuePairs.map((pv) => pv[0]),
        values: pointValuePairs.map((pv) => pv[1]),
    };
}

function stopsFromGradient() {
    $('#gradient-view').empty();
    let $svg = $(createSvg('svg'))
        .attr('width', width)
        .attr('height', height)
        .css('position', 'absolute')
        .css('top', 0)
        .css('left', 0);
    let $pointCanvas = $('<div>')
        .css('width', width)
        .css('height', height)
        .css('position', 'absolute')
        .css('top', 0)
        .css('left', 0);

    let [prevX, prevY] = [null, null];
    for (const i in currentGradient.points) {
        let point = currentGradient.points[i];
        let floatValue = getFloatVal(currentGradient.values[i], 'PercentPrimitive');

        // center x, y
        let [x, y] = [point * width, height - floatValue * height]

        const pointSize = 15;
        let $point = $('<div>', {
            class: 'gradient-stop',
            width: pointSize,
            height: pointSize,
            css: {
                'cursor': 'grab',
                'position': 'absolute',
                'background-color': 'black',
                'left': x - pointSize / 2,
                'top': y - pointSize / 2,
            }
        });

        if (prevX != null && prevY != null) {
            let $line = $(createSvg('line'))
                .attr('x1', prevX)
                .attr('y1', prevY)
                .attr('x2', x)
                .attr('y2', y)
                .css('stroke', 'black');
            $svg.append($line);
        }

        $point.draggable({
            containment: '.gradient-editor',
            stop: (evt, ui) => {
                currentGradient = gradientFromStops();
                saveGradient();
                updateGradientVis();
            },
        });

        $pointCanvas.append($point);
        [prevX, prevY] = [x, y];
    }
    $('#gradient-view').append($svg);
    $('#gradient-view').append($pointCanvas);
}

export function gradientToColormap(gradient) {
    let c = new ColorMap();
    if (gradient.points.length != gradient.values.length) {
        console.error('Gradient points must be the same length as gradient values');
        return null;
    }

    for (const i in gradient.points) {
        let floatValue = getFloatVal(gradient.values[i], 'PercentPrimitive');
        c.addControlPt(gradient.points[i], {
            r: floatValue,
            g: floatValue,
            b: floatValue,
        });
    }
    return c;
}

function updateGradientVis() {
    let colormap = gradientToColormap(currentGradient);
    let b64 = colormap.toBase64(true);
    $('#gradient-vis').attr('src', b64);
}
