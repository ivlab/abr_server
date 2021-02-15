/* StateManager.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { globals } from "./globals.js";

export const STATE_UPDATE_EVENT = 'ABRStateUpdate';

export class StateManager {
    constructor() {
        this._state = {};
        this._subscribers = [];
    }

    async updateState() {
        await fetch('/api/state')
            .then((resp) => resp.text())
            .then((newState) => {
                let stateJson = JSON.parse(newState);
                return globals.validator.validate(stateJson.state)
            })
            .then((stateJson) => {
                this._state = stateJson;
                for (const sub of this._subscribers) {
                    $(sub).trigger(STATE_UPDATE_EVENT);
                }
            })
            .catch((errs) => console.error(errs));
    }

    get state() {
        return this._state;
    }

    subscribe($element) {
        this._subscribers.push($element);
    }

    unsubscribe($element) {
        this._subscribers.remove($element);
    }
}