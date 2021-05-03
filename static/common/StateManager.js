/* StateManager.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { globals } from "./globals.js";

export const STATE_UPDATE_EVENT = 'ABRStateUpdate';
export const CACHE_UPDATE = 'CacheUpdate-';

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
        if (typeof(data[field]) === 'object' && data[field].const) {
            resolvedData[field] = data[field].const;
        } else if (typeof(data[field]) === 'object' && data[field].default) {
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
        this._cacheSubscribers = {};
        this._caches = {};
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
            .catch((errs) => alert('Error refreshing state:\n' + errs));
    }

    async updateState(newState) {
        await fetch('/api/state', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin',
            body: newState,
        }).catch((errs) => alert('Error updating state:\n' + errs));
    }

    // Send an update to a particular object in the state. updateValue MUST be
    // an object.
    async update(updatePath, updateValue) {
        await fetch('/api/state/' + updatePath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin',
            body: JSON.stringify(updateValue),
        }).catch((errs) => alert('Error updating state:\n' + errs));
    }

    // Remove all instances of a particular value from the state
    // Particularly useful when deleting data impressions
    async removeAll(value) {
        await fetch('/api/remove/' + value, {
            method: 'DELETE',
            headers: {
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error removing:\n' + errs));
    }

    // Remove something at a particular path
    async removePath(path) {
        path = path ? path : '';
        await fetch('/api/remove-path/' + path, {
            method: 'DELETE',
            headers: {
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error removing:\n' + errs));
    }

    async undo() {
        await fetch('/api/undo', {
            method: 'POST',
            headers: {
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error undoing:\n' + errs));
    }

    async redo() {
        await fetch('/api/redo', {
            method: 'POST',
            headers: {
                // 'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error redoing:\n' + errs));
    }

    get state() {
        return this._state;
    }

    get previousState() {
        return this._previousState;
    }

    findAll(condition) {
        let outItems = [];
        return this._findAll(condition, this.state, outItems);
    }

    // Find all occurances of lambda function "condition" in the state
    _findAll(condition, subState, outItems) {
        if (typeof(subState) == 'object' && Object.keys(subState).length == 0) {
            return subState;
        } else {
            if (condition(subState)) {
                outItems.push(subState)
            }
            for (const subValue in subState) {
                if (typeof(subState) == 'object') {
                    this._findAll(condition, subState[subValue], outItems)
                }
            }
            return outItems;
        }
    }

    // Find if a key exists within a specific path
    // e.g. (['localVisAssets'], '04d115b5-8ae7-45ac-b889-2ef0c537b957')
    keyExists(pathArray, key) {
        let obj = this.state;
        for (let i = 0; i < pathArray.length; i++) {
            obj = obj[pathArray[i]];
        }
        return obj.hasOwnProperty(key);
    }

    subscribe($element) {
        this._subscribers.push($element);
    }

    unsubscribe($element) {
        this._subscribers.remove($element);
    }

    async refreshCache(cacheName) {
        await fetch('/api/' + cacheName)
            .then((resp) => resp.json())
            .then((json) => {
                this._caches[cacheName] = json;
                $(`.cache-subscription-${cacheName}`).each((_i, el) => {
                    $(el).trigger(CACHE_UPDATE + cacheName);
                })
            })
            .catch((errs) => alert('Error refreshing cache:\n' + errs));
    }

    getCache(cacheName) {
        return this._caches[cacheName] ? this._caches[cacheName] : {};
    }

    // Subscribe to when a particular cache is updated
    subscribeCache(cacheName, $element) {
        $element.addClass(`cache-subscription-${cacheName}`);
    }
    unsubscribeCache(cacheName, $element) {
        $element.removeClass(`cache-subscription-${cacheName}`);
    }
}