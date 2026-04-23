// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
'use strict';
angular.module('app')

.run(function($ionicPlatform, $rootScope, $state, $window, AudioService) {

  addListeners();

  function addListeners() {
      $ionicPlatform.ready(onPlatformReady);
      document.addEventListener('online', onOnline, false);
      document.addEventListener('offline', onOffline, false);

      $rootScope.$on('$stateChangeStart', onStateChangeStart);
  }

  function onStateChangeStart(event, toState, toParams, fromState, fromParams) {
      $rootScope.$broadcast('state_change', {
        toState: toState,
        toParams: toParams,
        fromState: fromState,
        fromParams: fromParams
      });
  }

  function onOnline() {
      console.info('Houston, we have an internet connection');
  }

  function onOffline() {
      console.info('...And we\'re offline');
  }


  function onPlatformReady() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if(window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      }

      // iOS lockOrientation
      if(screen && screen.lockOrientation) {
          screen.lockOrientation('portrait');
      }

      // Hide StatusBar
//      ionic.Platform.fullScreen();
//      if (window.StatusBar) {
//        StatusBar.hide();
//      }

      // GA
      if(typeof analytics !== 'undefined') {
          analytics.startTrackerWithId("UA-57790847-3");
      } else {
          console.log("Google Analytics Unavailable");
      }

      pauzeBlankMediaItem();

      //addVolumeSlider();
  }

  function pauzeBlankMediaItem() {
    if ($window.cordova) {
      AudioService.playDummyAudio();
    }
  }

  function getSoundFilePath(filename) {
      var src = '/mp3/'+ filename;
      if (ionic.Platform.is('android')) {
          src = '/android_asset/www' + src;
      }
      return src;
  }


  function addVolumeSlider() {
    try {

        var width = window.screen.width;
        var height = window.screen.height;


        var volumeSlider = window.plugins.volumeSlider;
        volumeSlider.createVolumeSlider(0, height-30 ,width ,30); // origin x, origin y, width, height
        volumeSlider.showVolumeSlider();

        console.log('trying to set volume slider volume');
        volumeSlider.setVolumeSlider(1); //set your volume slider value to between 0 and 1
        console.log('done!');
     } catch(e) {
        console.log('failed');
        console.log(e);
     }
  }
}).config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/index');

    $stateProvider
        .state('app', {
           url: '',
           abstract: true,
           templateUrl: '',
           controller: 'AppController',
           resolve: {
             load: function(DataService) {
               return DataService.load();
             }
           }
        })
        .state('index', {
            url: '/index',
            template: '<page-index></page-index>'
        })
        .state('app.tab', {
            url: '/tab',
            abstract: true,
            templateUrl: 'templates/layouts/tab.html'
        })
        .state('app.tab.themes', {
          url: '/themes',
          views: {
            'tab-themes': {
              templateUrl: 'js/pages/page-themes/page-themes-wrapper.html',
            }
          }
        })
        .state('app.tab.themes.theme', {
          url: '/:theme',
          views: {
            'tab-themes@app.tab': {
              //template: '<page-sounds></page-sounds>'
              templateUrl: 'js/pages/page-sounds/page-sounds-wrapper.html',
              controller: 'PageSoundsController'
            }
          }
        })
        .state('app.tab.best-of', {
          url: '/best-of',
          //cache: false,
          views: {
            'tab-best-of': {
              //template: '<page-best-of></page-best-of>'
              templateUrl: 'js/pages/page-best-of/page-best-of-wrapper.html',
              controller: 'PageBestOfController'
            }
          }
        })
        .state('app.tab.quiz', {
          url: '/quiz',
          views: {
            'tab-quiz': {
              //template: '<page-quiz></page-quiz>'
              templateUrl: 'js/pages/page-quiz/page-quiz-wrapper.html'
            }
          }
        })
        .state('app.tab.quiz.question', {
          url: '/question',
          views: {
            'tab-quiz@app.tab': {
              //template: '<page-question></page-question>'
              templateUrl: 'js/pages/page-question/page-question-wrapper.html'
            }
          }
        })
        .state('app.tab.photo', {
          url: '/photo',
          views: {
            'tab-photo': {
              //template: '<page-photo></page-photo>'
              templateUrl: 'js/pages/page-photo/page-photo-wrapper.html',
              controller: 'PagePhotoController'
            }
          }
        })
        .state('app.tab.info', {
          url: '/info',
          views: {
            'tab-info': {
              //template: '<page-info></page-info>',
              templateUrl: 'js/pages/page-info/page-info-wrapper.html'
            }
          }
        });
});
