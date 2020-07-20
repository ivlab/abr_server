/* uiUtils.js * 
 * Copyright (c) 2020, University of Minnesota
 * Author: Bridger Herman <herma582@umn.edu>
 * 
 * Utility functions for the UI
 */

// Helper to expand/contract a div based on id/class
export function setCollapsibleDivState($div, expanded=true) {
    let $header = $div.prev('.collapsible-header');
    if (expanded) {
        $header.addClass('active');
        $div.css('maxHeight', `${$div.css('scrollHeight')}px`);
    } else {
        $header.removeClass('active');
        $div.css('maxHeight', null);
    }
}

export function collapsibleUpdate($target) {
    if ($target.hasClass('collapsible-content')) {
        let $header = $target.prev('.collapsible-header');
        if ($header.hasClass('active')) {
            let content = $target.get(0);
            content.style.maxHeight = content.scrollHeight + "px";
        }
    }
}

// Download a file
// from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
export function download(filename, contents, type) {
    let element = document.createElement('a');

    contents = encodeURIComponent(contents.trim());

    element.setAttribute('href', type + contents);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// from https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
function b64toBlob(b64Data, contentType='', sliceSize=512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

// Download a png file
export function downloadPng(filename, blob) {
    if (window.navigator.msSaveBlob) {
        // FOR IE BROWSER
        navigator.msSaveBlob(blob, filename);
    } else {
        // FOR OTHER BROWSERS
        let link = document.createElement("a");
        let csvUrl = URL.createObjectURL(blob);
        link.href = csvUrl;
        link.style = "visibility:hidden";
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}