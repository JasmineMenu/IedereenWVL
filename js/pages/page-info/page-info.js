'use strict';

angular.module('app.components')

.directive('pageInfo', function() {
    return {
        restrict: 'E',
        scope: {},
        controller: function($scope, Store) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Info');
            }

            $scope.version = window.bol.version;
        },
        templateUrl: 'js/pages/page-info/page-info.html'
    };
});
