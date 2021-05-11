/* VariableList.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Authors: Bridger Herman <herma582@umn.edu>
 *
 */

import { DataPath, VARIABLE_TYPEMAP } from "../../../common/DataPath.js";
import { globals } from "../../../common/globals.js";

export function VariableList(varNames, statePath, variableData, keyDataPath) {
    $('#variable-list').remove();

    let $el = $('<ul>', {
        id: 'variable-list', // only support one open at a time
        css: { 'z-index': 1000 },
    });

    let dsPath = DataPath.getDatasetPath(keyDataPath);
    let pathType = VARIABLE_TYPEMAP[variableData.inputType];
    let pathTypePath = DataPath.join(dsPath, pathType);
    for (const varName of varNames) {
        $el.append(
            $('<li>').append(
                $('<p>', { text: varName })
            ).on('click', (evt) => {
                evt.stopPropagation();
                variableData.inputValue = DataPath.join(pathTypePath, varName);
                globals.stateManager.update(statePath, variableData);
                $('#variable-list').remove();
            })
        )
    }

    let outTimer = null;
    $el.menu().on('mouseout', (evt) => {
        outTimer = setTimeout(() => $('#variable-list').remove(), 500);
    }).on('mouseover', (evt) => {
        clearTimeout(outTimer);
        outTimer = null;
    });

    return $el;
}