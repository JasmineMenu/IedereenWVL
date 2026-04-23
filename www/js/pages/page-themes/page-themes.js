'use strict';

angular.module('app.components')

.directive('pageThemes', function() {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        controller: function($scope, Store) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Themes');
            }
            $scope.themes = Store.getThemes();

            Store.onThemesUpdated(function() {
                $scope.themes = Store.getThemes();
                $scope.$apply();
            }, $scope);
        },
        templateUrl: 'js/pages/page-themes/page-themes.html'
    };
});
