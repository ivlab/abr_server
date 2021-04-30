import { storage } from "./storage.js";
import { floatToHex, ColorMap, hexToFloat } from "./color.js";

// Canvas for exporting thumbnail.png
const exportWidth = 200;
const exportHeight = 30;
var EXPORT_CANVAS = document.createElement('canvas');
EXPORT_CANVAS.width = exportWidth;
EXPORT_CANVAS.height = exportHeight;


export function updateColormapOnServer() {
    let serializedXML = storage.colormap.toXML();

    // Splat the colormap onto another canvas for exporting the correct dimensions
    let screenThumbnail = $('#colormap .colormap-canvas').get(0);//.toDataURL('image/png');
    let ctx = EXPORT_CANVAS.getContext('2d');
    ctx.drawImage(
        screenThumbnail,
        0, 0,
        screenThumbnail.width, screenThumbnail.height,
        0, 0,
        exportWidth, exportHeight
    );

    let thumbnail = EXPORT_CANVAS.toDataURL('image/png');
    let firstComma = thumbnail.indexOf(',');
    thumbnail = thumbnail.slice(firstComma + 1);

    let postData = {
        uuid: storage.colormapUUID,
        pngB64: thumbnail,
        colormapXML: serializedXML,
    };
    $.ajax({
        url: '/api/update-colormap/',
        type: 'post',
        data: JSON.stringify(postData),
    })
        // .then((_msg) => $('#colormap-save-spinner').css('visibility', 'hidden'))
        .catch((err) => {
            alert('Error updating colormap');
            console.log(err);
        });
}

export function recomputeColorMap() {
    let mapLeft = $('#colormap .colormap-canvas').position().left;
    let colormap = new ColorMap();
    $('#color-slider .color-thumb').each((_i, el) => {
        let middle = ($(el).position().left - mapLeft) + $(el).width() / 2;
        let percentage = middle / $('#colormap .colormap-canvas').width();
        let color = $(el).find('input.color-input').val();
        colormap.addControlPt(percentage, hexToFloat(color));
    });
    storage.colormap = colormap;
}

function recomputeColorThumbPositions() {
    $('#color-slider').empty();
    storage.colormap.entries.forEach((c) => {
        let pt = c[0];
        let color = floatToHex(c[1]);
        $('#color-slider').append(ColorThumb(pt, color));
    });
    // let mapLeft = $('#colormap .colormap-canvas').position().left;
    // let mapWidth = $('#colormap .colormap-canvas').width();
    // $('#color-slider .color-thumb').each((i, el) => {
    //     let posInMap = storage.colormap.entries[i][0] * mapWidth;
    //     let pos = mapLeft + posInMap;// - $(el).width() / 2;
    //     $(el).css('left', pos);
    //     // let middle = ($(el).position().left - mapLeft) + $(el).width() / 2;
    //     // let percentage = middle / $('#colormap .colormap-canvas').width();
    //     // let color = $(el).find('input.color-input').val();
    //     // colormap.addControlPt(percentage, hexToFloat(color));
    // });
    // storage.colormap = colormap;
}

function createGradient($canvas, colorStops) {
    let ctx = $canvas.get(0).getContext('2d');
    let mapWidth = $('#colormap .colormap-canvas').width();
    let mapHeight = $('#colormap .colormap-canvas').height();
    if (colorStops) {
        // Draw a bunch of tiny rectangles with properly interpolated CIE Lab color
        for (let x = 0; x < mapWidth; x++) {
            let percentage = x / mapWidth;
            let color = colorStops.lookupColor(percentage);
            ctx.fillStyle = floatToHex(color);
            ctx.fillRect(x, 0, 1, mapHeight);
        }
    }
}

export function updateColorThumbs(recompute=true) {
    if (recompute) {
        recomputeColorMap();
    } else {
        recomputeColorThumbPositions();
    }

    let colormap = storage.colormap;
    let $canvas = $('#colormap .colormap-canvas');
    createGradient($canvas, colormap);

    $('.color-input').spectrum({
        type: "color",
        showPalette: false,
        showAlpha: false,
        showButtons: false,
        allowEmpty: false,
        preferredFormat: 'hex',
    });
    // updateColormapOnServer();
}

// -------------------- Begin components --------------------

export function ColorThumb(perc, color) {
    let defaultPt = 0.5;
    perc = perc || defaultPt;
    color = color || floatToHex(storage.colormap.lookupColor(defaultPt));
    let mapLeft = $('#colormap .colormap-canvas').position().left;
    let mapTop = $('#colormap .colormap-canvas').position().top;
    let mapWidth = $('#colormap .colormap-canvas').width();
    let mapHeight = $('#colormap .colormap-canvas').height();
    let left = mapLeft + mapWidth * perc;
    let $thumb = $('<div>', {
        class: 'color-thumb',
    }).draggable({
        drag: (_evt, ui) => {
            let middle = ($(ui.helper).position().left - mapLeft) + $(ui.helper).width() / 2;
            // let percentage = middle / $('#colormap .colormap-canvas').width();
            // $(ui.helper).find('.percentage-display').text(`${(percentage * 100).toFixed(0)}%`);
        },
        stop: (_evt, _ui) => {
            updateColorThumbs()
        }
    }).append(
        $('<input>', {
            class: 'color-input',
            value: color,
        }).on('change', () => updateColorThumbs())
    // ).append(
    //     $('<div>', {
    //         class: 'percentage-display',
    //         text: `${(perc * 100).toFixed(0)}%`
    //     })
    ).append(
        $('<div>', {
            class: 'marker-bar',
        }).css('height', mapHeight * 3).css('top', -mapHeight * 3)
    ).css('position', 'absolute');

    // 25 = ((spectrum input) + margin) / 2
    $thumb.css('left', left - 25);
    return $thumb;
}

export function DataRemappingSlider(min, max, val1, val2, width) {
    let outsideMargin = 0.1;
    let expandedWidth = width + (width * outsideMargin * 2);
    return $('<div>', {
        class: 'data-remapping-slider',
        css: {
            width: expandedWidth,
        },
    }).slider({
        range: true,
        min: min,
        max: max,
        values: [val1, val2],
        step: 0.1,
        disabled: false,
        // slide: (evt, ui) => {
        //     console.log(`min/max: ${$(evt.target).slider('option', 'min')}, ${$(evt.target).slider('option', 'max')}`)
        //     console.log(`sliding: ${ui.values}`);
        // },
        // change: (evt, ui) => {
        //     console.log(`changed ${ui.values}`);
        // }
    });
}