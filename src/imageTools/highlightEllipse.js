(function($, cornerstone, cornerstoneMath, cornerstoneTools) {

    'use strict';

    var toolType = 'highlightEllipse';

    ///////// BEGIN ACTIVE TOOL ///////
    function createNewMeasurement(mouseEventData) {
        //if already a highlight measurement, creating a new one will be useless
        var existingToolData = cornerstoneTools.getToolState(mouseEventData.event.currentTarget, toolType);
        if (existingToolData && existingToolData.data && existingToolData.data.length > 0) {
            return;
        }
        
        // create the measurement data for this tool with the end handle activated
        var measurementData = {
            visible: true, active: true, invalidated: true, handles: {
                start: {
                    x: mouseEventData.currentPoints.image.x, y: mouseEventData.currentPoints.image.y, highlight: true, active: false
                }, end: {
                    x: mouseEventData.currentPoints.image.x, y: mouseEventData.currentPoints.image.y, highlight: true, active: true
                }
            }
        };

        return measurementData;
    }
    ///////// END ACTIVE TOOL ///////

    function pointNearTool(element, data, coords) {
        // TODO: Find a formula for shortest distance between point and ellipse.  Rectangle is close enough
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: Math.min(startCanvas.x, endCanvas.x),
            top: Math.min(startCanvas.y, endCanvas.y),
            width: Math.abs(startCanvas.x - endCanvas.x),
            height: Math.abs(startCanvas.y - endCanvas.y)
        };

        var distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);
        return (distanceToPoint < 5);
    }

    function pointNearToolTouch(element, data, coords) {
        // TODO: Find a formula for shortest distance between point and ellipse.  Rectangle is close enough
        var startCanvas = cornerstone.pixelToCanvas(element, data.handles.start);
        var endCanvas = cornerstone.pixelToCanvas(element, data.handles.end);

        var rect = {
            left: Math.min(startCanvas.x, endCanvas.x),
            top: Math.min(startCanvas.y, endCanvas.y),
            width: Math.abs(startCanvas.x - endCanvas.x),
            height: Math.abs(startCanvas.y - endCanvas.y)
        };

        var distanceToPoint = cornerstoneMath.rect.distanceToPoint(rect, coords);
        return (distanceToPoint < 15);
    }

    ///////// BEGIN IMAGE RENDERING ///////
    function pointInEllipse(ellipse, location) {
        var xRadius = ellipse.width / 2;
        var yRadius = ellipse.height / 2;

        if (xRadius <= 0.0 || yRadius <= 0.0) {
            return false;
        }

        var center = {
            x: ellipse.left + xRadius, y: ellipse.top + yRadius
        };

        /* This is a more general form of the circle equation
         *
         * X^2/a^2 + Y^2/b^2 <= 1
         */

        var normalized = {
            x: location.x - center.x, y: location.y - center.y
        };

        var inEllipse = ((normalized.x * normalized.y) / (xRadius * xRadius)) + ((normalized.y * normalized.y) / (yRadius * yRadius)) <= 1.0;
        // var inEllipse = (Math.pow((location.x - center.x),2) / Math.pow(xRadius, 2)) + (Math.pow((location.y - center.y),2) / Math.pow(yRadius, 2)) <= 1;
        return inEllipse;
    }

    function onImageRendered(e, eventData) {

        // if we have no toolData for this element, return immediately as there is nothing to do
        var toolData = cornerstoneTools.getToolState(e.currentTarget, toolType);
        
        if (toolData === undefined) {
            return;
        }

        // we have tool data for this element - iterate over each one and draw it
        var context = eventData.canvasContext.canvas.getContext('2d');
        context.setTransform(1, 0, 0, 1, 0, 0);

        //activation color 
        var color;
        var lineWidth = cornerstoneTools.toolStyle.getToolWidth();

        context.save();

        var data = toolData.data[0];

        //differentiate the color of activation tool
        if (data.active) {
            color = cornerstoneTools.toolColors.getActiveColor();
        } else {
            color = cornerstoneTools.toolColors.getToolColor();
        }

        // draw the ellipse
        var handleStartCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.start);
        var handleEndCanvas = cornerstone.pixelToCanvas(eventData.element, data.handles.end);

        var widthCanvas = Math.abs(handleStartCanvas.x - handleEndCanvas.x);
        var heightCanvas = Math.abs(handleStartCanvas.y - handleEndCanvas.y);
        var leftCanvas = Math.min(handleStartCanvas.x, handleEndCanvas.x);
        var topCanvas = Math.min(handleStartCanvas.y, handleEndCanvas.y);
        // var centerX = (handleStartCanvas.x + handleEndCanvas.x) / 2;
        // var centerY = (handleStartCanvas.y + handleEndCanvas.y) / 2;
        
        // draw dashed stroke ellipse
        context.beginPath();
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.setLineDash([ 4 ]);
        // context.strokeRect(rect.left, rect.top, rect.width, rect.height);
        cornerstoneTools.drawEllipse(context, leftCanvas, topCanvas, widthCanvas, heightCanvas);

        // Strange fix, but restore doesn't seem to reset the line dashes?
        context.setLineDash([]);
        
        // draw the handles last, so they will be on top of the overlay
        cornerstoneTools.drawHandles(context, eventData, data.handles, color);
        
        // TODO: calculate this in web worker for large pixel counts...
        var width = Math.abs(data.handles.start.x - data.handles.end.x);
        var height = Math.abs(data.handles.start.y - data.handles.end.y);
        var left = Math.min(data.handles.start.x, data.handles.end.x);
        var top = Math.min(data.handles.start.y, data.handles.end.y);

        // var pixels = cornerstone.getPixels(eventData.element, left, top, width, height);
        
        if (width === 0 || height === 0){ return false; }
        
        var imageContext = cornerstone.getEnabledElement(eventData.element).canvas.getContext('2d')
        var imageData = imageContext.getImageData(leftCanvas, topCanvas, widthCanvas, heightCanvas);
        var data = imageData.data;
        
        var ellipse = {
            left: leftCanvas, top: topCanvas, width: widthCanvas, height: heightCanvas
        };
        
        var x=0;
        var y=0;
        for (var i = 0; i < data.length; i++) {
            if (i%4===0){
                if (x+1>widthCanvas){
                    y++;
                    x=0;
                }
                x++;
            }
            if (pointInEllipse(ellipse, {x:x+leftCanvas, y:y+topCanvas})){
            // if (){
                data[i] += 100;
            }
        }
        imageContext.putImageData(imageData, leftCanvas, topCanvas);


        
        
        
        context.restore();
        
    }
    ///////// END IMAGE RENDERING ///////

    // module exports
    cornerstoneTools.highlightEllipse = cornerstoneTools.mouseButtonTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearTool,
        pointInsideEllipse: pointInEllipse,
        toolType: toolType
    });
    cornerstoneTools.highlightEllipseTouch = cornerstoneTools.touchTool({
        createNewMeasurement: createNewMeasurement,
        onImageRendered: onImageRendered,
        pointNearTool: pointNearToolTouch,
        pointInsideEllipse: pointInEllipse,
        toolType: toolType
    });

})($, cornerstone, cornerstoneMath, cornerstoneTools);
