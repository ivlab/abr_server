// -------------------- Begin components --------------------

export function ColorThumb(perc, color, colorChangeCallback) {
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
        stop: colorChangeCallback,
    }).append(
        $('<input>', {
            class: 'color-input',
            value: color,
        }).on('change', colorChangeCallback)
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