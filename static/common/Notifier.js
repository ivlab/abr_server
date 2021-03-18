/* Notifier.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { globals } from "./globals.js";
import { CACHE_UPDATE } from "./StateManager.js";

export class Notifier {
    constructor() {
        this.ws = new WebSocket(`ws://${window.location.host}/ws/`);
        this.initialized = false;

        // Once the WS is open, tell the ABR Engine to send us the state since
        // we're connected
        this.ws.onopen = (_evt) => {
            let data = 'Web client connected';
            this.ws.send(data);
            this.initialized = true;
            $(this).trigger('notifierReady');
        }

        // When a message is received, update the state
        this.ws.onmessage = (evt) => {
            let target = JSON.parse(evt.data)['target'];
            if (target == 'state') {
                globals.stateManager.refreshState();
            } else if (target != null && target.startsWith(CACHE_UPDATE)) {
                let cacheName = target.replace(CACHE_UPDATE, '');
                globals.stateManager.refreshCache(cacheName);
            }
        }
    }

    async ready() {
        return new Promise((resolve, _reject) => {
            $(this).on('notifierReady', () => resolve());
        });
    }
}

