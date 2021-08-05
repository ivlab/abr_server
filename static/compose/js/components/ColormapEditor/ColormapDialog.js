/* ColormapDialog.js
 *
 * Dialog that enables a user to modify colormaps as well as remap data ranges for scalar variables.
 *
 * Copyright (C) 2021, University of Minnesota
 * Authors: Bridger Herman <herma582@umn.edu>
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

const margin = { top: 10, right: 0, bottom: 20, left: 0 };
const dialogWidth = 700;
const numBins = 540;
const width = numBins - margin.left - margin.right;
const height = 100 - margin.top - margin.bottom;
const histogramHeight = 200 - margin.top - margin.bottom;

var activeColormap = null;
var zippedHistogram = null;
var currentVarPath = null;
var currentMinMax = null;
var currentColormapUuid = null;
var currentVisAssetJson = null;

export async function ColormapDialog(vaUuid, variableInput, keyDataInput) {
    let visassetJson = null;
    let colormapXml = null;
    if (globals.stateManager.keyExists(['localVisAssets'], vaUuid)) {
        let va = globals.stateManager.state.localVisAssets[vaUuid];
        visassetJson = va.artifactJson;
        colormapXml = va.artifactDataContents[visassetJson['artifactData']['colormap']];
    } else {
        let visassets = globals.stateManager.getCache('visassets');
        if (visassets && visassets[vaUuid]) {
            visassetJson = visassets[vaUuid];
        }

        // Fetch the colormap xml from the server
        if (visassetJson) {
            let xmlName = visassetJson['artifactData']['colormap'];
            let xmlUrl = `/media/visassets/${vaUuid}/${xmlName}`;
            colormapXml = await fetch(xmlUrl).then((resp) => resp.text());
        }
    }

    if (visassetJson == null || colormapXml == null) {
        alert('No colormap to edit!');
        return;
    }

    // There can only be one colormap editor
    if ($('.colormap-editor').length > 0 && $('.colormap-editor').dialog('isOpen')) {
        alert('There is already a colormap editor open.');
        return;
    }

    currentColormapUuid = vaUuid;
    currentVisAssetJson = visassetJson;

    // Get rid of any previous instances of the colormap editor that were hidden
    // jQuery UI dialogs just hide the dialog when it's closed
    $('.colormap-editor').remove();

    let $colormapEditor = $('<div>', {
        id: 'colormap-editor',
        class: 'colormap-editor',
    });

    $colormapEditor.dialog({
        'title': variableInput ? 'Colormap + Variable Range Editor' : 'Colormap Editor',
        'minWidth': dialogWidth,
    });

    // Label the min/max of the histogram (only if there's a variable attached)
    if (variableInput) {
        currentVarPath = variableInput.inputValue;
        let variableName = DataPath.getName(variableInput.inputValue);
        let keyDataName = DataPath.getName(keyDataInput.inputValue);

        // Fetch the histogram from the server
        let url = new URL(`${window.location}api/histogram/${keyDataInput.inputValue}/${variableName}`);
        url.search = new URLSearchParams(currentMinMax);

        zippedHistogram = await fetch(url).then((resp) => resp.json());

        // Try to get the current min/max from state if it's been redefined
        if (globals.stateManager.state.dataRanges && globals.stateManager.state.dataRanges.scalarRanges) {
            currentMinMax = globals.stateManager.state.dataRanges.scalarRanges[currentVarPath];
        }

        if (!currentMinMax) {
            currentMinMax = {
                min: zippedHistogram.keyDataMin,
                max: zippedHistogram.keyDataMax,
            }
        }


        let $histContainer = $('<div>', {
            id: 'histogram-container',
            class: 'centered',
        });

        $histContainer.append($('<div>', {
            id: 'histogram',
        }));

        $colormapEditor.append($('<button>', {
            class: 'rounded',
            text: 'Reset Data Range',
            css: {
                position: 'absolute',
                right: '0',
            }
        }).on('click', (evt) => {
            updateHistogram(zippedHistogram.keyDataMin, zippedHistogram.keyDataMax);
        }))

        $colormapEditor.append($histContainer);

        $colormapEditor.append(
            $('<div>', {
                class: 'centered',
                css: {
                    'background-color': 'white',
                }
            }).append(
                $('<div>', {
                    class: 'variable-labels',
                }).append($('<input>', {
                    id: 'slider-minLabel',
                    type: 'number',
                    step: 0.0001,
                    value: currentMinMax.min.toFixed(4),
                    change: function() {
                        currentMinMax.min = parseFloat(this.value);
                        $('.data-remapping-slider').slider('values', 0, currentMinMax.min);
                        updateHistogram(currentMinMax.min, currentMinMax.max);
                    },
                })).append($('<p>', {
                    html: `<em>${keyDataName} &rarr; <strong>${variableName}</strong></em>`,
                })).append($('<input>', {
                    id: 'slider-maxLabel',
                    type: 'number',
                    step: 0.0001,
                    value: currentMinMax.max.toFixed(4),
                    change: function() {
                        currentMinMax.max = parseFloat(this.value);
                        $('.data-remapping-slider').slider('values', 1, currentMinMax.max);
                        updateHistogram(currentMinMax.min, currentMinMax.max);
                    },
                }))
            )
        );

        $colormapEditor.append(
            $('<div>', {
                id: 'data-remapper',
                class: 'centered',
            }).append(
                DataRemappingSlider(0, 1, 0, 1, width)
            ).on('mouseup', (evt, ui) => {
                let filterMin = $('.data-remapping-slider').slider('values', 0);
                let filterMax = $('.data-remapping-slider').slider('values', 1);
                currentMinMax = {
                    min: filterMin,
                    max: filterMax,
                }
                updateHistogram(filterMin, filterMax);
            })
        );

        let $sliderMinHandle = $('#data-remapper > .data-remapping-slider > .ui-slider-handle:nth-child(2)');
        let $sliderMaxHandle = $('#data-remapper > .data-remapping-slider > .ui-slider-handle:nth-child(3)');
        let $handleMarkerBar = $('<div>', {
            class: 'marker-bar handle-marker-bar'
        })

        $sliderMinHandle.append($handleMarkerBar);
        $sliderMaxHandle.append($handleMarkerBar.clone());
    }

    // Append the colormap canvas
    $colormapEditor.append($('<div>', {
        id: 'colormap',
        class: 'centered',
        title: 'Double-click to create a new color'
    }).append($('<canvas>', {
        class: 'colormap-canvas',
        attr: {
            width: width,
            height: height,
        }
    })).on('dblclick', (evt) => {
        let colormapLeftBound = evt.target.getBoundingClientRect().left;
        let colormapWidth = evt.target.width;
        let clickPercent = (evt.clientX - colormapLeftBound) / colormapWidth;
        let colorAtClick = activeColormap.lookupColor(clickPercent);
        $('#color-slider').append(ColorThumb(clickPercent, floatToHex(colorAtClick), () => {
            updateColormap();
            saveColormap();
        }));
        updateColormap();
    }));

    // Append the color swatch area
    $colormapEditor.append($('<div>', {
        id: 'color-slider',
        class: 'centered',
    }));


    // Add the UI buttons
    let $buttons = $('<div>', {
        class: 'centered',
    });

    // $buttons.append($('<button>', {
    //     class: 'save-colormap colormap-button',
    //     text: 'Save custom',
    //     title: 'Save custom colormap',
    // }).on('click', (evt) => {
    //     saveColormap().then((u) => {
    //         currentVisAssetJson = visassetJson;
    //         currentColormapUuid = u;
    //     });
    // }).prepend($('<span>', { class: 'ui-icon ui-icon-disk'})));

    $buttons.append($('<button>', {
        class: 'flip-colormap colormap-button',
        text: 'Flip',
        title: 'Flip colormap',
    }).on('click', (evt) => {
        activeColormap.flip();
        saveColormap().then((u) => {
            updateColormapDisplay();
            updateColorThumbPositions();
        });
    }).prepend($('<span>', { class: 'ui-icon ui-icon-arrowthick-2-e-w'})));

    $buttons.append($('<button>', {
        class: 'colormap-button',
        text: 'Save copy to library',
        title: 'Save a copy of this colormap to the local library for reuse in other visualizations',
    }).on('click', (evt) => {
        updateColormap();
        saveColormap().then((u) => {
            saveColormapToLibrary(u);
        });
    }).prepend($('<span>', { class: 'ui-icon ui-icon-disk'})));

    $colormapEditor.append($buttons);

    let $trash = $('<img>', {
        id: 'trash',
        src: `${STATIC_URL}compose/trash.svg`,
    }).droppable({
        tolerance: 'touch',
        accept: '.color-thumb',
        drop: (evt, ui) => {
            $(ui.draggable).remove();
            activeColormap = getColormapFromThumbs();
        },
        // Indicate that it's about to be deleted
        over: (_evt, ui) => {
            $(ui.helper).css('opacity', '25%');
        },
        out: (_evt, ui) => {
            $(ui.helper).css('opacity', '100%');
        }
    }).attr('title', 'Drop a color swatch here to discard');

    $colormapEditor.append($trash);

    // Populate the colors from xml
    activeColormap = ColorMap.fromXML(colormapXml);
    activeColormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color, () => {
            updateColormap();
            saveColormap();
        }));
    });
    updateColormap();

    if (variableInput) {
        updateHistogram(currentMinMax.min, currentMinMax.max);
    }
}

async function saveColormap() {
    let oldUuid = currentColormapUuid;
    let artifactJson = currentVisAssetJson;
    // Give it a new uuid if it doesn't already exist in localVisAssets
    let newUuid = oldUuid;
    if (!globals.stateManager.keyExists(['localVisAssets'], oldUuid)) {
        newUuid = uuid();
    }

    artifactJson['uuid'] = newUuid;

    // Gather the xml
    let xml = activeColormap.toXML();
    let data = {
        artifactJson,
        artifactDataContents: {
            'colormap.xml': xml,
        }
    };

    // Update the state with this particular local colormap
    // If the visasset isn't found on the server, abort
    let visAssetFound = await globals.stateManager.update(`localVisAssets/${newUuid}`, data)
        .then(() => true)
        .catch(() => false);
    if (!visAssetFound) {
        return oldUuid;
    }

    // Attach the new colormap, if we've changed UUIDs
    if (newUuid != oldUuid) {
        let pathsToUpdate = globals.stateManager.findPath((el) => {
            return el.hasOwnProperty('inputType') && 
                el.inputType == 'IVLab.ABREngine.ColormapVisAsset' &&
                el.hasOwnProperty('inputValue') && 
                el.inputValue == oldUuid
        });
        for (const p of pathsToUpdate) {
            globals.stateManager.update(`${p}/inputValue`, newUuid);
        }
    }

    currentVisAssetJson = artifactJson;
    currentColormapUuid = newUuid

    return newUuid;
}

async function saveColormapToLibrary(vaUuid) {
    return fetch('/api/save-local-visasset/' + vaUuid, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'X-CSRFToken': csrftoken,
        },
        mode: 'same-origin'
    });
}

function updateColormap() {
    updateSpectrum();
    activeColormap = getColormapFromThumbs();
    updateColorThumbPositions();
    updateColormapDisplay();
}

function getColormapFromThumbs() {
    let mapLeft = $('#colormap .colormap-canvas').position().left;
    let newcmap = new ColorMap();
    $('#color-slider .color-thumb').each((_i, el) => {
        let middle = ($(el).position().left - mapLeft) + $(el).width() / 2;
        let percentage = middle / $('#colormap .colormap-canvas').width();
        let color = $(el).find('input.color-input').val();
        newcmap.addControlPt(percentage, hexToFloat(color));
    });
    return newcmap;
}

function updateColormapDisplay() {
    let ctx = $('#colormap .colormap-canvas').get(0).getContext('2d');
    activeColormap.toCanvas(ctx);
}

function updateColorThumbPositions() {
    $('#color-slider').empty();
    activeColormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color, () => {
            updateColormap();
            saveColormap();
        }));
    });
    updateSpectrum();
}

function updateSpectrum() {
    // Remove all old spectrum containers
    $('.sp-container').remove();
    $('.color-input').spectrum({
        type: "color",
        showPalette: false,
        showAlpha: false,
        showButtons: false,
        allowEmpty: false,
        showInitial: true,
        showInput: true,
        showPalette: true,
        preferredFormat: 'hex',
    });
}

// Move the slider labels as the slider handles are dragged.
// ? Why do it like this: 
//     A different way to do this is to nest each label inside each handle, 
//     but this will trigger the 'slide' event every time we type in the label text boxes
//     -> trigger 'slide' callback
//     -> reset labels' <input> values before we finish typing
// ! Note:
//     Need to find a way to stop repeatedly querying for objects
function updateSliderLabelsPosition() {
    let $sliderMinLabel = $('#slider-minLabel');
    let $sliderMaxLabel = $('#slider-maxLabel');
    let $sliderMinHandle = $('#data-remapper > .data-remapping-slider > .ui-slider-handle:nth-child(2)');
    let $sliderMaxHandle = $('#data-remapper > .data-remapping-slider > .ui-slider-handle:nth-child(3)');

    $sliderMinLabel.offset({
        top: $sliderMinHandle.offset().top - 36,
        left: $sliderMinHandle.offset().left - 40,
    });
    $sliderMaxLabel.offset({
        top: $sliderMaxHandle.offset().top - 36,
        left: $sliderMaxHandle.offset().left - 40,
    });
}

function updateHistogram(minm, maxm) {
    // In case there were any old histograms hanging out
    d3.selectAll('#histogram > *').remove();

    if (typeof(minm) === 'undefined' || typeof(maxm) === 'undefined') {
        [minm, maxm] = d3.extent(zippedHistogram.histogram, (d) => d.binMax);
    }

    let svg = d3.select("#histogram")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", histogramHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

    // X axis is the values in the histogram
    let x = d3.scaleLinear()
        .domain([minm, maxm])
        .range([0, width]);
    svg.append('g')
        .attr('transform', `translate(0, ${histogramHeight})`)
        .call(d3.axisBottom(x));

    // Y axis is the num items in each bin
    let y = d3.scaleLinear()
        .domain(d3.extent(zippedHistogram.histogram, (d) => d.items))
        .range([histogramHeight, 0]);

    svg.append('path')
        .datum(zippedHistogram.histogram)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line()
            .x((d) => x(d.binMax))
            .y((d) => y(d.items))
        );

    // Update the slider values, and register the callback for interactively
    // changing the min/max
    let extent = maxm - minm;
    let outsideMargin = 0.1;
    let marginExtent = outsideMargin * extent;
    $('.data-remapping-slider')
        .slider('option', 'min', minm - marginExtent)
        .slider('option', 'max', maxm + marginExtent)
        .slider('option', 'step', extent / width)
        .slider('values', 0, minm)
        .slider('values', 1, maxm)
        .slider('option', 'slide', (evt, ui) => {
            let [filterMin, filterMax] = ui.values;
            $('#slider-minLabel').val(filterMin);
            $('#slider-maxLabel').val(filterMax);
            updateSliderLabelsPosition();
        });

    // Update the numbers to reflect
    $('#slider-minLabel').val(minm.toFixed(4));
    $('#slider-maxLabel').val(maxm.toFixed(4));

    updateSliderLabelsPosition();

    currentMinMax = {
        min: minm,
        max: maxm,
    }

    // Update the Server with the min/max from this slider
    globals.stateManager.update(`dataRanges/scalarRanges/"${currentVarPath}"`, currentMinMax);
}