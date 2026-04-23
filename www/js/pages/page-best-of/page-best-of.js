'use strict';

angular.module('app.components')

.directive('pageBestOf', function() {
    return {
        restrict: 'E',
        scope: {
            favorites: '='
        },
        controller: function($scope, $rootScope, $timeout, $window, $ionicPlatform, Store, Actions, AudioService) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Best of');
            };

            $scope.favorites = Store.getFavoriteSounds();
            setFavorites();

            $ionicPlatform.on("resume", function() {
                correctTileSizes();
            });

            /*
            $rootScope.$on('$ionicView.afterEnter', function() {
                console.log('after enter',  $('.tiles-listing').width());
                correctTileSizes();
            });
*/

            $scope.editMode = false;
            $scope.$on('toggleEditMode', function(event, editMode) {
                $scope.editMode = editMode;
            });

            Store.onSoundsUpdated(function() {
                setFavorites();
                correctTileSizes();
                $scope.$apply();
            });

            function setFavorites() {
                $scope.favorites = Store.getFavoriteSounds();
                correctTileSizes();
            }

            function getTileSize() {
                var availableWidth = $('.tiles-listing').width();
                var size = availableWidth/3;
                return size;
            }

            var tilesize = null;
            function correctTileSizes(size) {
                $timeout(function(){
                    if(!tilesize) {
                        tilesize = getTileSize();
                    }

                    $('.tiles-listing .tile-item').width(tilesize).height(tilesize);
                }, 0);
            }


            var doPlaySound = function(sound) {
                if($scope.editMode === true) {
                    return false;
                }

                var filename = sound.fileName;
                AudioService.play(filename, function() {
                    if(typeof analytics !== 'undefined') {
                        analytics.trackEvent('Sounds', 'Play sound from best of', 'Filename', filename);
                    }
                }, function() {
                    console.error('Failed to play favorite sound');
                });
            };
            $scope.playSound = _.throttle(doPlaySound, 256);

            $scope.removeFavorite = function(event, sound) {
                event.preventDefault();
                Actions.toggleFavorite(sound);

                if(typeof analytics !== 'undefined') {
                    analytics.trackEvent('Sounds', 'Remove from favorites', 'Filename', sound.fileName);
                }

                //it takes the store a while to update, so we will already remove the item with some jquery magic
                jQuery(event.currentTarget).closest('.tile-item').remove();//setFavorites();
            };
        },
        templateUrl: 'js/pages/page-best-of/page-best-of.html'
    };


});
