/* components/Header.js
 *
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Header going across the top of the ABR Compose UI
 */

export function Header() {
    let $header = $('<header>', {
        id: 'header',
    });

    // Populate the file functions
    let $fileHeader = $('<div>', {
        id: 'file-header'
    });

    // Load a state
    // TODO: dialog
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'folder_open',
        title: 'Load state...',
        id: 'load-state',
    }));

    // Save a state
    // TODO
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'bookmark',
        title: 'Save state', 
    }));

    // Save as
    // TODO
    $fileHeader.append($('<button>', {
        class: 'material-icons rounded',
        html: 'bookmarks',
        title: 'Save state as...', 
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
        text: 'test-state-name',
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
