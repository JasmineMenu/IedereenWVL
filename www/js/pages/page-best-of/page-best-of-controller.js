angular.module('app.controllers')

.controller('PageBestOfController', ['$scope', 'Store', '$stateParams', '$timeout', '$rootScope', '$ionicHistory',
    function ($scope, Store, $stateParams, $timeout, $rootScope, $ionicHistory) {
        $scope.showEdit = true;
        $scope.showReady = false;

        $scope.toggleEditMode = function(first) {
            if(first === 'edit') {
                $scope.$broadcast('toggleEditMode', $scope.showEdit);
                $scope.showEdit = !$scope.showEdit;

                $timeout(function(){
                    $scope.showReady = !$scope.showReady;
                }, 100);

            } else {
                $scope.$broadcast('toggleEditMode', $scope.showEdit);
                $scope.showReady = !$scope.showReady;

                $timeout(function(){
                    $scope.showEdit = !$scope.showEdit;
                }, 100);
            }
        };
    }
]);
