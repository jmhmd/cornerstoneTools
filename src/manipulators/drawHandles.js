var cornerstoneTools = (function ($, cornerstone, cornerstoneTools) {

    "use strict";

    if(cornerstoneTools === undefined) {
        cornerstoneTools = {};
    }

    var handleRadius = 6;

    function drawHandles(context, renderData, handles, color, fill)
    {
        context.strokeStyle = color;

        for(var property in handles) {
            var handle = handles[property];

            if (handle.active || handle.highlight) {
                context.beginPath();

                if (handle.active) {
                    context.lineWidth = cornerstoneTools.toolStyle.getActiveWidth();
                } else {
                    context.lineWidth = cornerstoneTools.toolStyle.getToolWidth();
                }
                
                var handleCanvasCoords = cornerstone.pixelToCanvas(renderData.element, handle);
                context.arc(handleCanvasCoords.x, handleCanvasCoords.y, handleRadius, 0, 2 * Math.PI);

                if (fill) {
                    context.fillStyle = fill;
                    context.fill();
                }

                context.stroke();
            }
        }
    }


    // module/private exports
    cornerstoneTools.drawHandles = drawHandles;

    return cornerstoneTools;
}($, cornerstone, cornerstoneTools));
