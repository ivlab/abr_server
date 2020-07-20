/* Inputs.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * User input for the compose UI
 */

import { messenger } from "../AbrMessenger.js";

export function MinMaxBox(val, step, onChange) {
    return $('<input>', {class: 'min-max-box', type: 'number', value: val, step: step}).on('change', onChange);
}

// A min/max slider for selecting floating point values
export function MinMaxSlider(min, max, val1, val2, onSliderChange, onNumericChange, addClasses, step=0.1) {
    let $container = $('<div>', {class: 'slider-container'});
    let $slider = $('<div>', {
        class: `min-max-slider ${addClasses}`,
        title: 'Hold shift to enable higher precision while dragging'
    }).slider({
        range: true,
        min: min,
        max: max,
        values: [val1, val2],
        slide: (evt, ui) => {
            // Update the labels, then call callback
            $(evt.target).parents('.slider-container').find('input:nth-child(1)').val(ui.values[0]);
            $(evt.target).parents('.slider-container').find('input:nth-child(2)').val(ui.values[1]);
        },
        change: onSliderChange,
        step: step,
    }).on('keydown', (evt) => {
        if (evt.key == 'Shift') {
            let $slider = $(evt.target).parents('.min-max-slider');
            $slider.slider('option', 'step', step * 0.001);
        }
    }).on('keyup', (evt) => {
        if (evt.key == 'Shift') {
            let $slider = $(evt.target).parents('.min-max-slider');
            $slider.slider('option', 'step', step);
        }
    });

    $container.append(
        $slider
    ).append(
        $('<div>', {class: 'slider-inputs'}).append(
            MinMaxBox(val1, step, onNumericChange)
        ).append(
            MinMaxBox(val2, step, onNumericChange)
        )
    );

    return $container;
}

// A data remapping slider, consisting of two MinMaxSliders
export function DataRemappingSlider(dataMin, dataMax, remappedMin, remappedMax, onSliderChange, onNumericChange, step=0.1) {
    // Find the min-ist min and max-ist max (for showing bounds)
    let minMin = Math.min(dataMin, remappedMin);
    let maxMax = Math.max(dataMax, remappedMax);
    let range = maxMax - minMin;
    let buffer = range * 0.2; // Give 20% margin at the edges
    let bufMin = minMin - buffer;
    let bufMax = maxMax + buffer;

    let $slider = $('<div>', { class: 'data-remapping-slider' }
    ).append(
        MinMaxSlider(bufMin, bufMax, remappedMin, remappedMax, onSliderChange, onNumericChange, 'remapping-slider', step)
    ).append(
        $('<button>', {
            text: 'Reset',
        }).on('click', (evt) => {
            $(evt.target).prev('.slider-container').find('.min-max-slider').slider('values', 0, dataMin);
            $(evt.target).prev('.slider-container').find('.min-max-slider').slider('values', 1, dataMax);
        })
    ).append(
        $('<div>', {class: 'inline data-show'}).append(
            $('<div>', {text: 'Data:'})
        ).append(
            $('<span>', {text: `${dataMin.toFixed(3)} - ${dataMax.toFixed(3)}`})
        )
    );

    return $slider;
}

export function LightInfo(light) {
    return $('<div>', {
        class: 'light-info',
    }).append(
        LightInputBox('Intensity:', light.intensity, 0.05)
    ).append(
        LightInputBox('X Rotation:', light.directionX, 0.5)
    ).append(
        LightInputBox('Y Rotation:', light.directionY, 0.5)
    ).append(
        LightInputBox('Z Rotation:', light.directionZ, 0.5)
    );
}

function LightInputBox(label, initValue, step) {
    return $('<div>').append(
        $('<p>', {text: label})
    ).append(
        $('<input>', {
            type: 'number',
            value: initValue,
            step: step,
        }).on('change', (evt) => {
            let fields = [
                'intensity',
                'directionX',
                'directionY',
                'directionZ',
            ];
            let lightList = [];
            $('.light-info').each((_i, light) => {
                let lightInfo = {};
                $(light).find('input').each((i, field) => {
                    lightInfo[fields[i]] = parseFloat($(field).val());
                });
                lightList.push(lightInfo);
            });
            messenger.sendUpdate({
                type: 'UpdateLights',
                lightList: lightList,
            });
        })
    );
}