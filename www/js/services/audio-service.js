'use strict';
angular.module('app.services')

.factory('AudioService', ['$q', '$window', function($q, $window) {

  return {

    getSoundFilePath: function(filename) {
        var src = '/mp3/'+ filename;
        if (ionic.Platform.is('android')) {
            src = '/android_asset/www' + src;
        }
        return src;
    },

    stopAndReleaseMedia: function() {
      try {
        if(window.bol.media) {
            window.bol.media.stop();
            window.bol.media.release();
        }
      } catch(e) {
        console.error(e);
        Rollbar.error(e);
      }
    },

    playDummyAudio: function(filename) {

        //this should really only happen on iOS
        var isIOS = ionic.Platform.isIOS();

        if(isIOS) {
            this.playCordovaSound('___blank.mp3');

            setTimeout(function() {
              window.bol.media.pause();
            }, 0);
        }
    },

    playCordovaSound: function(filename, successCallback, failCallback, statusCallback, playDummyAfterwards) {
        var that = this;

        window.bol.justStartedNewMedia = true;

        console.log('about to play cordova sound ' + filename);

        //when media is already playing, stop it, and release its resources
        this.stopAndReleaseMedia();

        var src = that.getSoundFilePath(filename);

        window.bol.media = new Media(src, function() {
            //console.log('played cordova sound ' + src );
            if(playDummyAfterwards && !window.bol.justStartedNewMedia) {
                that.playDummyAudio();
            }
            window.bol.justStartedNewMedia = false;

            if(typeof(successCallback) === 'function') {
                successCallback();
            }
        }, function(err) {
            //console.log('failed to play cordova sound ' + src );
            if(playDummyAfterwards && !window.bol.justStartedNewMedia) {
                that.playDummyAudio();
            }
            window.bol.justStartedNewMedia = false;

            if(typeof(failCallback) === 'function') {
                failCallback(err);
            }
        }, function() {
          //console.log('cordova sound status update ' + src, arguments );
          if(typeof(statusCallback) === 'function') {
                statusCallback(arguments);
            }
        });

        window.bol.media.setVolume(1.0);
        window.bol.media.play(window.bol.media);
    },

    playBrowserSound: function(filename, successCallback, failCallback, statusCallback) {
      try {
          //stop previous sound
          if(window.bol.media) {
              window.bol.media.pause();
          }

          window.bol.media = new Audio();
          window.bol.media.src = '/mp3/'+ filename;
          window.bol.media.load();
          window.bol.media.play();

          successCallback();
      } catch(e) {
        console.error(e);
        Rollbar.error(e);

        failCallback();
      }
    },

    play: function(filename, successCallback, failCallback, statusCallback) {
        try {
            console.log('about to play sound ' + filename);
            if ($window.cordova) {
                return this.playCordovaSound(filename, successCallback, failCallback, statusCallback, true);
            } else {
                return this.playBrowserSound(filename, successCallback, failCallback, statusCallback);
            }
        } catch(e) {
            console.error(e);
            Rollbar.error(e);
        }
    }
  };
}]);
