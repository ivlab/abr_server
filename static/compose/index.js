import { Validator } from '../Validator.js'

function init() {
    // fetch('/api/schema/', {
    //     method: 'GET',
    //     headers: {
    //         'X-CSRFToken': csrftoken,
    //     }
    // }).then((data) => data.text()).then((text) => {
    //     console.log(text)
    // });
    let uuid = 'dd4d2099-2668-4f75-93bc-06dd167ac3b1';
    let impression = {
            'impressionType': 'Testing',
            'uuid': uuid,
            'name': 'some testing impression',
            'visible': true,
            'inputValues': [],
    };
    fetch(`/api/state/impressions/${uuid}`, {
        method: 'PUT',
        body: JSON.stringify(impression),
        headers: {
            'X-CSRFToken': csrftoken,
        }
    }).catch((err) => console.error(err));

    fetch(`/api/state/impressions`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        }
    }).then((data) => data.text()).then((t) => console.log(t));

    // let modelValidator = new Validator('model.json');
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