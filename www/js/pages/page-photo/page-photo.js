'use strict';

angular.module('app.components')

.directive('pagePhoto', function() {
    return {
        restrict: 'E',
        scope: {},
        link: function($scope, $element) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Photo');
            }

            initializeCanvas();

            function initializeCanvas() {
                var $canvasContainer = jQuery('#canvas-container');
                var canvasElement = jQuery('#canvas')[0];//$element.find('canvas')[0];
                var canvas = new fabric.Canvas(canvasElement, {
                    imageSmoothingEnabled: true
                });

                overrideCanvasControls(canvas);
                setCanvasHeight(canvas, $canvasContainer);

                canvas.controlsAboveOverlay = true;
                canvas.selection = false; // disable group selection
                canvas.renderAll();

                $scope.canvas = canvas;

                addCanvasListeners(canvas);
            }

            function overrideCanvasControls(canvas) {

                overrideCanvasPrototype();

                //our custom image for the controls
                var image = new Image();
                image.src = 'img/fabricjs/control.png';

                /* callbacks for drawing the controls */
                canvas.hasControlCallback = {
                    tl: true, //top-left
                    tr: true, //top-right
                    br: true, //bottom-right
                    bl: true, //bottom-left
                    ml: true, //middle-left
                    mt: true, //middle-top
                    mr: true, //middle-right
                    mb: true, //middle-bottom
                    mtr: true //middle-top-rotate
                };

                //this function lives within the overrideCanvasControls function because we need to keep a reference to the image variable
                function controlCallback(ctx, left, top, size) {
                    var x = left - image.width/2 + size/2;
                    var y = top - image.height/2 + size/2;

                    ctx.drawImage(image, x, y);
                }

                canvas.controlCallback = {
                    //tl, tr, br, bl, ml, mt, mr, mb, mtr, for "top-left", "top-right", ... "middle-top-rotate"
                    tl: controlCallback,
                    tr: controlCallback,
                    br: controlCallback,
                    bl: controlCallback,
                    ml: controlCallback,
                    mt: controlCallback,
                    mr: controlCallback,
                    mb: controlCallback,
                    mtr: false, //rotating is disabled, and if it wouldn't be disabled, we would allow it through gestures, not through this ugly control
                };
            }

            function overrideCanvasPrototype() {
                var _original = fabric.Object.prototype._drawControl;

                var hasFailedBefore = false;

                fabric.Object.prototype._drawControl = function(control, ctx, methodName, left, top) {

                    //we don't have to draw the controls when this object is invisible
                    if (!this.isControlVisible(control)) {
                      return;
                    }

                    //if we didn't define a controlCallback, then we just call the original method and we're done
                    if(! (this.canvas.hasControlCallback && this.canvas.hasControlCallback[control])) {
                          _original.call(this, control, ctx, methodName, left, top);
                          return;
                    }

                    //we will only try executing the controlCallback when it's a valid function
                    if( ! (typeof(this.canvas.controlCallback[control]) === 'function')) {
                        return;
                    }

                    //if we failed to execute the custom controlCallback before, then we just call the original method and we're done
                    if(hasFailedBefore && this.canvas.hasControlCallback) {
                          _original.call(this, control, ctx, methodName, left, top);
                          return;
                    }

                    //if we DID define a controlCallback, then we try executing it. If it fails, we fallback to the original method
                    try {
                        var size = this.cornerSize;
                        this.canvas.controlCallback[control](ctx, left, top, size, _original); //seems to work on desktop but fails on mobile
                    } catch(e) {
                        Rollbar.error("Getting photo failed", e);

                        // fallback to the original implementation
                        hasFailedBefore = true;
                        console.error(e);
                        _original.call(this, control, ctx, methodName, left, top);
                    }
                };
            }

            function addCanvasListeners(canvas) {
                //throttle timing is set at 8 because we want to ensure this listener gets hit on every repaint,
                //(setting it to 16 would show glitchy behaviour)
                var throttledEnsureObjectMovesWithinCanvas = _.throttle(ensureObjectMovesWithinCanvas, $scope.objectMovesWithinCanvasThrottleTime);
                var throttledRespectMinimumObjectScale = _.throttle(respectMinimumObjectScale, $scope.respectMinimumObjectScaleThrottleTime);
                canvas.on('object:moving', throttledEnsureObjectMovesWithinCanvas);
                canvas.on('object:scaling', throttledRespectMinimumObjectScale);
            }

            function respectMinimumObjectScale(e) {
                var obj = e.target;

                if(obj.minScale) {
                    obj.setCoords();

                    if(obj.scaleX < obj.minScale) {
                        obj.scaleX = obj.minScale;
                    }

                    if(obj.scaleY < obj.minScale) {
                        obj.scaleY = obj.minScale;
                    }
                }
            }

            /**
             * Determine the width and height and explicitly set this onto the $canvasContainer and our fabricJS canvas element
             * Our canvas will be a square so we will use the lowest size value determined by $contentPhoto
             */
            function setCanvasHeight(canvas, $canvasContainer) {

                var $contentPhoto = jQuery('#content-photo');
                var height = $contentPhoto.height();
                var width = $contentPhoto.width();

                var smallest = (height < width) ? height : width;
                smallest = correctSmallestAvailableCanvasHeight(smallest);

                $canvasContainer.height(smallest);
                $canvasContainer.width(smallest);

                canvas.setHeight(smallest);
                canvas.setWidth(smallest);
            }

            /**
             * We need to account for the other components on the page
             */
            function correctSmallestAvailableCanvasHeight(smallest) {

                // Calculate available height (.content-photo - controls max-height)
                var entireHeight = $('.content-photo').height();
                var controlsMaxHeight = $('.controls.controls-bottom').css('max-height').slice(0,-2);
                var availableHeight = entireHeight - controlsMaxHeight;

                var correctedSmallest = (smallest < availableHeight) ? smallest : availableHeight;

                //make sure our canvas height is an integer value that's divisable by 2
                correctedSmallest = Math.floor(correctedSmallest);
                if(correctedSmallest % 2 === 1) {
                    correctedSmallest -= 1;
                }

                return correctedSmallest;
            }

            /**
             * disable object moving out of the canvas bounds (custom logic)
             */
            function ensureObjectMovesWithinCanvas(e) {
                //var canvas = $scope.canvas;
                var obj = e.target;
                obj.setCoords();


                var minMax = $scope.minMaxBounds;

                if(obj.top < minMax.minTop) {
                    obj.setTop(minMax.minTop);
                }
                if(obj.top > minMax.maxTop) {
                    obj.setTop(minMax.maxTop);
                }

                if(obj.left < minMax.minLeft) {
                     obj.setLeft(minMax.minLeft);
                 }

                if(obj.left > minMax.maxLeft) {
                    obj.setLeft(minMax.maxLeft);
                }
            }
        },
        controller: function($scope, $rootScope, $ionicPlatform, $ionicHistory, $location, Actions, Store, Camera, ShareService) {
            console.log('photo page controller');

            var chosenStickers = {};
            var initialized = false;

            initialize();

            function initialize() {

                $scope.debug = window.bol.debug; //see environment.js
                $scope.isDesktop = !navigator.camera;

                setThrottleTimes();
                addListeners();
                initializeModes();
                initialized = true;
            }

            $scope.hasStickers = function() {
                var count = Object.keys(chosenStickers).length;
                return (count > 0);
            };

            /**
             * For performance reasons, we will throttle some event listeners
             * All throttle times should be adjustable here
             */
            function setThrottleTimes() {
                $scope.objectMovesWithinCanvasThrottleTime = 0;
                $scope.backgroundImageScalingThrottleTime = 8;
                $scope.stickerScalingThrottleTime = 0;
                $scope.respectMinimumObjectScaleThrottleTime = 8; //background scaling
            }

            function addListeners() {
                Store.onPhotoUpdated(onPhotoUpdated);
                Store.onShareImageLocationUpdated(onShareImageLocationUpdated);
                Store.onShareImageRemoteLocationUpdated(onRemoteShareImageLocationUpdated);
                $scope.$on('sticker_chosen', onStickerChosen);
                $scope.$on('photo_back_button_clicked', goBack);

                //$rootScope.$ionicGoBack = goBack();
                //$ionicPlatform.registerBackButtonAction(goBack(), 101);
                $ionicPlatform.registerBackButtonAction(handleGoBack, 101);

            }

            function setMode(newMode) {
                $scope.mode = newMode;
                Actions.setPhotoMode(newMode);
            }

            function handleGoBack() {
                //if we're on the photo page, and not on the initial mode, then we have a custom goBack function
                //(we're switching modes)
                if((($location.path() === '/tab/photo') || ($location.path() === 'tab/photo')) && ($scope.mode !== $scope.CHOOSING_PHOTO)) {
                    goBack();
                } else {
                    //in all other cases, we just use the native goBack methods
                    var history = $ionicHistory.viewHistory();
                    if(!history.backView) {
                        try {
                            navigator.app.exitApp();
                        } catch(e) {
                            Rollbar.error(e);
                        }
                    }
                    else {
                        console.log('view history', history);
                        $ionicHistory.goBack();
                    }
                }
            }

            function goBack() {
                if(!initialized) {
                    return; //why are we even in this function now
                }

                if($scope.mode === $scope.CHOOSING_PHOTO) {
                    return; //already on the initial mode
                }


                //we usually go one mode down when we're going back,
                //unless we're on the share photo page (we don't want to go into the choose sticker mode then)
                var downGrade = ($scope.mode === $scope.SHARING_PHOTO) ? 2 : 1;
                var newMode = $scope.mode - downGrade;
                setMode(newMode);

                //handle specific mode changes
                if($scope.mode === $scope.CONFIRMING_PHOTO) {
                    //remove all stickers
                    removeAllStickers();

                    //allow for background image repositioning
                    resetBackgroundImageControls();
                }

                if ($scope.mode === $scope.CHOOSING_PHOTO) {

                    $scope.lastPhoto = null;
                }
                $scope.$apply();
            }

            function resetBackgroundImageControls() {
                var img = $scope.lastCanvasImg;
                img.lockMovementX = false;
                img.lockMovementY = false;
                img.lockScalingX = false;
                img.lockScalingY = false;
                img.selectable = true;

                $scope.canvas.setActiveObject(img);

                img.setCoords();
                var rect = img.getBoundingRect();
                $scope.minMaxBounds = getMinMaxBounds($scope.canvas, rect);
            }

            function initializeModes() {
                $scope.CHOOSING_PHOTO = 0;
                $scope.CONFIRMING_PHOTO = 1;
                $scope.VIEWING_PHOTO = 2;
                $scope.CHOOSING_STICKER = 3;
                $scope.SHARING_PHOTO = 4;

                //set default mode
                setMode($scope.CHOOSING_PHOTO);
            }

            function getMinScale(img, canvas) {
                var scaleUpY = (img.height > canvas.height) ? canvas.height / img.height : 1;
                var scaleUpX = (img.width > canvas.width) ? canvas.width / img.width : 1;

                var scale = (scaleUpX > scaleUpY) ? scaleUpX : scaleUpY;
                return scale;
            }

            function onPhotoUpdated() {
                var photo = Store.getPhoto();

                var canvas = $scope.canvas;
                fabric.Image.fromURL(photo, function(img) {
                    //img.lockRotation = true;
                    $scope.lastCanvasImg = img;

                    var minScale = getMinScale(img, canvas);
                    var halfTheCanvasWidth = (canvas.width / 2);
                    var halfTheCanvasHeight = (canvas.height / 2);

                    $scope.minScale = minScale;


                    img.set({
                        crossOrigin: 'anonymous',
                        scaleY: minScale,
                        scaleX: minScale,

                        minScale: minScale,
                        minWidth: img.width * minScale,
                        minHeight: img.height * minScale,

                        lockRotation: true, //rotating the background is not allowed
                        lockScalingFlip: true, //disable automatically flipping the background when scaling a lot (fabricjs default)
                        lockUniScaling: true, //always scale X together with Y
                        bolType: 'background',

                        originX: 'center',
                        originY: 'center'
                    });

                    /**
                     * Handle scaling on touch devices
                     */
                    /*
                    canvas.on('touch:gesture', function(event) {
                        throttledOnBackgroundImageScaling(canvas, $scope, minScale, halfTheCanvasWidth, halfTheCanvasHeight);
                    });
                    */

                    /**
                     * Handle scaling on desktop devices
                     */
                    img.on('scaling', function(event) {
                        throttledOnBackgroundImageScaling(canvas, $scope, minScale, halfTheCanvasWidth, halfTheCanvasHeight);
                    });

                    canvas.add(img);

                    //add and center the image, and immediately recalculate its coordinates
                    //(or else we get a weird bug where we can't resize when clicking on certain parts of the image)
                    img.center().setCoords();

                    var rect = img.getBoundingRect();
                    $scope.minMaxBounds = getMinMaxBounds(canvas, rect);

                    canvas.setActiveObject(img);

                    $scope.$apply();
                }, {
                    crossOrigin: 'anonymous'
                });

                $scope.canvas.on('selection:cleared', onSelectionCleared);
            }

            /**
             * Depending on the canvas width & height, as well as the image width and height,
             * we will calculate the minimum and maximum image left and top values (custom logic).
             * Values are divided by 2 because the origin of the image is in the center.
             */
            function getMinMaxBounds(canvas, rect) {
                var minTop = 0;
                var maxTop = canvas.height - rect.height;

                var minLeft = 0;
                var maxLeft = canvas.width - rect.width;

                if(rect.height > canvas.height) {
                    maxTop = rect.height / 2;
                    minTop = maxTop - (rect.height - canvas.height);
                }

                if(rect.width > canvas.width) {
                    maxLeft = rect.width / 2;
                    minLeft = maxLeft - (rect.width - canvas.width);
                }

                return {
                    minTop: minTop,
                    maxTop: maxTop,
                    minLeft: minLeft,
                    maxLeft: maxLeft
                };
            }



            /**
             * The background image should be at least as wide as the canvas width
             * The background image should be at least as high as the canvas height
             */
            var throttledOnBackgroundImageScaling = _.throttle(onBackgroundImageScaling, $scope.backgroundImageScalingThrottleTime);
            function onBackgroundImageScaling(canvas, $scope, minScale, halfTheCanvasWidth, halfTheCanvasHeight) {

                //when we've already set lock scaling, we won't do anything here.
                if($scope.lastCanvasImg.lockScalingX && $scope.lastCanvasImg.lockScalingY) {
                    return;
                }

                if(($scope.lastCanvasImg.scaleX < minScale) || ($scope.lastCanvasImg.scaleY < minScale)) {
                    $scope.lastCanvasImg.scaleX = minScale;
                    $scope.lastCanvasImg.scaleY = minScale;
                }

                //console.log('left position was ' + $scope.lastCanvasImg.left + ', correcting to ' + halfTheCanvasWidth);
                $scope.lastCanvasImg.left = halfTheCanvasWidth; //width divided by 2 because the origin is in the center

                //console.log('top position was ' + $scope.lastCanvasImg.top + ', correcting to ' + halfTheCanvasHeight);
                $scope.lastCanvasImg.top = halfTheCanvasHeight; //height divided by 2 because the origin is in the center

                $scope.lastCanvasImg.setCoords();
                $scope.canvas.renderAll();

                var rect = $scope.lastCanvasImg.getBoundingRect();
                $scope.minMaxBounds = getMinMaxBounds(canvas, rect);
            }

            var choosingOrTakingPhoto = false;
            $scope.choosePhoto = function(event) {
                event.preventDefault();
                if(!choosingOrTakingPhoto) {
                    choosingOrTakingPhoto = true;
                    $scope.error = false;
                    var sourceType = getPhotoSourceType('PHOTOLIBRARY');
                    getPhoto(sourceType, onGetPhotoSuccess, onGetPhotoFail);
                }
            };

             $scope.takePhoto = function(event) {
                event.preventDefault();
                if(!choosingOrTakingPhoto) {
                    choosingOrTakingPhoto = true;
                    $scope.error = false;
                    var sourceType = getPhotoSourceType('CAMERA');
                    getPhoto(sourceType, onGetPhotoSuccess, onGetPhotoFail);
                }
            };

            $scope.placeholdPhoto = function(event) {
                event.preventDefault();
                $scope.error = false;
                var placeholdImage = 'http://lorempixel.com/800/600/';
                setPhoto(placeholdImage);
            };

            $scope.useCurrentPhoto = function(event) {
                //this image cannot be manipulated anymore
                event.preventDefault();

                var img = $scope.lastCanvasImg;
                if(img) {
                    img.lockMovementX = true;
                    img.lockMovementY = true;
                    img.lockScalingX = true;
                    img.lockScalingY = true;
                    img.lockRotation = true;
                    img.selectable = false;

                    $scope.canvas.deactivateAll().renderAll();
                    setMode($scope.VIEWING_PHOTO);
                }
            };

            function getPhotoSourceType(type) {
                if(navigator && navigator.camera && navigator.camera.PictureSourceType && typeof(navigator.camera.PictureSourceType[type] !== 'undefined')) {
                    return navigator.camera.PictureSourceType[type];
                }

                //We're probably on a desktop environment
                Rollbar.error('could not find PictureSourceType');
                return null;
            }

            function getPhotoEncodingType() {
                if(navigator && navigator.camera && navigator.camera.EncodingType && typeof(navigator.camera.EncodingType.JPEG !== 'undefined')) {
                    return navigator.camera.EncodingType.JPEG;
                }

                //We're probably on a desktop environment
                Rollbar.error('could not determine JPEG EncodingType');
                return null;
            }

            function getPhoto(sourceType, successCallback, failCallback) {
                var options = getPhotoOptions(sourceType);
                Camera.getPicture(options).then(successCallback, failCallback);
            }

            function getPhotoOptions(sourceType) {
                var options = {
                    quality: 75,
                    targetHeight: $scope.canvas.height * 3, //1000,
                    saveToPhotoAlbum: false,
                    sourceType: sourceType,
                    correctOrientation: true
                };

                var encodingType = getPhotoEncodingType();
                if(typeof(encodingType !== 'undefined')) {
                    options.encodingType = encodingType;
                }

                return options;
            }

            function onGetPhotoSuccess(imageURI) {
                choosingOrTakingPhoto = false;
                setPhoto(imageURI);
            }

            function setPhoto(imageURI) {
                console.log(imageURI);

                // remove all objects and re-render
                $scope.canvas.clear().renderAll();

                setMode($scope.CONFIRMING_PHOTO);

                $scope.lastPhoto = imageURI;
                Actions.setPhoto(imageURI);
            }

            function onGetPhotoFail(err) {
                choosingOrTakingPhoto = false;
                Rollbar.error("Getting photo failed", err);

                $scope.error = err;
                console.error(err);
            }

            // --------- EDIT PHOTO FUNCTIONALITY BELOW -----------

            var replacingStickerImage = false;
            $scope.replaceStickerImage = function(activeSticker, newVersion) {
                if(!replacingStickerImage) {

                    replacingStickerImage = true;

                    activeSticker.sticker.currentVersion = newVersion;
                    var previousStickerCanvasImg = activeSticker.canvasImg;

                    onStickerChosen(null, activeSticker, previousStickerCanvasImg, function() {
                        $scope.canvas.remove(previousStickerCanvasImg);

                        //just to be sure that the remove handler got triggered before we're toggling our boolean
                        //we're using a small setTimeout
                        setTimeout(function() {
                            replacingStickerImage = false;
                            $scope.$apply();
                        }, 48);
                });
                }
            };

            $scope.rotateStickerHorizontally = function(event) {
                event.preventDefault();

                var activeSticker = $scope.activeSticker;

                //first determine the new version of this sticker
                var newVersion = activeSticker.sticker.currentVersion;
                switch(activeSticker.sticker.currentVersion) {
                    case 'leftBottom':
                        newVersion = 'rightBottom';
                        break;
                    case 'leftTop':
                        newVersion = 'rightTop';
                        break;
                    case 'rightBottom':
                        newVersion = 'leftBottom';
                        break;
                    case 'rightTop':
                        newVersion = 'leftTop';
                        break;
                }

                //then replace the old version with the new one
                $scope.replaceStickerImage(activeSticker, newVersion);
            };

            $scope.rotateStickerVertically = function(event) {
                event.preventDefault();

                var activeSticker = $scope.activeSticker;

                //first determine the new version of this sticker
                var newVersion = activeSticker.sticker.currentVersion;
                switch(activeSticker.sticker.currentVersion) {
                    case 'leftBottom':
                        newVersion = 'leftTop';
                        break;
                    case 'leftTop':
                        newVersion = 'leftBottom';
                        break;
                    case 'rightBottom':
                        newVersion = 'rightTop';
                        break;
                    case 'rightTop':
                        newVersion = 'rightBottom';
                        break;
                }

                //then replace the old version with the new one
                $scope.replaceStickerImage(activeSticker, newVersion);
            };

            function onStickerChosen(event, data, previousStickerCanvasImg, callback) {

                var hasPreviousSticker = !!previousStickerCanvasImg;

                setMode($scope.VIEWING_PHOTO);

                var sticker = data.sticker;
                chosenStickers[sticker.timestamp] = sticker;
                var stickerUrl = sticker.versions[sticker.currentVersion];

                //fabric.Image.fromURL(stickerUrl, function(img) {
                fabric.loadSVGFromURL(stickerUrl, function(objects, options) {

                    var img = fabric.util.groupSVGElements(objects, options);


                    var defaultStickerScale = 0.5;
                    if(!previousStickerCanvasImg) {
                        //determine sticker scale based on canvas width, height and sticker width, height
                        var maxSize = ($scope.canvas.width < $scope.canvas.height) ? $scope.canvas.width : $scope.canvas.height;
                        var width = img.width;
                        var height = img.height;

                        var biggest = (width < height) ? height : width;

                        //determine the maximum scale
                        //and then divide by 2
                        //so the sticker is approximately as big as we want it to be

                        var maxScale = (maxSize / biggest);
                        maxScale -= (maxScale / 4);

                        sticker.maxScale = maxScale;
                        defaultStickerScale = maxScale / 1.5;
                        defaultStickerScale = parseInt((defaultStickerScale * 100), 10) / 100;

                        console.log('using a scale of ' + defaultStickerScale + ' for this sticker. MaxScale = ' + maxScale, data);
                    }

                    var options = {
                        borderColor: '#FFFFFF',
                        cornerColor: '#FFFFFF',
                        cornerSize: 12,
                        transparentCorners: false,
                        borderOpacityWhenMoving: 1,
                        bolType: 'sticker',

                        //originX: 'center',
                        //originY: 'center',


                        crossOrigin: 'anonymous',
                        scaleY: hasPreviousSticker ? previousStickerCanvasImg.scaleY : defaultStickerScale,
                        scaleX: hasPreviousSticker ? previousStickerCanvasImg.scaleX : defaultStickerScale,
                        lockRotation: true, //for now, rotating the sticker is not allowed
                        lockScalingFlip: true, //disable automatically flipping the sticker when scaling a lot (fabricjs default)
                        lockUniScaling: true //always scale X together with Y
                    };

                    if(hasPreviousSticker) {
                        options.width = previousStickerCanvasImg.width;
                        options.height = previousStickerCanvasImg.height;
                        options.left = previousStickerCanvasImg.left;
                        options.top = previousStickerCanvasImg.top;
                    }

                    img.set(options);

                    img.on('selected', function() {
                      onStickerSelected(img, sticker);
                    });

                    img.on('removed', function() {
                      onStickerRemoved(img, sticker);
                    });

                    /**
                     * Handle scaling on touch devices
                     */

                    $scope.canvas.on('touch:gesture', function(event) {
                        throttledOnStickerScaling($scope.canvas, img, sticker.maxScale);
                    });


                    /**
                     * Handle scaling on desktop devices
                     */
                    //if($scope.isDesktop) {
                        img.on('scaling', function(event) {
                            throttledOnStickerScaling($scope.canvas, img, sticker.maxScale);
                        });
                    //}

                    $scope.canvas.add(img).setActiveObject(img);

                    if(!hasPreviousSticker) {
                        img.center();
                    }

                    //probably not needed anymore because we set it to active anyway
                    img.setCoords();
                    var rect = img.getBoundingRect();
                    $scope.minMaxBounds = getMinMaxBounds($scope.canvas, rect);

                    if(callback) {
                        callback();
                    }
                });
            }

            var throttledOnStickerScaling = _.throttle(onStickerScaling, $scope.stickerScalingThrottleTime);
            function onStickerScaling(canvas, img, maxScale) {


                if(img.scaleX > maxScale ) {
                    console.log('correcting maxScale !!');
                    img.scaleX = img.lastScale; //not using maxScale, because maxScale is not exactly the same as lastScale
                    img.scaleY = img.lastScale; //not using maxScale, because maxScale is not exactly the same as lastScale
                    //img.left = img.lastValidLeft;
                    //img.top = img.lastValidTop;

                    img.setCoords();
                }

                img.setCoords();
                var rect = img.getBoundingRect();
                $scope.minMaxBounds = getMinMaxBounds(canvas, rect);

                img.lastValidLeft = img.left;
                img.lastValidTop = img.top;
                img.lastScale = img.scaleX;

                //todo also ensure image stays within bounds
            }

            function onSelectionCleared() {

                if($scope.mode === $scope.CHOOSING_PHOTO) {
                    //the background image should stay selected at all times
                    $scope.canvas.setActiveObject($scope.lastCanvasImg);
                } else {
                    $scope.showControls = false;
                    $scope.activeSticker = null;

                    //apply on the next frame (we might be applying already)
                    setTimeout(function() {
                        $scope.$apply();
                    }, 17);
                }
            }

            function onStickerRemoved(img, sticker) {
                if(!replacingStickerImage) {
                    delete chosenStickers[sticker.timestamp];
                }
            }

            function onStickerSelected(img, sticker) {
                //update minMaxBounds so we can determine when the user moves the img out of the viewport (we will block this)
                img.setCoords();
                var rect = img.getBoundingRect();
                $scope.minMaxBounds = getMinMaxBounds($scope.canvas, rect);

                //show the controls!
                $scope.showControls = true;
                $scope.activeSticker = {
                    canvasImg: img,
                    sticker: sticker
                };

                $scope.$apply();
            }

            function removeAllStickers() {
               var objects = $scope.canvas.getObjects();
               for (var i = objects.length - 1; i >= 0; i--) {
                   var o = objects[i];
                   if((o.bolType === 'sticker') || (o.bolType === 'footerText')  || (o.bolType === 'footerBackground')){
                      $scope.canvas.remove(o);
                   }
               }

               chosenStickers = {};
               $scope.canvas.renderAll();
            }

            $scope.chooseSticker = function(event) {
                event.preventDefault();
                setMode($scope.CHOOSING_STICKER);
            };

            $scope.removeSticker = function(event) {
                event.preventDefault();
                var activeSticker = $scope.activeSticker;

                $scope.canvas.remove(activeSticker.canvasImg);
                $scope.activeSticker = null;
            };

            $scope.resetState = function(event) {
                event.preventDefault();

                $scope.lastPhoto = null;
                $scope.canvas.clear().renderAll();
                chosenStickers = {};
                setMode($scope.CHOOSING_PHOTO);
            };


            $scope.shareImageLocations = {
                remote: {
                    completed: false,
                    success: null,
                    path: null,
                },
                local: {
                    completed: false,
                    success: null,
                    path: null
                }
            };

            $scope.resetShareImageLocations = function() {
                $scope.shareImageLocations.remote.completed = false;
                $scope.shareImageLocations.remote.success = null;
                $scope.shareImageLocations.remote.path = null;
                $scope.shareImageLocations.local.completed = false;
                $scope.shareImageLocations.local.success = null;
                $scope.shareImageLocations.local.path = null;
            };

            //make sure users won't be able to tap this button twice

            var theFinish = function(event) {
                event.preventDefault();

                $scope.canvas.deactivateAll().renderAll();
                $scope.addFooter(function() {
                    //take a canvas screenshot
                    var theCanvas = document.getElementById('canvas');
                    var imageData = $scope.getCanvasImageData(2.0);

                    $scope.resetShareImageLocations();

                    //put the canvas screenshot in the store
                    Actions.setShareImage(imageData, theCanvas);
                    $scope.shareImage = imageData;
                    setMode($scope.SHARING_PHOTO);
                });
            };
            $scope.finish = _.throttle(theFinish, 200);

            $scope.addFooter = function(callback) {

                var footerTextUrl = 'img/fabricjs/foto-footer.svg';

                fabric.loadSVGFromURL(footerTextUrl, function(objects, options) {
                //fabric.Image.fromURL(footerTextUrl, function(img) {

                    //var pixelRatio = 1; //window.devicePixelRatio;
                    var img = fabric.util.groupSVGElements(objects, options);
                    var bgHeight = 23;
                    var oldHeight = img.height;
                    var wantedHeight = 17;
                    var padding = ((bgHeight - wantedHeight) / 2);
                    var scale = wantedHeight / oldHeight;
                    var newWidth = img.width * scale;

                    img.set({
                        bolType: 'footerText',
                        left: ($scope.canvas.width / 2) - (newWidth / 2), //$scope.canvas.width - img.width,
                        top: $scope.canvas.height - (wantedHeight) - padding, // - padding
                        scaleX: scale,
                        scaleY: scale,
                        lockScalingX: true,
                        lockScalingY: true,
                        lockRotation: true,
                        lockMovementX: true,
                        lockMovementY: true,
                        selectable: false
                    });

                    //we will also need a black background
                    var bg = new fabric.Rect({
                        bolType: 'footerBackground',
                        width: $scope.canvas.width + 20,
                        height: bgHeight,
                        left: -10,
                        top: $scope.canvas.height - bgHeight,
                        fill: '#EC2E2A',
                        lockScalingX: true,
                        lockScalingY: true,
                        lockRotation: true,
                        lockMovementX: true,
                        lockMovementY: true,
                        selectable: false

                    });

                    //add the background first, then the image
                    $scope.canvas.add(bg);
                    $scope.canvas.add(img);

                    //render & callback
                    $scope.canvas.renderAll();

                    //callback
                    if(callback && (typeof(callback) === 'function')) {
                        callback();
                    }
                });
            };

            $scope.getCanvasImageData = function(qualityMultiplier) {

                var options = {
                    format: 'jpeg',//'image/png',
                    quality: 1.0,
                    multiplier: qualityMultiplier
                };

                var imageData = $scope.canvas.toDataURL(options);
                return imageData;
            };

            function onShareImageLocationUpdated(event) {
                var location = Store.getShareImageLocation();
                $scope.shareImageLocations.local.path = location;
                $scope.shareImageLocations.local.success = !!location;
                $scope.shareImageLocations.local.completed = true;

                $scope.shareImagePersistedComplete();
            }

            function onRemoteShareImageLocationUpdated(event) {
                var location = Store.getShareImageRemoteLocation();
                $scope.shareImageLocations.remote.path = location;
                $scope.shareImageLocations.remote.success = !!location;
                $scope.shareImageLocations.remote.completed = true;

                $scope.shareImagePersistedComplete();
            }

            $scope.shareImagePersistedComplete = function() {
                if($scope.shareImageLocations.remote.completed && $scope.shareImageLocations.local.completed) {
                    $scope.shareImagePersisted = true;
                    $scope.$apply();
                }
            };

            $scope.getShareImageUrl = function() {
                //return $scope.shareImageLocations.local.path;
                var base = Store.getBaseUrl();
                var url = base + $scope.shareImageLocations.remote.path;
                console.log(url);
                return url;
            };

            $scope.doShareImage = function(event) {
                event.preventDefault();

                ShareService.shareImage($scope.shareImage, function(result) {
                    //success
                    analytics.trackEvent('Photo', 'Share complete');
                }, function(err) {
                    //error
                });
            };

        },
        templateUrl: 'js/pages/page-photo/page-photo.html'
    };
});
