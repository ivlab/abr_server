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

    let validator = new Validator('model.json');

    fetch(`${STATIC_URL}test.json`).then((r) => r.text()).then((text) => {
        let j = JSON.parse(text);
        validator.validate(j).then((error) => console.log(error));
    })
}

window.onload = init;