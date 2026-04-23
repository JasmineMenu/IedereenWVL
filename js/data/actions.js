'use strict';

angular.module('app.services')

.factory('Actions', function(Store, StorageService, $cordovaFile, $rootScope) {

    var hardEquals = function(a, b) {
        if (JSON && JSON.stringify) {
            return JSON.stringify(a) === JSON.stringify(b);
        } else {
            return a == b;
        }
    };

    var setShareImage = function(imageData, theCanvas) {

        uploadShareImage(imageData);
        writeImageToDevice(theCanvas);
        Store.shareImage.set(imageData);

        return this;
    };

    var writeImageToDevice = function(theCanvas) {
        try {
            window.canvas2ImagePlugin.saveImageDataToLibrary(onWriteImageToDeviceSuccess,onWriteImageToDeviceFail,theCanvas);
        } catch(e) {
            onWriteImageToDeviceFail(e);
        }
    };

    var onWriteImageToDeviceSuccess = function(filepath) {
        //alright!
        Store.shareImageLocation.set(filepath);
    };

    var onWriteImageToDeviceFail = function(err) {
        Rollbar.error(err);
        Store.shareImageLocation.set(false);
    };

    var uploadShareImage = function(imageData) {

        Store.shareImageRemoteLocation.set(false);

        // var base = Store.getBaseUrl();
        // var endpoint = base + 'upload.php'; //?debug=1
        //
        // jQuery.post(endpoint, {
        //     image: imageData
        // }, function(data, textStatus, jqXHR) {
        //     //var url = base + data;
        //     //yay, we can put the response in the store.
        //     Store.shareImageRemoteLocation.set(data);
        // }).fail(function(e) {
        //     Rollbar.error(e);
        //     Store.shareImageRemoteLocation.set(false);
        // });
    };

    var setPhoto = function(photo) {
        Store.photo.set(photo);
        return this;
    };

    var setPhotoMode = function(photoMode) {
        Store.photoMode.set(photoMode);
        return this;
    };

    var setStickers = function(stickers) {
        Store.stickers.set(stickers);
        return this;
    };

    var setThemes = function(themes) {
        Store.themes.set(themes);
        return this;
    };

    var setExpressionThemes = function(themes) {
        Store.expressionThemes.set(themes);
        return this;
    };

    var setSounds = function(sounds) {
        Store.sounds.set(sounds);

        //also update the localStorage
        StorageService.set('sounds', sounds);

        return this;
    };

    var setQuiz = function(quiz) {
        Store.quiz.set(quiz);
        return this;
    };

    var toggleFavorite = function(sound) {
        var sounds = Store.sounds.get();
        var index = sounds.indexOf(sound);
        if(index < 0) {
            Rollbar.error('Could not toggle favorite sound: ' + JSON.stringify(sound));
            debugger;
            return; //unknown sound
        }

        if(sound.isFavorite) {
            //toggle from favorite to non-favorite
            sound.isFavorite = false;
            sound.favoriteIndex = null;
            sound.color = null;
        } else {
            //toggle from non-favorite to favorite
            var lastFavoriteSound = getLastFavoriteSound(sounds);
            sound.isFavorite = true;
            sound.favoriteIndex = lastFavoriteSound.favoriteIndex + 1;
            sound.color = (lastFavoriteSound.color === 4) ? 1 : lastFavoriteSound.color + 1;
        }

        sounds[index] = sound;
        this.setSounds(sounds);

        return this;
    };

    var getLastFavoriteSound = function(sounds) {
        var sound = _.max(sounds, function(sound) {
            return sound.favoriteIndex;
        });
        return sound;
    };


    return {
        hardEquals: hardEquals,
        setPhoto: setPhoto,
        setPhotoMode: setPhotoMode,
        setShareImage: setShareImage,
        setThemes: setThemes,
        setExpressionThemes: setExpressionThemes,
        setSounds: setSounds,
        setStickers: setStickers,
        setQuiz: setQuiz,
        toggleFavorite: toggleFavorite
    };
});
