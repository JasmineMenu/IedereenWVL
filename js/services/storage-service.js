'use strict';
angular.module('app.services')

.factory('StorageService', function() {
  return {
      set: function(key, value) {
          if (window.localStorage && window.localStorage.setItem) {
              window.localStorage.setItem(key, JSON.stringify(value));
          }
      },

      clear: function() {
          if (window.localStorage && window.localStorage.clear) {
              window.localStorage.clear();
          }
      },

      get: function(key, defaultValue) {

          defaultValue = typeof defaultValue === 'undefined' ? null : defaultValue;
          var value;
          try {
              if (window.localStorage && window.localStorage.getItem) {
                  value = window.localStorage.getItem(key);
                  if (value) {
                      return JSON.parse(value);
                  }
              }
              return defaultValue;
          } catch(e) {
            return value ? value : defaultValue;
          }
      }
  };
});
