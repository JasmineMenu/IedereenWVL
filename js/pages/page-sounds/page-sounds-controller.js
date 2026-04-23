'use strict';
angular.module('app.controllers')

.controller('PageSoundsController', ['$scope', 'Store', '$stateParams', '$rootScope', '$ionicHistory',
    function ($scope, Store, $stateParams, $rootScope, $ionicHistory) {
      $scope.favorites = Store.getFavoriteSounds();
      $scope.category = Store.getCategoryByIndex($stateParams.theme);
    }
]);
