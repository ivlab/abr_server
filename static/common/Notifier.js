/* Notifier.js
 *
 * Copyright (c) 2021, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 */

import { globals } from "./globals.js";

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

        // When a message is received, forward it to all of the subscribers
        this.ws.onmessage = (evt) => {
            let data = evt.data;
            console.log(data);
            fetch('/api/state').then((resp) => resp.text())
                .then((state) => globals.stateManager.updateState(state) );
        }
    }

    async ready() {
        return new Promise((resolve, _reject) => {
            $(this).on('notifierReady', () => resolve());
        });
    }
}

