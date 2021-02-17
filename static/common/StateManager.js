/* StateManager.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { globals } from "./globals.js";

export const STATE_UPDATE_EVENT = 'ABRStateUpdate';

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
export function resolveSchemaConsts(data) {
    let resolvedData = {};
    for (const field in data) {
        if (typeof(data[field]) === 'object' && data[field]?.const) {
            resolvedData[field] = data[field].const;
        } else if (typeof(data[field]) === 'object' && data[field]?.default) {
            resolvedData[field] = data[field].default;
        } else {
            resolvedData[field] = data[field];
        }
    }
    return resolvedData;
}

export class StateManager {
    constructor() {
        this._state = {};
        this._previousState = {};
        this._subscribers = [];
    }

    async refreshState() {
        await fetch('/api/state')
            .then((resp) => resp.text())
            .then((newState) => {
                let stateJson = JSON.parse(newState);
                return globals.validator.validate(stateJson.state)
            })
            .then((stateJson) => {
                this._previousState = this._state;
                this._state = stateJson;
                for (const sub of this._subscribers) {
                    $(sub).trigger(STATE_UPDATE_EVENT);
                }
            })
            .catch((errs) => alert(errs));
    }

    async updateState(newState) {
        await fetch('/api/state', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin',
            body: newState,
        }).catch((errs) => alert(errs));
    }

    // Send an update to a particular object in the state. updateValue MUST be
    // an object.
    async update(updatePath, updateValue) {
        await fetch('/api/state/' + updatePath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin',
            body: JSON.stringify(updateValue),
        }).catch((errs) => alert(errs));
    }

    // Remove all instances of a particular value from the state
    // Particularly useful when deleting data impressions
    async removeAll(value) {
        await fetch('/api/remove/' + value, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert(errs));
    }

    // Remove something at a particular path
    async removePath(path) {
        await fetch('/api/remove-path/' + path, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert(errs));
    }

    get state() {
        return this._state;
    }

    get previousState() {
        return this._previousState;
    }

    subscribe($element) {
        this._subscribers.push($element);
    }

    unsubscribe($element) {
        this._subscribers.remove($element);
    }
}