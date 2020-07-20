/* messageUtils.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Utilities for helping communicate between the UI and the Engine
 */

import { messenger } from './AbrMessenger.js'
import { storage } from './storage.js';

// Send an updated Render Strategy to the ABR Engine (connections, keydata, ui
// metadata)
export function sendRenderStrategyUpdate($renderStrategy) {
    let updateMsg = {
        type: 'UpdateRenderStrategy',
        object: {
            // Info about the RenderStrategy
            type: $renderStrategy.data('type'),
            uuid: $renderStrategy.data('uuid'),
            label: $renderStrategy.data('label'),

            // Instantiated puzzle piece connections
            keydataUUID: $renderStrategy.data('keydataUUID'),
            connections: $renderStrategy.data('connections'),

            uiMetadata: $renderStrategy.data('uiMetadata'),
        }
    }

    // console.log(`Sending message: ${JSON.stringify(updateMsg, null, 2)}`);
    messenger.sendUpdate(updateMsg);
}

// Send an updated Render Strategy (from the data)
export function sendRenderStrategyUpdateData(rsData) {
    // Delete the UI draggable data before sending
    let rsDataNoUI = rsData;
    delete rsDataNoUI.uiDraggable;

    let updateMsg = {
        type: 'UpdateRenderStrategy',
        object: rsDataNoUI,
    }

    // console.log(`Sending message: ${JSON.stringify(updateMsg, null, 2)}`);
    messenger.sendUpdate(updateMsg);
}

// Inform the ABR Engine that there's a new scalar input or that it's been updated
export function sendInputUpdate(nodeData) {
    // Delete the UI draggable data before sending
    let nodeDataNoUI = nodeData;
    delete nodeDataNoUI.uiDraggable;

    let updateMsg = {
        type: 'UpdateNode',
        object: nodeDataNoUI,
    };

    // console.log(`Sending scalar value message:\n${JSON.stringify(updateMsg, null, 2)}`);
    messenger.sendUpdate(updateMsg);
}

// Handle a state message from the Engine and distribute it to the correct
// recipients
export function handleStateMessage(abrMessage) {
    let msg = JSON.parse(abrMessage.message);
    console.log(msg);
    // A `State` message
    if (abrMessage.type == 0) {
        // Cache the message in localStorage
        storage.cachedState = msg;

        // Send an `abrStateUpdate` event to all subscribers, with the
        // deserialized message as payload
        $('.abr-state-subscriber').trigger('abrStateUpdate', msg);

        // Send an update after every other update has finished
        $('.abr-state-subscriber').trigger('abrStateLateUpdate', msg);
    }
}
