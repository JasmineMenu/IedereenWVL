'use strict';
angular.module('app.services')

.factory('DataService', ['$q', '$http', 'Actions', 'Store', 'StorageService',
    function($q, $http, Actions, Store, StorageService) {

        var load = function() {

            setVersionAndUpgrade();

            var defers = [];
            defers = [
                getThemesDefer(),
                getStickersDefer(),
                getSoundsDefer(),
                getQuizDefer(),
                getExpressionThemeDefer()
            ];
            return $q.all(defers);
        };

        var setVersionAndUpgrade = function() {
            var currentVersion = '' + window.bol.version; //set in environment.js
            try {
                var oldVersion = '' + StorageService.get('version');

                //todo apply upgrades sequentially
                if(currentVersion !== oldVersion) {
                    console.log('upgrading');
                    debugger;

                    //for now, we just remove all data in the localStorage when the version is different (dev mode)
                    localStorage.clear();
                }
            } catch(e) {
               debugger;
               Rollbar.error(e);
            }

            StorageService.set('version', currentVersion);
        };


        var getStickersDefer = function() {
            var stickersDefer = $q.defer();
            $http.get('js/data/json/Stickers.json').then(function(response) {
                var results = response.data;
                Actions.setStickers(results);
                stickersDefer.resolve();
            });
            return stickersDefer.promise;
        };

        var getThemesDefer = function() {
            var themesDefer = $q.defer();
            $http.get('js/data/json/Category.json').then(function(response) {
                var results = Lazy(response.data.results).where({categoryType: 'word'}).toArray();

                Actions.setThemes(results);
                themesDefer.resolve();
            });
            return themesDefer.promise;
        };

        var getExpressionThemeDefer = function() {
            var expressionThemeDefer = $q.defer();
            $http.get('js/data/json/Category.json').then(function(response) {
                var results = Lazy(response.data.results).where({categoryType: 'expression'}).toArray();
                Actions.setExpressionThemes(results);
                expressionThemeDefer.resolve();
            });
            return expressionThemeDefer.promise;
        };

        var getQuizDefer = function() {
            var quizDefer = $q.defer();
            $http.get('js/data/json/Quiz.json').then(function(response) {
                var results = response.data.results;
                Actions.setQuiz(results);
                quizDefer.resolve();
            });
            return quizDefer.promise;
        };

        var getSoundsDefer = function() {
            var defer = $q.defer();

            //1. try getting sounds from localStorage
            var sounds = StorageService.get('sounds');
            if(!sounds) {
                //2. If we didn't find any sounds in the localStorage, we will populate it (with sounds and default favorites)
                getSoundsWithDefaultFavorites(function(sounds){
                    //3. update the store
                    Actions.setSounds(sounds);
                    defer.resolve();
                });
            } else {
                //2. update the store
                Actions.setSounds(sounds);
                defer.resolve();
            }
        };

        var getSoundsWithDefaultFavorites = function(callback) {
            var soundsAndFavorites = $q.defer();
            $http.get('js/data/json/Sound.json').then(function(response) {
                var results = response.data.results;
                addDefaultFavorites(results);

                callback(results);
            });
            return soundsAndFavorites.promise;
        };

        var addDefaultFavorites = function(sounds) {
            var favoritesAdded = 0;
            var favoriteFilenames = Store.getDefaultFavoritesFilenames(sounds);
            for (var i = sounds.length - 1; i >= 0; i--) {
                var sound = sounds[i];

                if(favoriteFilenames[sound.fileName]) {
                    sound.isFavorite = true;
                    sound.favoriteIndex = favoritesAdded;
                    sound.color = getNextFavoriteColorIndex(favoritesAdded);
                    favoritesAdded++;
                } else {
                    sound.isFavorite = false;
                    sound.color = null;
                    sound.favoriteIndex = null;
                }
            }
        };

        var getNextFavoriteColorIndex = function(index) {
            var mod = index % 4;
            var number = mod + 1;

            return number;
        };

        return {
            load: load
        };
    }
]);
