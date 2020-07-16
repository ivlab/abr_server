import { Validator } from '../Validator.js'
import { uuid } from '../UUID.js'

function makeButton(strat) {
    console.log(strat);
    return $('<button>', {
        text: `Validate ${strat.name}`,
    }).on('click', (evt) => {
        fetch(`/api/state/impressions/${strat.uuid}`, {
            method: 'PUT',
            body: JSON.stringify(strat),
            headers: {
                'X-CSRFToken': csrftoken,
            }
        }).catch((err) => console.error(err)).then((resp) => {
            if (resp.status != 200) {
                $('#err_responses').append(resp.statusText + '<br>');
            }
            fetch(`/api/state/impressions`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrftoken,
                }
            }).then((data) => data.text()).then((t) => console.log(t));
        });
    });
}

function init() {
    $('body').append($('<pre>', {id: 'err_responses', css: {color: 'red'}}));
    let glyphs = {
        impressionType: 'Glyphs',
        uuid: uuid(),
        name: 'good glyphs',
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
                inputValue: uuid()
            }
        }
    };

    let ribbons = {
        impressionType: 'Ribbons',
        uuid: uuid(),
        name: 'some streams',
        visible: true,
        inputValues: {
            'Key Data': {
                inputType: 'LineData',
                inputGroup: 'Key Data',
                inputValue: 'ParaView://LANL/GulfOfMexico/KeyData/LouisianaStreamlines'
            },
        }
    };

    let surface =  {
        impressionType: 'Surface',
        uuid: uuid(),
        name: 'bathymetry',
        visible: true,
        inputValues: {
            'Key Data': {
                inputType: 'SurfaceData',
                inputGroup: 'Key Data',
                inputValue: 'ParaView://LANL/GulfOfMexico/KeyData/Bathymetry'
            },
        }
    };

    let badsurface =  {
        impressionType: 'Surface',
        uuid: uuid(),
        name: 'bad bathymetry',
        visible: true,
        inputValues: {
            'Key Data': {
                inputType: 'LineData',
                inputGroup: 'Key Data',
                inputValue: 'ParaView://LANL/GulfOfMexico/KeyData/Bathymetry'
            },
            'Ribbon Variable': {
                inputType: 'LineData',
                inputGroup: 'Ribbon',
                inputValue: 'ParaView://LANL/GulfOfMexico/ScalarVariables/Temperature'
            }
        }
    };

    for (const strat of [glyphs, ribbons, surface, badsurface]) {
        $('body').append(makeButton(strat));
    }


    // let modelValidator = new Validator('model.json');
    // modelValidator.validate(state).then((err) => console.log(err));
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