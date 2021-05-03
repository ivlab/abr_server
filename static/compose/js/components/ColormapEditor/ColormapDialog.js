/* ColormapDialog.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 *
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

export async function ColormapDialog(uuid, variableInput, keyDataInput) {
    let visassetJson = null;
    let colormapXml = null;
    if (globals.stateManager.keyExists(['localVisAssets'], uuid)) {
        let va = globals.stateManager.state.localVisAssets[uuid];
        visassetJson = va.artifactJson;
        colormapXml = va.artifactDataContents[visassetJson['artifactData']['colormap']];
    } else {
        let visassets = globals.stateManager.getCache('visassets');
        if (visassets && visassets[uuid]) {
            visassetJson = visassets[uuid];
        }

        // Fetch the colormap xml from the server
        if (visassetJson) {
            let xmlName = visassetJson['artifactData']['colormap'];
            let xmlUrl = `/media/visassets/${uuid}/${xmlName}`;
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

    // Get rid of any previous instances of the colormap editor that were hidden
    // jQuery UI dialogs just hide the dialog when it's closed
    $('.colormap-editor').remove();

    let $colormapEditor = $('<div>', {
        id: 'colormap-editor',
        class: 'colormap-editor',
    });

    // Label the min/max of the histogram (only if there's a variable attached)
    if (variableInput) {
        currentVarPath = variableInput.inputValue;
        let variableName = DataPath.getName(variableInput.inputValue);
        let keyDataName = DataPath.getName(keyDataInput.inputValue);

        // Try to get the current min/max from state if it's been redefined
        if (globals.stateManager.state.dataRanges && globals.stateManager.state.dataRanges.scalarRanges) {
            currentMinMax = globals.stateManager.state.dataRanges.scalarRanges[currentVarPath];
        }


        // Fetch the min/max value from the server with the histogram
        let url = new URL(`${window.location}api/histogram/${keyDataInput.inputValue}/${variableName}`);
        url.search = new URLSearchParams(currentMinMax);

        zippedHistogram = await fetch(url).then((resp) => resp.json());

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
                    'background-color': 'white'
                }
            }).append(
                $('<div>', {
                    class: 'variable-labels',
                }).append($('<p>', {
                    text: currentMinMax.min.toFixed(4),
                    id: 'slider-minLabel'
                })).append($('<p>', {
                    html: `<em>${keyDataName} &rarr; <strong>${variableName}</strong></em>`,
                })).append($('<p>', {
                    text: currentMinMax.max.toFixed(4),
                    id: 'slider-maxLabel'
                }))
            )
        );
        $colormapEditor.append(
            $('<div>', {
                id: '#data-remapper',
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
        )
    }

    // Append the colormap canvas
    $colormapEditor.append($('<div>', {
        id: 'colormap',
        class: 'centered',
    }).append($('<canvas>', {
        class: 'colormap-canvas',
        attr: {
            width: width,
            height: height,
        }
    })));

    // Append the color swatch area
    $colormapEditor.append($('<div>', {
        id: 'color-slider',
        class: 'centered',
    }).width(dialogWidth).height('6rem'));


    // Add the UI buttons
    let $buttons = $('<div>', {
        class: 'centered',
    });

    $buttons.append($('<button>', {
        class: 'save-colormap colormap-button',
        text: 'Save Colormap',
        title: 'Save the colormap',
    }).on('click', (evt) => {
        uuid = saveColormap(uuid, visassetJson);
    }));

    $buttons.append($('<button>', {
        class: 'flip-colormap colormap-button',
        text: '< Flip colormap >',
        title: 'Flip colormap',
    }).on('click', (evt) => {
        activeColormap.flip();
        updateColormapDisplay();
        updateColorThumbPositions();
    }));

    $buttons.append($('<button>', {
            class: 'create-color colormap-button',
            text: '(+) Add color',
            title: 'Add a new color to the colormap',
        }).on('click', (evt) => {
            let defaultPerc = 0.5;
            let colorAtDefault = activeColormap.lookupColor(defaultPerc);
            $('#color-slider').append(ColorThumb(defaultPerc, floatToHex(colorAtDefault), () => {
                activeColormap = updateColormap();
            }));
            activeColormap = updateColormap();
    }));

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

    $colormapEditor.dialog({
        'title': variableInput ? 'Colormap + Variable Range Editor' : 'Colormap Editor',
        'minWidth': dialogWidth,
    });


    // Populate the colors from xml
    activeColormap = ColorMap.fromXML(colormapXml);
    activeColormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color, () => {
            activeColormap = updateColormap();
        }));
    });
    activeColormap = updateColormap();

    if (variableInput) {
        updateHistogram(currentMinMax.min, currentMinMax.max);
    }
}

function saveColormap(oldUuid, artifactJson) {
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
    globals.stateManager.update(`localVisAssets/${newUuid}`, data);

    return newUuid;
}

function updateColormap() {
    updateSpectrum();
    let newcmap = getColormapFromThumbs();
    updateColormapDisplay();
    updateColorThumbPositions();
    return newcmap;
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
            activeColormap = updateColormap()
        }));
    });
    updateSpectrum();
}

function updateSpectrum() {
    $('.color-input').spectrum({
        type: "color",
        showPalette: false,
        showAlpha: false,
        showButtons: false,
        allowEmpty: false,
        preferredFormat: 'hex',
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
            $('.variable-labels #slider-minLabel').text(filterMin);
            $('.variable-labels #slider-maxLabel').text(filterMax);
        });

    // Update the numbers to reflect
    $('.variable-labels #slider-minLabel').text(minm.toFixed(4));
    $('.variable-labels #slider-maxLabel').text(maxm.toFixed(4));

    currentMinMax = {
        min: minm,
        max: maxm,
    }

    // Update the Server with the min/max from this slider
    globals.stateManager.update(`dataRanges/scalarRanges/"${currentVarPath}"`, currentMinMax);
}