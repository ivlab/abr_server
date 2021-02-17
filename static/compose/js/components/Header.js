/* components/Header.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Header going across the top of the ABR Compose UI
 */

import { globals } from "../../../common/globals.js";

export const DEFAULT_STATE_NAME = 'Untitled';
const STORAGE_STATE_PREFIX = '_state_';

export function Header() {
    let $header = $('<header>', {
        id: 'header',
    });

    // Populate the file functions
    let $fileHeader = $('<div>', {
        id: 'file-header'
    });

    // TODO: Import state
    // }).on('click', (_evt) => {
    //     // Create a fake element to handle the actual upload
    //     let $fileInput = $('<input>', {
    //         type: 'file',
    //     }).on('change', (evt) => {
    //         if (!evt.target.files || !evt.target.files[0]) {
    //             alert('No files uploaded!');
    //             return;
    //         }

    //         let stateFileName = evt.target.files[0].name;
    //         // get rid of file extension
    //         let stateName = stateFileName.replace(/\.[^/.]+$/, ""); // https://stackoverflow.com/a/4250408

    //         let reader = new FileReader();
    //         $(reader).on('load', (loadEvt) => {
    //             // Update the state with the stateManager
    //             globals.stateManager.updateState(loadEvt.target.result);
    //         });
    //         reader.readAsText(evt.target.files[0]);

    //         $fileInput.remove();
    //     });
    //     $('body').append($fileInput);
    //     $fileInput.click();
    // }));

    // Load a state
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'folder_open',
        title: 'Load state...',
        id: 'load-state',
    }).on('click', (_evt) => {
        let $loadDialog = $('<div>', {
            title: 'Load state',
            id: 'load-state-dialog',
        }).dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: {
                "Load": function () {
                    let stateName = $(this).find('.selected-state .state-name').text();
                    localStorage.currentStateName = stateName;
                    $('#state-header #state-name').text(stateName);

                    // Tell the server to update
                    globals.stateManager.updateState(localStorage.getItem(STORAGE_STATE_PREFIX + stateName));
                    $(this).dialog('close');
                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            }
        });

        let $allStates = $('<div>', {
            class: 'state-list'
        });
        for (const item in localStorage) {
            if (item.startsWith(STORAGE_STATE_PREFIX)) {
                let stateName = item.replace(STORAGE_STATE_PREFIX, '');
                $allStates.append($('<div>', {
                    class: 'state-selector rounded',
                    css: { cursor: 'pointer' }
                }).on('click', (evt) => {
                    let $target = $(evt.target).closest('.state-selector');
                    $('.selected-state').removeClass('selected-state');
                    $target.addClass('selected-state');
                }).append(
                    $('<p>', {
                        class: 'state-name',
                        text: stateName
                    })
                ))
            }
        }
        $loadDialog.append($allStates);
    }));

    // Save a state to localStorage
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'save',
        title: 'Save state', 
    }).on('click', (evt) => {
        let $saveAsDialog = $('<div>', {
            title: 'Save state as',
            id: 'save-as-dialog',
        }).dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: {
                "Save": function () {
                    let $input = $(this).find('input');
                    let stateName = $input.val();
                    localStorage.currentStateName = stateName;
                    localStorage[STORAGE_STATE_PREFIX + stateName] = JSON.stringify(globals.stateManager.state);
                    $('#state-header #state-name').text(stateName);
                    $(this).dialog('close');
                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            }
        });

        $saveAsDialog.append($('<div>').append($('<input>', {
                id: 'abr-state-save-name',
                type: 'text',
                val: localStorage.currentStateName ?? DEFAULT_STATE_NAME,
            }).on('input', (evt) => {
                let stateName = $(evt.target).val();
                if (localStorage.getItem(stateName)) {
                    $(evt.target).parent().append($('<p>', {class: 'save-as-warning', text: `Warning: State '${stateName}' already exists`}));
                } else {
                    $('.save-as-warning').remove();
                    $(evt.target).css('background-color', null);
                }
            }).on('keyup', (evt) => {
                if (evt.key == 'Enter') {
                    let $input = $(evt.target);
                    let stateName = $input.val();
                    localStorage.currentStateName = stateName;
                    localStorage[STORAGE_STATE_PREFIX + stateName] = JSON.stringify(globals.stateManager.state);
                    $('#state-header #state-name').text(stateName);
                    $(evt.target).parents('#save-as-dialog').dialog('close');
                }
            })
        ));
    }));

    // More settings
    // TODO
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'settings',
        title: 'More options...', 
    }));

    //----------------------------------------------------------------------

    let $stateHeader = $('<div>', {
        id: 'state-header',
    });

    // State name for the header
    // TODO
    $stateHeader.append($('<p>', {
        id: 'state-name',
        text: DEFAULT_STATE_NAME,
    }));

    // Loading spinner
    // TODO
    $stateHeader.append($('<div>', {
        class: 'abr-state-subscriber loading-spinner',
        title: 'Loading...',
        css: {visibility: 'hidden'},
    }));

    //----------------------------------------------------------------------

    let $screenshotHeader = $('<div>', {
        id: 'screenshot-header',
    });

    // Capture a screenshot
    // TODO
    $screenshotHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'camera_alt', 
    }));

    // Screenshot gallery
    // TODO
    $screenshotHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'collections', 
    }));

    // Put all the sub-headers in the main header
    $header.append($fileHeader);
    $header.append($stateHeader);
    $header.append($screenshotHeader);

    return $header;
}
