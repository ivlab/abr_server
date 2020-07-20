/* ABREngineInterface.js
 * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * The WebSocket interface that talks with the Design Server, and through that
 * server, the ABR engine.
 */

export var messenger = null;

export class AbrMessenger {
    constructor() {
        this.abrMessageCallbacks = [];
        this.outgoingMessages = [];
        this.initialized = false;

        this.ws = new WebSocket(`ws://${window.location.host}/ws/composition/`);

        // Once the WS is open, tell the ABR Engine to send us the state since
        // we're connected
        this.ws.onopen = (_evt) => {
            let data = {'type': 2, 'message': ''};
            this.ws.send(JSON.stringify(data));
            this.initialized = true;

            // Send all the messages that were waiting while uninitialized
            while (this.outgoingMessages.length > 0) {
                let msg = this.outgoingMessages.shift();
                this.ws.send(JSON.stringify(msg));
            }
        }

        // When a message is received, forward it to all of the subscribers
        this.ws.onmessage = (evt) => {
            let data = JSON.parse(evt.data);

            if (data.type == 5) {
                // If we received a EngineDisconnect message, the engine is now
                // disconnected
                console.log('Disconnected from engine');
                $('#connecting-header').removeClass('connected');
            } else {
                // Otherwise, the engine is connected
                this.notifyAll(data);
                $('#connecting-header').addClass('connected');
            }
        }

        this.ws.onclose = (evt) => {
            console.log('Disconnected from engine');
            $('#connecting-header').removeClass('connected');
        }
    }

    /// Add a function to be called when a message from the server is received
    addMessageCallback(cb) {
        this.abrMessageCallbacks.push(cb);
    }

    /// Update all subscribers with new data
    notifyAll(data) {
        this.abrMessageCallbacks.forEach((cb) => {
            cb(data);
        })
    }

    /// Send a message to the engine
    sendMessage(data) {
        this.outgoingMessages.push(data);
        while (this.initialized && this.outgoingMessages.length > 0) {
            let msg = this.outgoingMessages.shift();
            $('.loading-spinner').css('visibility', 'visible');
            this.ws.send(JSON.stringify(msg));
        }
    }

    /// Send an update to the engine (specific type of message)
    sendUpdate(updateMsg) {
        // Construct an 'Update' message (type 1 from ABRMessenger.cs in
        // the engine)
        let msg = {
            type: 1,
            message: JSON.stringify(updateMsg),
        }

        this.sendMessage(msg);
    }

    requestState() {
        // Construct a 'StateRequest' message (type 2 from ABRMessenger.cs in
        // the engine)
        this.sendMessage({type: 2});
    }
}

export function initAbrEngineInterface() {
    messenger = new AbrMessenger();
}