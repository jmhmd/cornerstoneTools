/*
Display scroll and image loading progress bar across bottom of image.
Display % loaded while image is loading.
 */
var cornerstoneTools = (function ($, cornerstone, cornerstoneTools) {

    "use strict";

    if(cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var scrollBarHeight = 6;

    function updateImage(e, eventData){

        var context = eventData.enabledElement.canvas.getContext("2d");

        var width = eventData.enabledElement.canvas.width;
        var height = eventData.enabledElement.canvas.height;

        // draw progress indicator background
        if (width > 0 && height > 0){
            drawBackground(context, width, height);
        } else {
            return false; // image not actually rendered yet, not sure what's going on here
        }

        // get current image index
        
        var stackData = cornerstoneTools.getToolState(eventData.element, 'stack');
        stackData = stackData && stackData.data[0];

        var imageScrollIndex = stackData && stackData.currentImageIdIndex;
        var totalImages = stackData && stackData.imageIds.length;

        var prefetchData = cornerstoneTools.getToolState(eventData.element, 'stackPrefetch');
        var imageIds = stackData.imageIds;

        // draw loaded images indicator
        // if (typeof indicesToRequest !== 'undefined'){
            setLoadedMarker(context, width, height, imageIds);
        // }

        // draw current image cursor
        if (typeof imageScrollIndex !== 'undefined'){
            drawCursor(context, width, height, imageScrollIndex, totalImages);
        }
        
    }

    function showProgress(event, data){

        if (!event.data.element){
            console.error('No element is available for this event.');
            return false;
        }

        var instances = event.data.instances,
            enabledElement;

        try {
            enabledElement = cornerstone.getEnabledElement(event.data.element);
        } catch (err) {
            // this may occur if an element in the midst of prefetching
            // is disabled/destroyed.
            console.warn('Progress event caught for non-enabled element');
            return false;
        }

        var file = data.fileURL.substring(data.fileURL.indexOf('://'));
        var stackData = cornerstoneTools.getToolState(event.data.element, 'stack');
        stackData = stackData && stackData.data[0];

        var currentImage;

        if (stackData){
            currentImage = stackData.imageIds[stackData.currentImageIdIndex];
        } else {
            currentImage = cornerstone.getEnabledElement(event.data.element).loadingImageId;
        }

        if (!currentImage){
            return false;
        }
        
        var currentImageURL = currentImage.substring(currentImage.indexOf('://'));

        if (file !== currentImageURL){
            return false;
        }

        var width = enabledElement.canvas.width;
        var height = enabledElement.canvas.height;
        var context = enabledElement.canvas.getContext("2d");
        
        /*
        Check if we need to compute the percent complete because it isn't given
        in the progress event
         */
        if (!data.total){
            if (!instances || !data.loaded){
                console.error('Cannot compute progress with the information provided.', instances, data.loaded);
                return false;
            }

            var files = instances.map(function(instance){ return instance.url.substring(instance.url.indexOf('://')); });
            var currentImageIndex = files.indexOf(currentImageURL);

            data.total = instances[currentImageIndex].originalSize;
            data.percentComplete = Math.round((data.loaded / data.total)*100);

        }

        drawImageLoadIndicator(context, data.percentComplete + '%', width, height);
    }

    function drawImageLoadIndicator(context, string, width, height){
        var x = width / 2;
        var y = height / 2;

        context.setTransform(1, 0, 0, 1, 0, 0);

        context.clearRect( 0, 0, width, height - scrollBarHeight);
        context.fillStyle = "white";
        context.font = "40px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(string, x, y);
    }

    function drawBackground(context, width, height) {

        context.setTransform(1, 0, 0, 1, 0, 0);

        context.fillStyle = 'rgb(19, 63, 141)';
        context.fillRect(0, height - scrollBarHeight, width, scrollBarHeight);
    }

    function drawCursor(context, width, height, index, totalImages){

        var cursorWidth = width / totalImages;
        var xPos = cursorWidth * index;

        context.setTransform(1, 0, 0, 1, 0, 0);

        context.fillStyle = 'white';
        context.fillRect(xPos, height - scrollBarHeight, cursorWidth, scrollBarHeight);
    }

    function setLoadedMarker(context, width, height, imageIds){

        var totalImages = imageIds.length,
            unitWidth = width / totalImages;

        context.setTransform(1, 0, 0, 1, 0, 0);

        for (var i=0; i<totalImages; i++){
            // if image not in 'indicesToRequest', means it has loaded
            //if (indicesToRequest.indexOf(i) === -1){
            var imageId = imageIds[i],
                imagePromise = viewer.cornerstone.imageCache.getImagePromise(imageId);
            if (imagePromise && imagePromise.state() === "resolved"){

                var offset = unitWidth * i;

                context.fillStyle = 'rgb(44, 154, 255)';
                context.fillRect(offset, height - scrollBarHeight, unitWidth, scrollBarHeight);
            }
        }

    }

    function getImageIds(element){
        var stackData = cornerstoneTools.getToolState(element, 'stack');
        return stackData && stackData.data[0] && stackData.data[0].imageIds;
    }

    function deactivateScrollIndicator(element) {

        $(element).off("CornerstoneImageRendered", updateImage);
        $(cornerstone).off("CornerstoneImageLoaded", updateImage);
    }

    function activateScrollIndicator(element) {

        var imageIds = getImageIds(element),
            enabledElement = cornerstone.getEnabledElement(element);

        deactivateScrollIndicator(element);

        $(element).on("CornerstoneImageRendered", updateImage);

        if (imageIds.length > 0){
            $(cornerstone).on("CornerstoneImageLoaded", function(e, eventData){
                var loadedIndex = imageIds.indexOf(eventData.image.imageId);

                if (loadedIndex > -1){
                    updateImage(e, {
                        element: element,
                        enabledElement: enabledElement,
                        loadedIndex: loadedIndex
                    });
                }
            });
        }
    }

    function deactivateLoadingIndicator(element, instances) {

        $(document).off("CornerstoneImageLoadProgress", {element: element, instances: instances}, showProgress);
    }

    /**
     * Activate image download indicator for the element
     * @param  {Object} element   DOM element
     * @param  {Array} instances Optional array of objects with metadata
     *                           for each instance in the stack, useful when loading
     *                           compressed images which do not report total file size
     *                           in XHR progress event. Each instance object needs
     *                           parameters 'url' (String) and 'originalSize' (Integer, in bytes)
     */
    function activateLoadingIndicator(element, instances) {

        deactivateLoadingIndicator(element, instances);

        $(document).on("CornerstoneImageLoadProgress", {element: element, instances: instances}, showProgress);

    }

    cornerstoneTools.scrollIndicator = {
        activate: activateScrollIndicator,
        deactivate: deactivateScrollIndicator
    };

    cornerstoneTools.loadingIndicator = {
        activate: activateLoadingIndicator,
        deactivate: deactivateLoadingIndicator
    };

    return cornerstoneTools;

} ($, cornerstone, cornerstoneTools));