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
    fetch('/api/state/impressions', {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        }
    }).then((data) => data.text()).then((text) => {
        console.log(text)
    });

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