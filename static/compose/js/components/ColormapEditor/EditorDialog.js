/* EditorDialog.js
 *
 * Dialog that enables a user to remap data ranges for scalar variables and edit
 * colormaps, visasset gradients, and primitive gradients.
 *
 * Copyright (C) 2022, University of Minnesota
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
import { ColorMap, floatToHex, hexToFloat } from './color.js';
import { ColorThumb, dialogWidth, width, height } from './components.js';
import { HistogramEditor } from './HistogramEditor.js';

// Unified for editing anything that's assocated with a particular variable.
//
// Exhaustive options (all include variable range editor w/histogram):
// - Colormap (glyph, ribbon, surface, volume)
// - Colormap + Primitive Gradient (volume)
// - VisAsset Gradient (glyph ribbon, surface)
// - VisAsset Gradient + Colormap (glyph ribbon, surface)
//
// Configuration is determined based on variable inputs. For example, if the
// variable `Test/Cube/ScalarVar/XAxis` is assigned to both the Glyph Variable
// and the Colormap Variable, both the VisAsset Gradient Editor and the Colormap
// editor will be shown in the dialog.
//
// Needs the following input:
// - The entire input properties object of the item that was clicked to edit
// - UUID of the data impression the item that was clicked to edit
//
// Each dialog unit is represented as a "Module" that is included or not based
// on inputs from the current data impression.
export async function EditorDialog(inputProps, impressionUuid) {
    let $editorDialog = $('<div>', {
        class: 'editor-dialog'
    });

    // There can only be one editor
    if ($('.editor-dialog').length > 0 && $('.editor-dialog').dialog('isOpen')) {
        alert('There is already an editor dialog open.');
        return;
    }

    // Get rid of any previous instances of the editor dialog that were hidden
    // jQuery UI dialogs just hide the dialog when it's closed
    $('.editor-dialog').remove();

    // SETUP: Figure out what "modules" are needed for this editor.
    // We need to determine the variable that is associated with the input
    // that was clicked to edit. Only display this stuff if the input is
    // associated with a data impression.
    if (impressionUuid) {
        // First, get the key data for the data impression this input is associated with
        let keyDataInput = null;
        let keyDataStatePath = globals.stateManager.findPath((s) => {
            return s.hasOwnProperty('inputGenre') &&
                s['inputGenre'] == 'KeyData' && 
                s.hasOwnProperty('parameterName') &&
                s['parameterName'] == 'Key Data'
        }).find((p) => p.split('/')[2] == impressionUuid);
        if (keyDataStatePath) {
            keyDataInput = globals.stateManager.getPath(keyDataStatePath);
        }

        // Then, get the all other variables associated with this input
        // Find the variable that's paired with this input
        let paramName = inputProps.parameterName
        let associatedVars = globals.stateManager.findAll((s) => {
            return s.hasOwnProperty('inputGenre') &&
                s['inputGenre'] == 'Variable' && 
                s.hasOwnProperty('parameterName') &&
                s['parameterName'] == paramName
        }).map((v) => v.inputValue);

        let impressionInputs = globals.stateManager.state.impressions[impressionUuid].inputValues;
        let relevantInputs = Object.keys(impressionInputs).filter((n) => associatedVars.indexOf(impressionInputs[n].inputValue) >= 0);

        let $histogramModule = await HistogramEditor(impressionInputs[relevantInputs[0]], keyDataInput);
        $editorDialog.append($histogramModule);
    }

    $editorDialog.dialog({
        'title': 'Editor (CHANGE ME!!!',
        'minWidth': dialogWidth,
    });
}