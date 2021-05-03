/* ColormapDialog.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 *
 */

import { globals } from '../../../../common/globals.js';
import { ColorMap, floatToHex, hexToFloat } from './color.js';
import { ColorThumb } from './components.js';

const margin = { top: 10, right: 0, bottom: 20, left: 0 };
const dialogWidth = 700;
const numBins = 540;
const width = numBins - margin.left - margin.right;
const height = 100 - margin.top - margin.bottom;
const histogramHeight = 200 - margin.top - margin.bottom;

export async function ColormapDialog(uuid, keyDataInput, variableInput) {
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
        saveColormap(uuid, colormap);
    }));

    $buttons.append($('<button>', {
        class: 'flip-colormap colormap-button',
        text: '< Flip colormap >',
        title: 'Flip colormap',
    }).on('click', (evt) => {
        colormap.flip();
        updateColormapDisplay(colormap);
        updateColorThumbPositions(colormap);
    }));

    $buttons.append($('<button>', {
            class: 'create-color colormap-button',
            text: '(+) Add color',
            title: 'Add a new color to the colormap',
        }).on('click', (evt) => {
            let defaultPerc = 0.5;
            let colorAtDefault = colormap.lookupColor(defaultPerc);
            $('#color-slider').append(ColorThumb(defaultPerc, colorAtDefault, updateColormap));
            updateColormap();
    }));

    $colormapEditor.append($buttons);

    let $trash = $('<img>', {
        id: 'trash',
        src: `${STATIC_URL}compose/trash.svg`,
    }).droppable({
        tolerance: 'touch',
        accept: '.color-thumb',
        drop: (evt, ui) => {
            colormap = getColormapFromThumbs();
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

    $colormapEditor.append($trash);

    $colormapEditor.dialog({
        'title': 'Colormap Editor',
        'minWidth': dialogWidth,
    });


    // Populate the colors from xml
    let colormap = ColorMap.fromXML(colormapXml);
    colormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color, updateColormap));
    });
    updateColormap();
}

function saveColormap(uuid, colormap) {
    console.log('saving colormap ' + uuid);
}

function updateColormap() {
    let newcmap = getColormapFromThumbs();
    updateColormapDisplay(newcmap);
    updateColorThumbPositions(newcmap);
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

function updateColormapDisplay(colormap) {
    let ctx = $('#colormap .colormap-canvas').get(0).getContext('2d');
    colormap.toCanvas(ctx);
}

function updateColorThumbPositions(colormap) {
    $('#color-slider').empty();
    colormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color, updateColormap));
    });

    $('.color-input').spectrum({
        type: "color",
        showPalette: false,
        showAlpha: false,
        showButtons: false,
        allowEmpty: false,
        preferredFormat: 'hex',
    });
}