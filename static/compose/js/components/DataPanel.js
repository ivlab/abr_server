/* components/DataPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Data panel (left side of the ABR Compose UI)
 */

import { DataPath } from "../../../common/DataPath.js";
import { InputPuzzlePiece } from "./PuzzlePiece.js";
import { SwatchList } from "./SwatchList.js";

// https://docs.unity3d.com/ScriptReference/MeshTopology.html
// https://stackoverflow.com/a/51976841
// https://github.umn.edu/ivlab-cs/ABRUtilities/blob/master/ABRDataFormat/abr_data_format/ABRDataFormat.py
const MESH_TOPOLOGY_MAP = {
    0: 'IVLab.ABREngine.SurfaceKeyData',
    2: 'IVLab.ABREngine.SurfaceKeyData',
    3: 'IVLab.ABREngine.LineKeyData',
    4: 'IVLab.ABREngine.LineKeyData',
    5: 'IVLab.ABREngine.PointKeyData',
    100: 'IVLab.ABREngine.PointKeyData', // TODO: support this
};

export function DataPanel() {
    let $dataPanel = $('<div>', {
        class: 'panel',
        id: 'data-panel',
    });

    $dataPanel.append($('<p>', {
        class: 'panel-header',
        text: 'Data Palette',
    }));

    fetch('/api/datasets')
        .then((resp) => resp.json())
        .then((datasets) => {
            console.log(datasets);
            for (const org in datasets) {
                for (const dataset in datasets[org]) {
                    let keydataList = [];
                    let scalarVarNames = new Set();
                    let vectorVarNames = new Set();
                    for (const keydata in datasets[org][dataset]) {
                        let metadata = datasets[org][dataset][keydata]
                        let keyDataInput = {
                            inputType: MESH_TOPOLOGY_MAP[metadata.meshTopology],
                            inputGenre: 'KeyData',
                            inputValue: DataPath.makePath(org, dataset, 'KeyData', keydata),
                        };

                        keydataList.push(
                            InputPuzzlePiece(keydata, keyDataInput).draggable({
                                helper: 'clone',
                                cursor: 'grabbing',
                            })
                        );

                        // Vars may be shared between KeyData, so make sure only
                        // one of each appears in the panel
                        for (const name of metadata.scalarArrayNames) {
                            scalarVarNames.add(name);
                        }
                        for (const name of metadata.vectorArrayNames) {
                            vectorVarNames.add(name);
                        }
                    }

                    let scalarVarList = [...scalarVarNames]
                        .filter((n) => n && n.length > 0)
                        .map((n) => {
                            let scalarVarInput = {
                                inputType: 'IVLab.ABREngine.ScalarDataVariable',
                                inputGenre: 'Variable',
                                inputValue: DataPath.makePath(org, dataset, 'ScalarVar', n),
                            };
                            return InputPuzzlePiece(n, scalarVarInput).draggable({
                                helper: 'clone',
                                cursor: 'grabbing',
                        })
                    });
                    let vectorVarList = [...vectorVarNames]
                        .filter((n) => n && n.length > 0)
                        .map((n) => {
                            let vectorVarInput = {
                                inputType: 'IVLab.ABREngine.VectorDataVariable',
                                inputGenre: 'Variable',
                                inputValue: DataPath.makePath(org, dataset, 'VectorVar', n),
                            };
                            return InputPuzzlePiece(n, vectorVarInput).draggable({
                                helper: 'clone',
                                cursor: 'grabbing',
                        })
                    });

                    let $keydata = SwatchList('Key Data', keydataList);
                    let $scalarVars = SwatchList('Scalar Variables', scalarVarList);
                    let $vectorVars = SwatchList('Vector Variables', vectorVarList);
                    let $dataset = $('<div>')
                        .append($keydata)
                        .append($scalarVars)
                        .append($vectorVars);
                    $dataPanel.append($('<p>', {
                        class: 'section-header',
                        text: DataPath.makePath(org, dataset),
                    }))
                    $dataPanel.append($dataset);
                }
            }
        });

    return $dataPanel;
}
