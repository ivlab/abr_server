/* Components.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Parent classes for Components
 */

export class Component {
    constructor() {

    }

    jQuery() {
        return this.$;
    }

    updateAbrComponent() {
        this.$.data('abrObject', this);
    }
}

// A component that depends on remote information to be populated
export class NetworkRequestComponent extends Component {
    constructor(url, okCallback, errCallback=console.error) {
        super()

        fetch(url).then((resp) => resp.text()).then((data) => {
            let response = JSON.parse(data).data; // 'data' is specified in the API views.py
            okCallback(response);
            this.updateAbrComponent();
        }).catch((err) => {
            errCallback(err);
        });
    }
}
