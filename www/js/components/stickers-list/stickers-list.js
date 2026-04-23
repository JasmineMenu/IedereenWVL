'use strict';

angular.module('app.components')

.directive('stickersList',function() {
    return {
        restrict : 'E',
        scope: {

        },
        controller: function($scope, Store, Actions) {


            $scope.stickers = getPreparedStickers();

            $scope.onClicked = function(event, originalStickerData) {
              event.preventDefault();

              var sticker = JSON.parse(JSON.stringify(originalStickerData));
              sticker.timestamp = new Date().getTime();

              $scope.$emit('sticker_chosen', {
                sticker: sticker
              });
            };


            function getPreparedStickers() {


              var folder = 'img/stickers/outline';

              var stickers = Store.getStickers();
              var prepared = [];
              for(var i = 0; i < stickers.length; i++) {
                  var sticker = stickers[i];


                  var prep = {
                    name: sticker,
                    currentVersion: 'leftBottom',
                    versions: {
                      leftBottom: folder + '/sticker_' + sticker + '_left_bottom.svg',
                      leftTop: folder + '/sticker_' + sticker + '_left_top.svg',
                      rightBottom: folder + '/sticker_' + sticker + '_right_bottom.svg',
                      rightTop: folder + '/sticker_' + sticker + '_right_top.svg'
                    }
                  };

                  prepared.push(prep);
              }
              return prepared;
            }
        },
        templateUrl: 'js/components/stickers-list/stickers-list.html'
    };
});
