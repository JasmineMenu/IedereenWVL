'use strict';
angular.module('app.controllers')

.controller('AppController', ['$scope', '$state', 'Store',
    function ($scope, $state, Store) {

        /*handlePhotoPageBackButton();

        function handlePhotoPageBackButton() {
            $scope.showPhotoBackButton = canShowPhotoBackButton($state.current);
            $scope.$on('state_change', onStateChanged);
            $scope.$on('photo_back_button_click', onPhotoBackButtonClicked);
            Store.onPhotoModeUpdated(onPhotoModeUpdated);
        }

        function onPhotoBackButtonClicked() {
            $scope.$broadcast('photo_back_button_clicked');
            $scope.$apply();
        }

        function onPhotoModeUpdated() {
            var state = $state.current;
            $scope.showPhotoBackButton = canShowPhotoBackButton(state);
            $scope.$apply();
        }

        function onStateChanged(event, data) {
            var toState = data.toState;
            $scope.showPhotoBackButton = canShowPhotoBackButton(toState);
            $scope.$apply();
        }

        function canShowPhotoBackButton(state) {

          //we can show it if the state is app.tab.photo, and the mode is not the first mode (choosing_photo)
          if(state.name === 'app.tab.photo') {
              var photoMode = Store.getPhotoMode();
              var notInFirstMode = (photoMode > 0);
              return notInFirstMode;
          }

          return false;
        }*/
    }
]);
