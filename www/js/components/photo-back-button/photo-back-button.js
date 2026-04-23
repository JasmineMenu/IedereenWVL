'use strict';

angular.module('app.components')

.directive('photoBackButton', function() {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        controller: function($scope, $ionicHistory) {
            $scope.goBack = function() {
                $scope.$emit('photo_back_button_click');
            };
        },
        templateUrl: 'js/components/photo-back-button/photo-back-button.html'
    };
});
