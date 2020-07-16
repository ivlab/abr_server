import { Validator } from '../Validator.js'

function init() {
    let state = {
        version: '0.0.0',
        impressions: {
            'dd4d2099-2668-4f75-93bc-06dd167ac3b1': {
                impressionType: 'Glyphs',
                uuid: 'dd4d2099-2668-4f75-93bc-06dd167ac3b1',
                name: 'some glyphs',
                visible: true,
                inputValues: {
                    'Key Data': {
                        inputType: 'PointData',
                        inputGroup: 'Key Data',
                        inputValue: 'ParaView://LANL/GulfOfMexico/KeyData/ChlorophyllPoints'
                    },
                    'Color Variable': {
                        inputType: 'ScalarDataVariable',
                        inputGroup: 'Color',
                        inputValue: 'ParaView://LANL/GulfOfMexico/ScalarVars/Temperature'
                    },
                    'Colormap': {
                        inputType: 'ColormapVisAsset',
                        inputGroup: 'Color',
                        inputValue: '1ad2bed5-b601-47c8-9c43-4ffefec32c00'
                    },
                    'Line Variable': {
                        inputType: 'ScalarDataVariable',
                        inputGroup: 'Glyph',
                        inputValue: 'null'
                    },
                    'Glyph': {
                        inputType: 'GlyphVisAsset',
                        inputGroup: 'Glyph',
                        inputValue: 'null'
                    },
                    'Glyph Size': {
                        inputType: 'Primitive',
                        inputGroup: 'Glyph Size',
                        inputValue: '2cm'
                    }
                }
            }
        }
    };

    let uuid = 'dd4d2099-2668-4f75-93bc-06dd167ac3b1';
    let impression = state.impressions[uuid];

    fetch(`/api/state/impressions/${uuid}`, {
        method: 'PUT',
        body: JSON.stringify(impression),
        headers: {
            'X-CSRFToken': csrftoken,
        }
    }).catch((err) => console.error(err)).then((resp) => {
        if (resp.status != 200) {
            console.error(resp);
        }
        fetch(`/api/state/impressions`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken,
            }
        }).then((data) => data.text()).then((t) => console.log(t));
    });


    let modelValidator = new Validator('model.json');
    modelValidator.validate(state).then((err) => console.log(err));
    // fetch(`${STATIC_URL}testModel.json`).then((r) => r.text()).then((text) => {
    //     let j = JSON.parse(text);
    //     modelValidator.validate(j).then((error) => console.log(error));
    // });

    // let specValidator = new Validator('spec.json');
    // fetch(`${STATIC_URL}testSpec.json`).then((r) => r.text()).then((text) => {
    //     let j = JSON.parse(text);
    //     specValidator.validate(j).then((error) => console.log(error));
    // });
}

window.onload = init;