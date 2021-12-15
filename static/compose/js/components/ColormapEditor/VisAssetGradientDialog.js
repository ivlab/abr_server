/* VisAssetGradientDialog.js
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

import { globals } from "../../../../common/globals.js";
import { uuid } from "../../../../common/UUID.js";
import { gradientTypeMap, typeMap } from "../PuzzlePiece.js";

const dialogWidth = 1000;

var currentGradient = null;

function ResizableSection(sectionWidth, uuid, leftPerc, rightPerc, resizable) {
    let $section = $('<div>', {
        class: 'resizable-section',
        width: sectionWidth,
    });
    $section.data({uuid});
    let $leftDrop = $('<div>', {
        class: 'quick-drop quick-drop-left',
    });
    let $rightDrop = $('<div>', {
        class: 'quick-drop quick-drop-right',
    });
    let dropIndicatorOver = (evt, ui) => $(evt.target).addClass('active');
    let dropIndicatorOut = (evt, ui) => $(evt.target).removeClass('active');
    let dropIndicatorDrop = (evt, ui) => {
        $(evt.target).removeClass('active');
        let left = $(evt.target).hasClass('quick-drop-left');
        let newVisAssetUuid = $(ui.draggable).data('inputValue');
        let newVisAssetType = $(ui.draggable).data('inputType');
        let thisUuid = $section.data('uuid');
        addGradientStopRelative(newVisAssetUuid, newVisAssetType, thisUuid, left);
        updateGradientDisplay();
        saveGradient();
    };
    let dropParams = {
        tolerance: 'intersect',
        over: dropIndicatorOver,
        out: dropIndicatorOut,
        drop: dropIndicatorDrop,
    };

    $leftDrop.droppable(dropParams);
    $rightDrop.droppable(dropParams);
    $section.append($leftDrop);
    $section.append($rightDrop);

    $section.append($('<p>', {
        class: 'left-section-label',
        text: `${Math.round(leftPerc * 100)}%`
    }));

    $section.append(
        $('<img>', {
            src: `/media/visassets/${uuid}/thumbnail.png`,
        })
    );

    $section.append($('<p>', {
        class: 'right-section-label',
        text: `${Math.round(rightPerc * 100)}%`
    }));

    let percentage = 0;
    let startWidth = 0;
    let nextStartWidth = 0;
    if (resizable) {
        $section.resizable({
            handles: 'e',
            start: (evt, ui) => {
                startWidth = $(evt.target).width();
                nextStartWidth = $(evt.target).next().width();
            },
            resize: (evt, ui) => {
                let sectionWidth = $(evt.target).width();
                let widthDiff = startWidth - sectionWidth;

                $(evt.target).next().width(nextStartWidth + widthDiff);

                let $panel = $(evt.target).parents('.gradient-panel');
                percentage = ($(evt.target).position().left + $(evt.target).width()
                    - $panel.position().left) / $panel.width();

                let percFormat = `${(percentage * 100).toFixed(0)}%`;
                $(evt.target).find('.right-section-label').text(percFormat);
                $(evt.target).next().find('.left-section-label').text(percFormat);
            },
            stop: (evt, ui) => {
                // Update the actual gradient
                let visAssetIndex = currentGradient.visAssets.indexOf($section.data('uuid'));
                if (visAssetIndex >= 0 && visAssetIndex < currentGradient.points.length) {
                    currentGradient.points[visAssetIndex] = percentage;
                    saveGradient();
                }
            }
        });
    }

    return $section;
}

function getVisAssetType(abrType) {
    return Object.keys(typeMap).find(k => typeMap[k] == abrType && (!typeMap[currentGradient.gradientType] || typeMap[currentGradient.gradientType] == abrType));
}

function gradientTypeValid(abrType) {
    let vaType = getVisAssetType(abrType);
    let gradValid = Object.keys(gradientTypeMap).indexOf(vaType) >= 0;
    return vaType && gradValid;
}

function addGradientStopRelative(uuid, abrType, existingUuid, leftOf) {
    if (!gradientTypeValid(abrType)) {
        return;
    }
    let thisIndex = currentGradient.visAssets.indexOf(existingUuid);
    let pointsIndex = thisIndex - 1;
    let thisPercentage = pointsIndex >= 0 ? currentGradient.points[pointsIndex] : 0.0;
    let nextPercentage = thisIndex < currentGradient.points.length ? currentGradient.points[thisIndex] : 1.0;

    // insert the new uuid to the left (or right) of existing uuid
    let newPoint = (nextPercentage - thisPercentage) / 2.0 + thisPercentage;
    console.log(`t: ${thisIndex}, p: ${pointsIndex}, t%: ${thisPercentage}, n%: ${nextPercentage}, newPoint: ${newPoint}, left: ${leftOf}`);
    currentGradient.points.splice(thisIndex, 0, newPoint);
    if (leftOf) {
        currentGradient.visAssets.splice(thisIndex, 0, uuid);
    } else {
        currentGradient.visAssets.splice(thisIndex + 1, 0, uuid);
    }
}

function addGradientStop(uuid, abrType, position) {
    if (!gradientTypeValid(abrType)) {
        return;
    }
    currentGradient.gradientType = getVisAssetType(abrType);
    currentGradient.visAssets.push(uuid);
    if (currentGradient.visAssets.length > 1) {
        currentGradient.points.push(position);
    }
}

function updateGradientDisplay() {
    let $gradient = $('#the-gradient');
    $gradient.empty();

    // Take borders into account
    let panelWidth = $gradient.width() - currentGradient.visAssets.length;
    for (let vaIndex = 0; vaIndex < currentGradient.visAssets.length; vaIndex++) {
        let thisPercentage = currentGradient.points[vaIndex - 1] || 0.0;
        let nextPercentage = currentGradient.points[vaIndex] || 1.0;
        $gradient.append(
            ResizableSection(
                panelWidth * (nextPercentage - thisPercentage),
                currentGradient.visAssets[vaIndex],
                thisPercentage,
                nextPercentage,
                vaIndex < currentGradient.visAssets.length - 1
            )
        );
    }
}

function saveGradient() {
    globals.stateManager.update(`visAssetGradients/${currentGradient.uuid}`, currentGradient);
}

export function VisAssetGradientDialog(gradientUuid) {
    $('#vis-asset-gradient-dialog').remove();

    let $visAssetGradientDialog = $('<div>', {
        id: 'vis-asset-gradient-dialog',
        class: 'puzzle-piece-overlay-dialog'
    });

    $visAssetGradientDialog.dialog({
        'title': 'VisAsset Gradient Editor',
        'minWidth': dialogWidth,
        close: (evt, ui) => {
            $('#vis-asset-gradient-dialog').remove();
        }
    })

    // Build the gradient and allow it to respond to new VisAssets that are drag-n-dropped
    let $gradient = $('<div>', {
        id: 'the-gradient',
        class: 'gradient-panel',
    }).droppable({
        tolerance: 'touch',
        drop: (evt, ui) => {
            if (currentGradient.visAssets.length == 0) {
                let visAssetUuid = $(ui.draggable).data('inputValue');
                let visAssetType = $(ui.draggable).data('inputType');
                addGradientStop(visAssetUuid, visAssetType, 0.0);
                updateGradientDisplay();
                saveGradient();
            }
        }
    });

    $visAssetGradientDialog.append($gradient);

    // Retrieve gradient from state, if any
    if (globals.stateManager.state.visAssetGradients && globals.stateManager.state.visAssetGradients[gradientUuid]) {
        currentGradient = globals.stateManager.state.visAssetGradients[gradientUuid];
    } else {
        // Otherwise, set up default
        gradientUuid = uuid();
        currentGradient = {
            uuid: gradientUuid,
            gradientScale: 'discrete',
            gradientType: null, // will be defined once we drag-n-drop visassets
            points: [],
            visAssets: [],
        }
    }
}