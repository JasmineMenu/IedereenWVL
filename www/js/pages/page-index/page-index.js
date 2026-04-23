'use strict';

angular.module('app.components')

.directive('pageIndex', function() {
    return {
        restrict: 'E',
        scope: {},
        controller: function($scope, $ionicPlatform, Store) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Index');
            }

            calculateTileHeight();

            $ionicPlatform.on("resume", function() {
                calculateTileHeight();

                //just to be sure
                setTimeout(function() {
                    $scope.$apply();
                }, 17);

            });

            function calculateTileHeight() {
                var availableWidth = $('.tiles-listing').width();
                var size = availableWidth/2;

                $('.tiles-listing .tile-item').width(size).height(size);
            }


        },
        templateUrl: 'js/pages/page-index/page-index.html'
    };
});
