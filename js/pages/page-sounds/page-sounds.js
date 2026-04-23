'use strict';

angular.module('app.components')

.directive('pageSounds', function(Actions) {
    return {
        restrict: 'E',
        scope: {
            favorites: '='
        },
        replace: true,
        controller: function($scope, $stateParams, $window, $timeout, Store, AudioService) {

            console.time('PAGE_SOUNDS');

            $scope.media = null;

            $scope.category = Store.getCategoryByIndex($stateParams.theme);

            if(typeof analytics !== 'undefined') {
                analytics.trackView('Sounds ' + $scope.category.categoryTitle);
            }
            $scope.sounds = Store.getSoundsByTheme($scope.category.objectId);

            $scope.toggleFavoriteActive = false;

            Store.onSoundsUpdated(function() {
                $scope.favorites = Store.getFavoriteSounds();
                $scope.toggleFavoriteActive = false;
            });


            console.timeEnd('PAGE_SOUNDS');


            var doPlaySound = function(sound) {
                if($scope.editMode === true) {
                    return false;
                }

                var filename = sound.fileName;
                AudioService.play(filename, function() {
                    if(typeof analytics !== 'undefined') {
                        analytics.trackEvent('Sounds', 'Play sound from themes', 'Filename', sound.fileName);
                    }
                }, function() {
                    console.error('Failed to play favorite sound');
                });
            };
            $scope.playSound = _.throttle(doPlaySound, 256);


            $scope.toggleFavorite = function(sound) {
                $scope.toggleFavoriteActive = true;
                Actions.toggleFavorite(sound);

                var action = '';
                if (sound.isFavorite) {
                    action = 'Add to favorites';
                } else{
                    action = 'Remove from favorites';
                }

                if(typeof analytics !== 'undefined') {
                    analytics.trackEvent('Sounds', action, 'Filename', sound);
                }
            };
        },
        templateUrl: 'js/pages/page-sounds/page-sounds.html'
    };
});
