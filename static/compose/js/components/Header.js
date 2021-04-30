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

    // Import state button
    let $importStateButton = $('<div>')
        .append($('<span>', { class: 'material-icons', text: 'cloud_upload'}))
        .append($('<span>', { text: 'Import State...' })).on('click', (evt) => {
            // Create a fake element to handle the actual upload
            let $fileInput = $('<input>', {
                type: 'file',
            }).on('change', (evt) => {
                if (!evt.target.files || !evt.target.files[0]) {
                    alert('No files uploaded!');
                    return;
                }

                let stateFileName = evt.target.files[0].name;
                // get rid of file extension
                let stateName = stateFileName.replace(/\.[^/.]+$/, ""); // https://stackoverflow.com/a/4250408

                let reader = new FileReader();
                $(reader).on('load', (loadEvt) => {
                    // Update the state with the stateManager
                    localStorage.currentStateName = stateName;
                    localStorage[STORAGE_STATE_PREFIX + stateName] = loadEvt.target.result;
                    globals.stateManager.updateState(loadEvt.target.result);
                });
                reader.readAsText(evt.target.files[0]);

                $fileInput.remove();
            });
            $('body').append($fileInput);
            $fileInput.click();
    });

    // Clear the state
    let $clearStateButton = $('<div>')
        .append($('<span>', { class: 'material-icons', text: 'backspace'}))
        .append($('<span>', { text: 'Clear State...' }))
        .on('click', (_evt) => {
            if (window.confirm('Are you sure you want to clear the state?')) {
                globals.stateManager.removePath('');
                localStorage.currentStateName = DEFAULT_STATE_NAME;
            }
    });


    let outTimer = null;
    $('<ul>', {
        id: 'abr-menu',
        css: { visibility: 'hidden' }
    }).append(
        $('<li>').append($importStateButton)
    ).append(
        $('<li>').append($clearStateButton)
    ).menu().appendTo($(document.body)).on('mouseout', (evt) => {
        outTimer = setTimeout(() => $('#abr-menu').css('visibility', 'hidden'), 500);
    }).on('mouseover', (evt) => {
        clearTimeout(outTimer);
        outTimer = null;
    });

    // "ABR" button - like file button; open menu when clicked
    $fileHeader.append(
        $('<button>', { class:  'abr-main-button rounded' }).append(
            $('<img>', { src: `${STATIC_URL}favicon.ico` })
        ).on('click', (evt) => {
            let visibility = $('#abr-menu').css('visibility');
            let newVisibility = visibility == 'visible' ? 'hidden' : 'visible';
            $('#abr-menu').css('visibility', newVisibility);
        })
    );

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
                    if (stateName) {
                        localStorage.currentStateName = stateName;
                        $('#state-header #state-name').text(stateName);

                        // Tell the server to update
                        globals.stateManager.updateState(localStorage.getItem(STORAGE_STATE_PREFIX + stateName));
                        $(this).dialog('close');
                    } else {
                        alert('Please select a state to load');
                    }
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
                ).append(
                    $('<div>', {
                        class: 'state-hover-controls'
                    }).append(
                        $('<button>', {
                            class: 'rounded',
                            text: 'Delete'
                        }).on('click', (evt) => {
                            localStorage.removeItem(item);
                            $(evt.target).closest('.state-selector').remove();
                        })
                    )
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
                val: localStorage.currentStateName ? localStorage.currentStateName : DEFAULT_STATE_NAME,
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

    // Undo/Redo
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'undo',
        title: 'Undo', 
    }).on('click', (_evt) => {
        globals.stateManager.undo();
    }));
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'redo',
        title: 'Redo', 
    }).on('click', (_evt) => {
        globals.stateManager.redo();
    }));

    // More settings
    // TODO
    // $fileHeader.append($('<button>', {
    //     class: 'material-icons rounded',
    //     html: 'settings',
    //     title: 'More options...', 
    // }));

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
