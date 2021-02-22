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
                'X-CSRFToken': csrftoken,
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
                'X-CSRFToken': csrftoken,
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
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error removing:\n' + errs));
    }

    // Remove something at a particular path
    async removePath(path) {
        path = path ?? '';
        await fetch('/api/remove-path/' + path, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error removing:\n' + errs));
    }

    async undo() {
        await fetch('/api/undo', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
            },
            mode: 'same-origin'
        }).catch((errs) => alert('Error undoing:\n' + errs));
    }

    async redo() {
        await fetch('/api/redo', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken,
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
                if (this._cacheSubscribers[cacheName]) {
                    for (const sub of this._cacheSubscribers[cacheName]) {
                        $(sub).trigger(CACHE_UPDATE + cacheName);
                    }
                }
            })
            .catch((errs) => alert('Error refreshing cache:\n' + errs));
    }

    getCache(cacheName) {
        return this._caches[cacheName] ?? {};
    }

    // Subscribe to when a particular cache is updated
    subscribeCache(cacheName, $element) {
        if (this._cacheSubscribers[cacheName]) {
            this._cacheSubscribers[cacheName].push($element);
        } else {
            this._cacheSubscribers[cacheName] = [$element];
        }
    }
    unsubscribeCache(cacheName, $element) {
        if (this._cacheSubscribers[cacheName]) {
            this._cacheSubscribers[cacheName].remove($element);
        }
    }
}