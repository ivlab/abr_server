/* Generic.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Widely-reusable, generic UI components
 */

import { storage } from '../storage.js';
import { messenger } from '../AbrMessenger.js'
import { download, downloadPng } from '../UiUtils.js'

// Wrap the contents with an expandable div
export function CollapsibleDiv(header, $contents) {
    return $('<div>').append(
        $('<div>', {
            class: 'collapsible-header',
            text: header
        }
        ).on('click', (evt) => {
            $(evt.target).toggleClass('active');
            let content = evt.target.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        })
    ).append(
        $('<div>', { class: 'collapsible-content' }).append($contents)
    );
}

export function ScreenshotBlock(stateName, screenshot) {
    let $screenshot = $('<div>', {class: 'state-block-parent'});
    $screenshot.append($('<p>', {text: screenshot}));
    $screenshot.append($('<img>', {
            class: 'state-thumbnail',
            src: `${MEDIA_URL}screenshots/${stateName}/${encodeURIComponent(screenshot)}%23thumbnail.png`,
            title: 'Click to download state and screenshot',
        }).data({
            screenshotName: screenshot
        }).on('click', (evt) => {
            // Request the screenshot png and state from the media server and download it
            fetch(`${MEDIA_URL}screenshots/${stateName}/${encodeURIComponent(screenshot)}.png`)
                .then((data) => data.blob())
                .then((bytes) => downloadPng(screenshot + '.png', bytes));
            fetch(`${MEDIA_URL}screenshots/${stateName}/${encodeURIComponent(screenshot)}.json`)
                .then((data) => data.text())
                .then((text) => download(screenshot + '.abrstate', text, 'data:application/json;charset=utf-8,'));
        }).css('cursor', 'pointer')
    );
    return $screenshot;
}

// A button for loading a state
export function StateBlock(stateName) {
    return $('<div>', {
        class: 'state-block-parent',
        data: {
            stateName: stateName,
        }
    }).append(
        $('<p>', {text: stateName})
    ).append(
        $('<img>', {
            class: 'state-thumbnail',
            src: `${MEDIA_URL}states/${stateName}%23thumbnail.png?${new Date().getTime()}`,
            title: 'Click to load state',
        }).on('click', (evt) => {
            let message = {
                type: 'LoadState',
                stateName: $(evt.target).parents('.state-block-parent').data('stateName'),
            };

            // Tell the engine to load the state
            messenger.sendUpdate(message);

            // Store the current state name in session storage
            storage.currentStateName = stateName;
        }).css('cursor', 'pointer')
    ).append(
        $('<div>', {
            class: 'state-block',
        }).append(
            $('<button>', {
                class: 'material-icons state-button tiny-button',
                html: 'cloud_download',
                title: 'Download state file',
            }).on('click', (evt) => {
                let stateName = $(evt.target).parents('.state-block-parent').data('stateName');

                // Get the state from the media server and download it when ready
                fetch(`${MEDIA_URL}states/${stateName}.json`)
                    .then((data) => data.text())
                    .then((text) => download(stateName + '.abrstate', text, 'data:application/json;charset=utf-8,'));
            })
        ).append(
            $('<button>', {
                class: 'material-icons state-button tiny-button',
                html: 'delete_forever',
                title: 'Delete state file',
            }).on('click', (evt) => {
                let stateName = $(evt.target).parents('.state-block-parent').data('stateName');
                
                $('<div>', {
                    text: `Delete state '${stateName}'?`,
                }).dialog({
                    resizable: false,
                    height: "auto",
                    width: 400,
                    modal: true,
                    buttons: {
                        "Yes, Delete": function() {
                            messenger.sendUpdate({
                                type: 'DeleteState',
                                stateName: stateName,
                            });
                            $(this).dialog('close');
                        },
                        "Cancel": function () {
                            $(this).dialog('close');
                        }
                    },
                })
            })
        )
    )
}