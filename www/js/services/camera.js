'use strict';
angular.module('app.services')

.factory('Camera', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();

      if(!navigator || !navigator.camera || !navigator.camera.getPicture) {
        var err = 'Het is niet mogelijk om een foto te trekken met uw toestel.';
        q.reject(err);
      } else {
        navigator.camera.getPicture(function(result) {
          // Do any magic you need
          q.resolve(result);
        }, function(err) {
          debugger;
          q.reject(err);
        }, options);
      }

      return q.promise;
    }
  };
}]);
