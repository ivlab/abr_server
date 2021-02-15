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

    get state() {
        return this._state;
    }

    subscribe($element) {
        this._subscribers.push($element);
    }

    unsubscribe($element) {
        this._subscribers.remove($element);
    }

    updateState(newState) {
        let stateJson = JSON.parse(newState);
        globals.validator.validate(stateJson.state)
            .then((errs) => {
                if (errs !== null) {
                    console.error(errs);
                } else {
                    this._state = stateJson.state;
                    for (const sub of this._subscribers) {
                        $(sub).trigger(STATE_UPDATE_EVENT);
                    }
                }
            });
    }
}