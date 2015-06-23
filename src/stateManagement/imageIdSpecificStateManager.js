var cornerstoneTools = (function ($, cornerstone, cornerstoneTools) {

    "use strict";

    if(cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    // This implements an imageId specific tool state management strategy.  This means that
    // measurements data is tied to a specific imageId and only visible for enabled elements
    // that are displaying that imageId.

    function newImageIdSpecificToolStateManager() {
        var toolState = {};

        // here we add tool state, this is done by tools as well
        // as modules that restore saved state
        function addImageIdSpecificToolState(element, toolType, data)
        {
            var enabledImage = cornerstone.getEnabledElement(element);
            // if we don't have any tool state for this imageId, add an empty object
            if(!enabledImage.image || toolState.hasOwnProperty(enabledImage.image.imageId) === false)
            {
                toolState[enabledImage.image.imageId] = {};
            }
            var imageIdToolState = toolState[enabledImage.image.imageId];

            // if we don't have tool state for this type of tool, add an empty object
            if(imageIdToolState.hasOwnProperty(toolType) === false)
            {
                imageIdToolState[toolType] = {
                    data: []
                };
            }
            var toolData = imageIdToolState[toolType];

            // finally, add this new tool to the state
            toolData.data.push(data);
        }

        // here you can get state - used by tools as well as modules
        // that save state persistently
        function getImageIdSpecificToolState(element, toolType)
        {
            var enabledImage = cornerstone.getEnabledElement(element);
            // if we don't have any tool state for this imageId, return undefined
            if(!enabledImage.image || toolState.hasOwnProperty(enabledImage.image.imageId) === false)
            {
                return undefined;
            }
            var imageIdToolState = toolState[enabledImage.image.imageId];

            // if we don't have tool state for this type of tool, return undefined
            if(imageIdToolState.hasOwnProperty(toolType) === false)
            {
                return undefined;
            }
            var toolData = imageIdToolState[toolType];
            return toolData;
        }

        // get private toolstate
        function getToolState()
        {
            return toolState;
        }

        // set private toolstate
        function setToolState(state)
        {
            if (!state || !$.isPlainObject(state)){
                return false;
            }

            toolState = state;
        }

        // Clears all tool data from this toolStateManager.
        function clearImageIdSpecificToolStateManager(element) {
            var enabledImage = cornerstone.getEnabledElement(element);
            if(toolState.hasOwnProperty(enabledImage.image.imageId) === false)
            {
                return undefined;
            }
            delete toolState[enabledImage.image.imageId];
        }

        var imageIdToolStateManager = {
            get: getImageIdSpecificToolState,
            add: addImageIdSpecificToolState,
            getToolState: getToolState,
            setToolState: setToolState,
            clear: clearImageIdSpecificToolStateManager
        };
        return imageIdToolStateManager;
    }

    // a global imageIdSpecificToolStateManager - the most common case is to share state between all
    // visible enabled images
    var globalImageIdSpecificToolStateManager = newImageIdSpecificToolStateManager();

    // module/private exports
    cornerstoneTools.newImageIdSpecificToolStateManager = newImageIdSpecificToolStateManager;
    cornerstoneTools.globalImageIdSpecificToolStateManager = globalImageIdSpecificToolStateManager;

    return cornerstoneTools;
}($, cornerstone, cornerstoneTools));
