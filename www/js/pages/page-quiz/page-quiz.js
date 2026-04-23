'use strict';

angular.module('app.components')

.directive('pageQuiz', function() {
    return {
        restrict: 'E',
        scope: {},
        controller: function($scope, Store) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Quiz');
            }
        },
        templateUrl: 'js/pages/page-quiz/page-quiz.html'
    };
});
