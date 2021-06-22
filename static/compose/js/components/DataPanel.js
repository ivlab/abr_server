/* components/DataPanel.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Data panel (left side of the ABR Compose UI)
 */

import { DataPath } from "../../../common/DataPath.js";
import { globals } from "../../../common/globals.js";
import { SwatchInputPuzzlePiece } from "./PuzzlePiece.js";
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

    $dataPanel.append($('<p>', {
        class: 'section-header',
        text: 'Local Data'
    }))

    fetch('/api/datasets')
        .then((resp) => resp.json())
        .then((datasets) => {
            globals.dataCache = datasets;
            for (const org in datasets) {
                for (const dataset in datasets[org]) {
                    let keydataList = [];
                    for (const keydata in datasets[org][dataset]) {
                        let metadata = datasets[org][dataset][keydata]
                        let keyDataInput = {
                            inputType: MESH_TOPOLOGY_MAP[metadata.meshTopology],
                            inputGenre: 'KeyData',
                            inputValue: DataPath.makePath(org, dataset, 'KeyData', keydata),
                        };

                        keydataList.push(
                            SwatchInputPuzzlePiece(keydata, keyDataInput)
                        );
                    }

                    let $dataset = SwatchList(DataPath.makePath(org, dataset), keydataList);
                    $dataPanel.append($dataset);
                }
            }
        });

    return $dataPanel;
}
