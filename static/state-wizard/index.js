import { DataPath } from '../common/DataPath.js';

// Map old EncodingRenderStrategies to new DataImpressions
const strategiesToPlateTypes = {
    'SimpleGlyphEncodingRenderStrategy': 'Glyphs',
    'SimpleLineEncodingRenderStrategy': 'Ribbons',
    'SimpleSurfaceEncodingRenderStrategy': 'Surfaces',
};

// VariableTypes in the old system
const variableTypes = [
    'RawScalarVariable',
    'RawVectorVariable',
    'RangedScalarVariable'
];

// Map old input names to equivalent new ones, otherwise assume they're
// the same
const inputNameMap = {
    'Pattern Scale': 'Pattern Size',
    'Pattern Blend': 'Pattern Seam Blend',
    'Width': 'Ribbon Width',
    'Curve': 'Ribbon Curve',
    'Average': 'Ribbon Smooth',
};
var defaultDatasetPath = 'Organization/Dataset';

var schema = {};


// Resolve schema consts to values, if there are any values contained within
// consts
// For example: {
//      "inputValue": { "const": "4m" },
//      "inputType": { "const": "IVLab.ABREngine.LengthPrimitive" }
// }
// resolves to {
//      "inputValue": "4m",
//      "inputType": "IVLab.ABREngine.LengthPrimitive"
// }
// This assumes that no input value will be an object!!
function resolveSchemaConsts(data) {
    let resolvedData = {};
    for (const field in data) {
        if (typeof (data[field]) === 'object' && data[field].const) {
            resolvedData[field] = data[field].const;
        } else if (typeof (data[field]) === 'object' && data[field].default) {
            resolvedData[field] = data[field].default;
        } else {
            resolvedData[field] = data[field];
        }
    }
    return resolvedData;
}

// Get the full list of input names from a plate type from a schema
function getSchemaInputNames(plateType) {
    return Object.keys(schema['definitions']['Plates'][plateType]['properties']);
}

function getSchemaInputWithDefault(plateType, inputName) {
    let inputProps = schema['definitions']['Plates'][plateType]['properties'][inputName]['properties'];
    let resolvedProps = resolveSchemaConsts(inputProps);
    return {
        inputType: resolvedProps.inputType,
        parameterName: resolvedProps.parameterName,
        inputValue: resolvedProps.inputValue,
        inputGenre: resolvedProps.inputGenre,
    }
}

$('#upload-state').on('click', (_evt) => {
    // Create a fake element to handle the actual upload
    let $fileInput = $('<input>', {
        type: 'file',
    }).on('change', (evt) => {
        if (!evt.target.files || !evt.target.files[0]) {
            alert('No files uploaded!');
            return;
        }

        let stateFileName = evt.target.files[0].name;
        // get rid of file extension
        let stateName = stateFileName.replace(/\.[^/.]+$/, ""); // https://stackoverflow.com/a/4250408

        let reader = new FileReader();
        $(reader).on('load', (loadEvt) => {
            // Update the state with the stateManager
            // globals.stateManager.updateState(loadEvt.target.result);
            // localStorage.setItem('state', loadEvt.target.result);
            let stateJson = JSON.parse(loadEvt.target.result);
            populateWizardForm(stateName, stateJson);
        });
        reader.readAsText(evt.target.files[0]);

        $fileInput.remove();
    });
    $('body').append($fileInput);
    $fileInput.click();
});

// For debugging
fetch('/api/schemas/ABRSchema_0-2-0.json')
    .then((resp) => resp.json())
    .then((s) => schema = s)
    .then(() => {
        upgradeState('Test State', JSON.parse(localStorage.getItem('state')));
    });


// GLOBAL new state
var newState = {
    'version': '0.2.0',
    'impressions': {},
    'dataRanges': {},
    'uiData': {
        'compose': {
            'impressionData': {}
        }
    },
};

function upgradeState(stateName, stateJson) {
    // Start generating a new ABR 0.2 state and save it
    // Things that can be upgraded automatically:
    // - VisAsset Inputs
    // - UI metadata
    //
    // Things that need to be manually upgraded
    // - Variable inputs (choose Path)
    // - KeyData inputs (choose Path)
    // - Data Ranges (after variables have been upgraded)
    //
    // Things that need to be redone from defaults
    // - Primitive inputs

    let impressions = readDataImpressions(stateJson);

    // Automatically upgrade the impressions
    for (const impression of impressions) {
        let newImpression = upgradeImpressionAuto(impression, stateJson);
        newState.impressions[newImpression.uuid] = newImpression;
    }

    // Automatically upgrade UI metadata
    newState.uiData.compose.impressionData = stateJson.ui;

    // Populate the wizard to help with items that can't automatically
    // be inferred
    populateWizardForm(stateName, stateJson);
}

function populateWizardForm(stateName, stateJson) {
    // Add the state name
    $('#state-name').text(stateName);

    let impressions = readDataImpressions(stateJson);

    // Add all data impressions to the UI
    for (const impression of impressions) {
        let variables = readVariables(impression, stateJson);

        let plateType = strategiesToPlateTypes[impression.type];

        let $impression = $('<div>', {
            class: 'data-impression card',
        }).append($('<header>', { text: impression.label }))
            .append($('<p>', { text: `Variables (${Object.keys(variables).length})` }));

        let $vars = $('<div>');
        for (var inputName in variables) {
            // Switch out for the new input name
            if (Object.keys(inputNameMap).indexOf(inputName) > 0) {
                inputName = inputNameMap[inputName];
            }

            let variable = variables[inputName];
            $vars.append(
                $('<button>', {
                    class: 'error',
                    text: `${inputName}: ${variable.label}`
                }).on('click', (evt) => {
                    let newVarPath = '';
                    let valid = false;
                    if (variable.type.includes('Scalar')) {
                        newVarPath = prompt('Choose new variable data path', `${defaultDatasetPath}/ScalarVar/${variable.label}`);
                        if (!DataPath.followsConvention(newVarPath, 'ScalarVar')) {
                            alert(`Path '${newVarPath} does not follow ScalarVar convention ${DataPath.getConvention('ScalarVar')}`);
                        } else {
                            valid = true;
                        }
                    } else if (variable.type.includes('Vector')) {
                        newVarPath = prompt('Choose new variable data path', `${defaultDatasetPath}/VectorVar/${variable.label}`);
                        if (!DataPath.followsConvention(newVarPath, 'VectorVar')) {
                            alert(`Path '${newVarPath} does not follow VectorVar convention ${DataPath.getConvention('VectorVar')}`);
                        } else {
                            valid = true;
                        }
                    }

                    if (valid) {
                        // Update the default dataset to make it easier next time
                        defaultDatasetPath = DataPath.getDatasetPath(newVarPath);
                        $(evt.target).text(`${inputName}: ${newVarPath}`);
                        $(evt.target).removeClass('error');
                        $(evt.target).addClass('success');
                        let defaultInputValue = getSchemaInputWithDefault(plateType, inputName);
                        defaultInputValue.inputValue = newVarPath;
                        newState.impressions[impression.uuid].inputValues[inputName] = defaultInputValue;
                    }
                })
            );
        }

        $impression.append($vars);

        $('#impression-list').append($impression);
    }
}

// Upgrade all the parts of an impression from 0.1.8 to 0.2.0 that can
// be automatically done
function upgradeImpressionAuto(dataImpression, stateJson) {
    let uiDataForImpression = stateJson.ui[dataImpression.uuid];

    // Populate the top-level data
    let newImpression = {};
    newImpression.plateType = strategiesToPlateTypes[dataImpression.type];
    newImpression.uuid = dataImpression.uuid;
    newImpression.name = dataImpression.label;
    newImpression.renderHints = {};
    newImpression.renderHints.visible = !uiDataForImpression.hidden;
    newImpression.inputValues = {};

    for (var inputName in dataImpression.inputs) {
        // Check if the input name exists for this plate type
        let allInputsForPlateType = getSchemaInputNames(newImpression.plateType);
        let oldInputName = inputName;
        if (Object.keys(inputNameMap).indexOf(inputName) >= 0) {
            inputName = inputNameMap[inputName];
        }

        if (allInputsForPlateType.indexOf(inputName) < 0) {
            console.warn(`'${inputName}' is not an input for plate type ${newImpression.plateType}! Ignoring.`);
            continue;
        }

        let oldInputUuid = dataImpression.inputs[inputName];

        // We can only upgrade if it's a VisAsset, otherwise leave at
        // the default
        let newInput = getSchemaInputWithDefault(newImpression.plateType, inputName);
        if (newInput.inputGenre == 'VisAsset') {
            newInput.inputValue = oldInputUuid;
        }

        // Only add if actually defined
        if (newInput.inputValue) {
            newImpression.inputValues[inputName] = newInput;
        }
    }

    return newImpression;
}

function readDataImpressions(stateJson) {
    // Go through each composition node in the old state
    return stateJson.compositionNodes.filter((strat) => Object.keys(strategiesToPlateTypes).indexOf(strat.type) >= 0);
}

function readVariables(dataImpression, stateJson) {
    let dataNodeUuids = stateJson.dataNodes.map((node) => node.uuid);

    let variables = {};
    for (const inputName in dataImpression.inputs) {
        // Find the variable in dataNodes
        let inputUuid = dataImpression.inputs[inputName];
        let inputIndex = dataNodeUuids.indexOf(inputUuid);
        if (inputIndex >= 0) {
            variables[inputName] = stateJson.dataNodes[inputIndex];
        }
    }
    return variables;
}
