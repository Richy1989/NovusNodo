﻿
function SetResizableSidebarWidth(width) {
    console.log("Setting sidebar width to " + width);
    var sidebar = document.getElementById("resizableSideBar");
    sidebar.style.width = width;
}

const selectTarget = (fromElement, selector) => {
    if (!(fromElement instanceof HTMLElement)) {
        return null;
    }

    return fromElement.querySelector(selector);
};

const resizeData = {
    tracking: false,
    startWidth: null,
    startCursorScreenX: null,
    handleWidth: 20,
    resizeTarget: null,
    parentElement: null,
    maxWidth: null,
};

$(document.body).on('mousedown', '.resize-handle--x', null, (event) => {
    if (event.button !== 0) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const handleElement = event.currentTarget;

    if (!handleElement.parentElement) {
        console.error(new Error("Parent element not found."));
        return;
    }

    // Use the target selector on the handle to get the resize target.
    const targetSelector = handleElement.getAttribute('data-target');
    const targetElement = selectTarget(handleElement.parentElement, targetSelector);

    if (!targetElement) {
        console.error(new Error("Resize target element not found."));
        return;
    }

    resizeData.startWidth = $(targetElement).outerWidth();
    resizeData.startCursorScreenX = event.screenX;
    resizeData.resizeTarget = targetElement;
    resizeData.parentElement = handleElement.parentElement;
    resizeData.maxWidth = $(handleElement.parentElement).innerWidth() - resizeData.handleWidth;
    resizeData.tracking = true;

    console.log('tracking started');
});

$(window).on('mousemove', null, null, _.debounce((event) => {
    if (resizeData.tracking) {
        const cursorScreenXDelta = event.screenX - resizeData.startCursorScreenX;
        const newWidth = Math.min(resizeData.startWidth - cursorScreenXDelta, resizeData.maxWidth);

        $(resizeData.resizeTarget).outerWidth(newWidth);

        //Resize the Joint JS Paper
        //resizeCanvas();
    }
}, 1));

$(window).on('mouseup', null, null, (event) => {
    if (resizeData.tracking) {
        resizeData.tracking = false;

        console.log('tracking stopped');
    }
});