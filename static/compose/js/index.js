/* index.js
 * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Main controller for the ABR Design Interface
 */

import { Validator } from '../../Validator.js'
import { initAbrEngineInterface, messenger } from './AbrMessenger.js'
import * as Components from './Components/Components.js'
import { collapsibleUpdate, setCollapsibleDivState, download, downloadPng } from './UiUtils.js'
import { sendInputUpdate, handleStateMessage } from './MessageUtils.js'
import { uuid } from './UUID.js'
import { CollapsibleDiv, RenderingStrategyList } from './Components/Components.js'
import { storage } from './storage.js'

const ABR_VERSION = '0.2.0';

function preInit() {
    // Make sure the version of the schema matches
    storage.validator = new Validator('abr_state.json');
    let schemaPromise = storage.validator.schema.then((scm) => {
        let version = scm.properties.version.const;
        if (typeof(version) === 'undefined') {
            throw 'State version is undefined';
        }

        if (version != ABR_VERSION) {
            throw `Compose version ${ABR_VERSION} is not compatible with state version ${version}`;
        }

        storage.schema = scm;
    });

    // Query the available data
    let dataPromise = fetch('/api/data').then((resp) => resp.text()).then((txt) => {
        let dataList = JSON.parse(txt)['data'];

        storage.keyData = dataList.map((name) => name.replace('.json', ''));

        let varListPromises = [];
        for (const d of dataList) {
            varListPromises.push(fetch(`/api/data/${d}`)
                .then((resp) => resp.text())
                .then((txt) => JSON.parse(txt)['data']));
        }

        Promise.all(varListPromises).then((vars) => {
            let scalarVars = new Set();
            let vectorVars = new Set();
            for (const v of vars) {
                scalarVars.add(...v['ScalarDataVariable']);
                vectorVars.add(...v['VectorDataVariable']);
            }

            storage.scalarVars = Array.from(scalarVars);
            storage.vectorVars = Array.from(vectorVars);
        });
    });

    return Promise.all([schemaPromise, dataPromise]);
}

function init() {
    console.log(storage.keyData);
    console.log(storage.scalarVars);
    console.log(storage.vectorVars);

    // Hack to make sure virtual keyboard shows on touch devices
    $(document).on('click', (evt) => {
        evt.target.focus();
    });

    // Tooltips for larger images on hover adapted from
    // https://chartio.com/resources/tutorials/how-to-show-data-on-mouseover-in-d3js/
    $('body').append($('<div>', {
        id: 'thumbnail-tooltip',
        css: {
            'position': 'absolute',
            'z-index': '100',
            'visibility': 'hidden',
        },
    }));

    // Allow the user to pan the composition window
    let initPos = $('#composition-loader').position();
    $('#composition-loader').draggable({
        stop: (evt, _ui) => {
            let pos = $(evt.target).position();
            if (pos.left > initPos.left) {
                $(evt.target).css('left', 0);
            }
            if (pos.top > initPos.top) {
                $(evt.target).css('top', 0);
            }
        }
    });

    // collapsible panels -- this could be a little cleaner / more consistent
    // style if done with jquery, but this works fine...
    var coll = document.getElementsByClassName("collapsible-header");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    // Add the trash can functionality
    $('.composition-panel').append(
        $('<div>', {class: 'trash'}).append(
            $('<img>', {
                src: `${STATIC_URL}compose/trash.svg`,
            })
        )
    );
    $('.trash').droppable({
        tolerance: 'pointer',
        drop: (_evt, ui) => {
            let isVisAsset =
                $(ui.draggable).hasClass('artifact') &&
                $(ui.draggable).hasClass('swatch') &&
                !$(ui.draggable).hasClass('numeric-input');
            let objectUUID = $(ui.draggable).data('uuid');
            let updateMsg = {
                type: 'DeleteNode',
                uuid: objectUUID,
                // If the node is a VisAsset artifact, then tell ABR Engine to delete from disk
                deleteVisAsset: isVisAsset,
            };
            messenger.sendUpdate(updateMsg);
            $(ui.draggable).remove();
        },
        // Indicate that it's about to be deleted
        over: (_evt, ui) => {
            $(ui.helper).css('opacity', '25%');
        },
        out: (_evt, ui) => {
            $(ui.helper).css('opacity', '100%');
        }
    });

    // Initialize the interface with the ABR engine (WebSockets + sockets) for
    // communication
    initAbrEngineInterface();
    messenger.addMessageCallback(handleStateMessage);

    $('#available-styles-collapser').append(RenderingStrategyList());

    return

    // Build the list of rendering strategies to choose from
    $('#rendering-strategy-list').on('abrStateUpdate', (evt, state) => {
        $(evt.target).empty();
        let renderingStrategies = state.header.renderingStrategies;
        renderingStrategies.forEach((rs) => {
            $(evt.target).append(Components.RenderingStrategySwatch(rs.name, rs.inputs, rs.topology, rs.type, state.header));
        });
    });

    // Build the list of key datasets
    $('#paraview-keydata-list').on('abrStateUpdate', (evt, state) => {
        // Clear out the old datasets
        $(evt.target).empty();

        let $datasets = $('<div>');
        for (const keyData of state.header.availableData.keyData) {
            $datasets.append(
                $('<div>', {class: 'puzzle-list-item'}).append(Components.KeydataSwatch(keyData))
            );
        }

        // Actually put the datasets and variables in the palette
        $(evt.target).append($datasets);
    });

    // Build the list of key datasets
    $('#paraview-scalar-list').on('abrStateUpdate', (evt, state) => {
        // Clear out the old datasets
        $(evt.target).empty();

        let $scalarVariables = $('<div>');
        for (const variable of state.header.availableData.scalarVariables) {

            // Right-align the label so the most significant (last) part is visible for long names
            let $rtlLabel = $('<div>', { class: 'outer-align' }).append(
                $('<div>', {class: 'inner-align'}).append(
                    $('<p>', {text: variable.label})
                )
            );
            $scalarVariables.append(
                $('<div>', {class: 'puzzle-list-item'}).append(
                    Components.PuzzleSwatch(
                        variable,
                        'IScalarDataVariable',
                        'variable',
                        '',
                        false,
                        false,
                        $rtlLabel,
                    ),
                )
            );
        }

        // Actually put the datasets and variables in the palette
        $(evt.target).append($scalarVariables);
    });


    // Build the list of key datasets
    $('#paraview-vector-list').on('abrStateUpdate', (evt, state) => {
        // Clear out the old datasets
        $(evt.target).empty();

        let $vectorVariables = $('<div>');
        for (const variable of state.header.availableData.vectorVariables) {
            $vectorVariables.append(
                $('<div>', {class: 'puzzle-list-item'}).append(
                    Components.PuzzleSwatch(variable, 'IVectorDataVariable', 'variable', '')
                )
            );
        }

        // Actually put the datasets and variables in the palette
        $(evt.target).append($vectorVariables);
    });

    // Create a button to clear the library
    $('<button>', {
        class: 'create-source',
        text: 'Clear unused assets',
    }).on('click', (evt) => {
        let state = storage.cachedState;
        let toDelete = new Set();

        // Go through every vis asset and see if it's being used. If not, queue a message to delete it.
        for (const visasset of state.availableVisassets) {
            let found = false;
            for (const rs of state.compositionNodes) {
                if (Object.values(rs.connections).includes(visasset.uuid)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                toDelete.add(visasset.uuid);
            }
        }
        $('<div>', {
            text: `Clear all unused artifacts from the local library? (${toDelete.size} artifacts will be deleted)`,
        }).dialog({
            resizable: false,
            height: "auto",
            width: 400,
            modal: true,
            buttons: {
                "Yes, Clear": function() {
                    for (const assetUUID of toDelete) {
                        console.log(`Deleting visasset ${assetUUID}`);
                        messenger.sendUpdate({
                            type: 'DeleteNode',
                            uuid: assetUUID,
                            deleteVisAsset: true,
                        });
                    }
                    $(this).dialog('close');
                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            },
        })
    }).insertBefore('#local-library');

    CollapsibleDiv('Lights',
        $('<div>', {
            class: 'abr-state-subscriber',
            id: 'light-list'
        }).on('abrStateUpdate', (evt, state) => {
            $(evt.target).empty();

            for (const light of state.header.lights) {
                $(evt.target).append(Components.LightInfo(light));
            }
        })
    ).insertAfter('#lighting-header');

    $('#local-library').on('abrStateUpdate', (evt, state) => {
        // Clear out the old artifacts
        $(evt.target).empty();

        state.availableVisassets.sort((v1, v2) => {
            if (v1.artifactType > v2.artifactType) {
                return 1;
            } else if (v1.artifactType < v2.artifactType) {
                return -1;
            } else {
                return 0;
            }
        });

        let $visAssets = $('<div>');
        let previousVisAsset;
        if (state.availableVisassets.length > 0) {
            previousVisAsset = state.availableVisassets[0].artifactType || '';
        } else {
            previousVisAsset = '';
        }

        let $content = $('<div>');
        for (const visAsset of state.availableVisassets) {
            if (visAsset.artifactType != previousVisAsset) {
                let $collpaser = CollapsibleDiv(previousVisAsset.slice(1), $content);
                $visAssets.append($collpaser);
                $content = $('<div>');
                previousVisAsset = visAsset.artifactType;
            }
            $content.append(
                $('<div>', {class: 'puzzle-list-item'}).append(
                    Components.PuzzleSwatch(visAsset, visAsset.artifactType, 'artifact', '', true, true)
                )
            );
        }

        // Append the last div
        let $collpaser = CollapsibleDiv(previousVisAsset.slice(1), $content);
        $visAssets.append($collpaser);

        // Actually put the artifacts on the webpage
        $(evt.target).append($visAssets);
    });

    // Populate the current composition nodes
    $('#composition-loader').on('abrStateUpdate', (evt, state) => {
        $(evt.target).empty();

        // Instantiate each composition node from its type, UUID, and
        // connections
        for (const node of state.compositionNodes) {
            // Find the canonical name of this render strategy type from the header
            let strategy = state.header.renderingStrategies.filter((rs, _i) => {
                return rs.type == node.type;
            })[0];

            // Instantiate it with the name, and existing uuid
            let $rs = Components.RenderingStrategy(
                strategy.name,
                strategy.inputs,
                strategy.topology,
                strategy.type,
                node.uuid,
                node.keydataUUID,
                node.connections,
                node.uiMetadata,
                node.label,
                state.header,
            );

            // Add the keydata block into the socket
            let keydata = state.header.availableData.keyData.find(
                (el, _i) => el.uuid == node.keydataUUID
            );

            if (keydata) {
                let $keyDataBlock = Components.KeydataBlock(keydata);

                // Position the block within the socket and add it to the DOM
                $keyDataBlock.css('position', 'absolute');
                $rs.find('.keydata-socket').append($keyDataBlock);
            }

            // Create all the variable connections
            for (const socketName in node.connections) {
                if (node.connections[socketName]) {
                    // Find the proper asset (variable or artifact) and construct the block
                    let scalarVar = state.header.availableData.scalarVariables.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    let vectorVar = state.header.availableData.vectorVariables.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    let artifact = state.availableVisassets.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    let numericInput = state.numericInputs.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    let checkboxInput = state.checkboxInputs.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    let rangedScalar = state.rangedScalars.find(
                            (el, _i) => el.uuid == node.connections[socketName]);
                    
                    let $block;
                    if (scalarVar) {
                        $block = Components.RemappedPuzzleBlock(scalarVar);
                        // $block = Components.PuzzleBlock(
                        //     scalarVar,
                        //     'IScalarDataVariable',
                        //     'variable',
                        //     '',
                        // );
                    } else if (vectorVar) {
                        $block = Components.PuzzleBlock(
                            vectorVar,
                           'IVectorDataVariable',
                            'variable',
                            '',
                        );
                    } else if (artifact) {
                        $block = Components.PuzzleBlock(
                            artifact,
                            artifact.artifactType,
                            'artifact',
                            '',
                            true, // Artifacts have left-aligned connectors
                            true, // Artifacts should display their thumbnails
                        ).css('left', '-1.2rem'); // Move the artifacts so they line up with the sockets
                    } else if (numericInput) {
                        $block = Components.NumericInput(numericInput);
                        $block.css('left', '-1.2rem');
                    } else if (checkboxInput) {
                        $block = Components.NumericInput(checkboxInput);
                        $block.css('left', '-1.2rem');
                    } else if (rangedScalar) {
                        // Find the scalar data that this remapper refers to
                        $block = Components.RemappedPuzzleBlock(rangedScalar);
                    }

                    // Find the proper socket to put the block in
                    if (typeof($block) != 'undefined' && $block.length > 0) {
                        let $socket = $rs.find('.socket').filter((_i, el) => {
                            return $(el).data('socketName') == socketName;
                        });
                        $block.css('position', 'absolute');
                        $socket.append($block);
                    }
                }
            }

            $(evt.target).append($rs);
        }

        // Update the state name so that 
    });

    // Add state load dialog
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'folder_open',
        title: 'Load state',
        id: 'load-state',
    }).on('click', (evt) => {
        let $loaderDialog = $('<div>', {
            title: 'Load a state',
            class: 'state-loader-list',
        }).dialog({
            resizable: false,
            height: "auto",
            width: $(document).width() * 0.75,
            modal: true,
            buttons: {
                "Cancel": function () {
                    $(this).dialog('close');
                }
            },
        });

        $loaderDialog.empty();
        for (const stateFile of storage.cachedState.availableStates) {
            let $state = Components.StateBlock(stateFile);
            $state.on('click', (evt) => $(evt.target).closest('.ui-dialog-content').dialog('close'));
            $loaderDialog.append($state);
        }
    }));

    // Add state save button
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'bookmark',
        title: 'Save state',
    }).on('click', (evt) => {
        // Make sure it's not AutoSave or Untitled
        if (storage.currentStateName == 'AutoSave' || storage.currentStateName == 'Untitled') {
            $('<div>', {
                title: 'Unable to save',
                text: 'Cannot save over `AutoSave` or `Untitled` states'
            }).dialog({
                resizable: false,
                height: 'auto',
                width: 400,
                modal: true,
                buttons: {
                    "Ok": function () {
                        $(this).dialog('close');
                    }
                }
            })
        } else {
            storage.stateToSave = storage.currentStateName;
            messenger.sendUpdate({
                type: 'SaveState',
                stateName: storage.currentStateName,
            });
        }
    }));

    // Add state save as dialog
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'bookmarks',
        title: 'Save state as',
    }).on('click', (evt) => {
        // Make sure it's not AutoSave or Untitled
        let $saveAsDialog = $('<div>', {
            title: 'Save state as',
        }).dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: {
                "Save": function () {
                    let $input = $(this).find('input');
                    storage.currentStateName = $input.val();
                    storage.stateToSave = storage.currentStateName;
                    messenger.sendUpdate({
                        type: 'SaveState',
                        stateName: storage.currentStateName,
                    });
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
                val: storage.currentStateName,
            }).on('input', (evt) => {
                let existingStateNames = storage.cachedState.availableStates;
                if (existingStateNames.indexOf($(evt.target).val()) >= 0) {
                    $(evt.target).parent().append($('<p>', {class: 'save-as-warning', text: `Warning: State '${$(evt.target).val()}' already exists`}));
                    $(evt.target).css('background-color', 'light-red');
                } else {
                    $('.save-as-warning').remove();
                    $(evt.target).css('background-color', null);
                }
            })
        ));
    }));

    // Add state upload dialog
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'cloud_upload',
        title: 'Upload state',
    }).on('click', (evt) => {
        $('<div>', {
            title: 'Upload a state'
        }).append(
            $('<input>', {
                id: 'state-upload',
                title: 'Upload state to the ABR engine',
                type: 'file',
            }).on('change', (evt) => {
                if (!evt.target.files || !evt.target.files[0]) {
                    alert('No files uploaded!');
                    return;
                }

                let stateFileName = evt.target.files[0].name;
                let stateName = stateFileName.replace(/\.[^/.]+$/, ""); // https://stackoverflow.com/a/4250408

                let reader = new FileReader();
                $(reader).on('load', (loadEvt) => {
                    let stateJson = JSON.parse(loadEvt.target.result);
                    let message = {
                        type: 'UploadState',
                        stateName: stateName,
                        stateContents: stateJson,
                    };

                    // Enable the upload and give it the message
                    $('#upload-dialog-button').data('uploadStateMessage', message);
                });
                reader.readAsText(evt.target.files[0]);

            })
        ).dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: [
                {
                    text: "Upload",
                    click: function () {
                        // Retrieve the uploaded state
                        let message = $('#upload-dialog-button').data('uploadStateMessage');
                        if (message) {
                            messenger.sendUpdate(message);
                        }
                        $(this).dialog('close');
                    },
                    id: 'upload-dialog-button',
                },
                {
                    text: "Cancel",
                    click: function () {
                        $(this).dialog('close');
                    }
                }
            ]
        })
    }));

    // Add clear state button
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'delete_sweep',
        title: 'Clear state',
    }).on('click', (evt) => {
        $('<div>', {
            title: 'Clear state?',
            text: 'Are you sure you want to clear the state?',
        }).dialog({
            resizable: false,
            height: 'auto',
            width: 400,
            modal: true,
            buttons: {
                "Yes, clear": function () {
                    messenger.sendUpdate({
                        type: 'ClearState',
                    });
                    $(this).dialog('close');
                },
                "Cancel": function () {
                    $(this).dialog('close');
                }
            },
        })
    }));

    // Add refresh state button
    $('#file-header').append($('<button>', {
        class: 'material-icons',
        html: 'refresh',
        title: 'Refresh state. Try this if things aren\'t working.',
    }).on('click', (evt) => {
        messenger.sendUpdate({
            type: 'LoadState',
            stateName: storage.currentStateName,
        });
    }));


    // Update the state name
    $('#state-header').append(
        $('<p>', {
            text: storage.currentStateName,
            class: 'abr-state-subscriber',
        }).on('abrStateUpdate', (evt, state) => {
            if (storage.stateToSave && storage.stateToSave == state.currentStateName) {
                // Heard back from the engine - successfully saved.
                $(evt.target).text(state.currentStateName);
                $(evt.target).attr('title', null);
                storage.stateToSave = null;
            } else {
                if (typeof(storage.currentStateName) == "undefined") {
                    // Is it the first time we've received a state? Then set the current state
                    storage.currentStateName = state.currentStateName;
                    $(evt.target).text(state.currentStateName);
                    $(evt.target).attr('title', null);
                    storage.stateToSave = null;
                } else {
                    // Otherwise just a general state - mark it as unsaved
                    $(evt.target).text(state.currentStateName + ' *');
                    $(evt.target).attr('title', 'You have unsaved changes');
                }
            }
        })
    );

    // Add the loading spinner
    $('#state-header').append(
        $('<div>', {
            class: 'abr-state-subscriber loading-spinner',
            title: 'Loading...',
            css: {visibility: 'hidden'},
        }).on('abrStateUpdate', (evt, _state) => $(evt.target).css('visibility', 'hidden'))
    );

    // Add the screenshot button
    $('#screenshot-header').append($('<button>', {
        class: 'material-icons',
        html: 'camera_alt',
    }).on('click', (evt) => {
        // Save a screenshot when the button is pressed
        messenger.sendUpdate({
            type: 'SaveScreenshot',
            stateName: storage.currentStateName,
        });
        alert('Captured screenshot!');
    }));

    // Add the screenshot gallery button
    $('#screenshot-header').append($('<button>', {
        class: 'material-icons',
        html: 'collections',
    }).on('click', (evt) =>{
        fetch(`/api/screenshot-list/${storage.currentStateName}`)
            .then((data) => data.json())
            .then((json) => {

                let $dialog = $('<div>', {
                    title: 'Screenshot Gallery',
                    class: 'state-loader-list',
                }).dialog({
                    resizable: false,
                    height: 'auto',
                    width: 400,
                    modal: true,
                    buttons: {
                        "Cancel": function () {
                            $(this).dialog('close');
                        }
                    }
                });

                let stateName = storage.currentStateName;
                let screenshotList = json.screenshots;
                $dialog.empty();

                // Ask for all the thumbnails
                for (const screenshot of screenshotList) {
                    $dialog.append(Components.ScreenshotBlock(stateName, screenshot));
                }
            });
    }));

    // Refresh the pixel height of all the collapsible divs when we receive a
    // new state or anything that might affect the height of the divs
    $('.collapsible-content').addClass('abr-state-subscriber');
    $('.collapsible-content').on('abrStateLateUpdate', (evt, _state) => collapsibleUpdate($(evt.target)));

    // Allow the page to receive UUIDs from the library, then tell ABR to
    // download them
    $(document).on('dragover', (evt) => {
        evt.preventDefault();
    });
    $(document).on('drop', (evt) => {
        if (!$(evt.target).hasClass('ui-droppable')) {
            evt.preventDefault();
            evt.originalEvent.dataTransfer.items[0].getAsString((url) => {
                let uuidRegex = /[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}/;
                let matches = uuidRegex.exec(url);

                if (matches[0]) {
                    messenger.sendUpdate({
                        type: "DownloadArtifact",
                        uuid: matches[0]
                    });
                }
            });
        }
    });
}

window.onload = () => {
    preInit().then(init);
};