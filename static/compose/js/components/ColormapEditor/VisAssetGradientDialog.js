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

const dialogWidth = 1000;
const GLYPHS = [
    '1af02cb2-f1ed-11e9-a623-8c85900fd4af',
    '1af025aa-f1ed-11e9-a623-8c85900fd4af',
    '1af030a4-f1ed-11e9-a623-8c85900fd4af',
    '1af035ea-f1ed-11e9-a623-8c85900fd4af',
];

function ResizableSection(sectionWidth, uuid, leftPerc, rightPerc, resizable) {
    let $section = $('<div>', {
        class: 'resizable-section',
        width: sectionWidth,
    });

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
            }
        });
    }

    return $section;
}

export function VisAssetGradientDialog() {
    let $visAssetGradientDialog = $('<div>', {
        id: 'vis-asset-gradient-dialog',
    });

    $visAssetGradientDialog.dialog({
        'title': 'VisAsset Gradient Editor',
        'minWidth': dialogWidth,
    })

    let $gradient = $('<div>', {
        id: 'the-gradient',
        class: 'gradient-panel',
    });

    $visAssetGradientDialog.append($gradient);

    // Take borders into account
    let panelWidth = $gradient.width() - GLYPHS.length;

    for (let g = 0; g < GLYPHS.length; g++) {
        let thisPercentage = (g / GLYPHS.length);
        let nextPercentage = ((g + 1) / GLYPHS.length);
        $gradient.append(
            ResizableSection(
                panelWidth / GLYPHS.length,
                GLYPHS[g],
                thisPercentage,
                nextPercentage,
                g < GLYPHS.length - 1
            )
        );
    }
}