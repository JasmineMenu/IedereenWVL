'use strict';
angular.module('app.services')

.factory('ShareService', ['$cordovaSocialSharing', function($cordovaSocialSharing) {
  return {
      shareImage: function(image, succesCallback, failCallback) {
          if(bol.sharing) {
              console.warn('already sharing something, aborting');
              return;
          }


          try {
            bol.sharing = true;

            var message = '#iedereenwestvlaams http://www.iedereenwestvlaams.be'; //komt niet in fb terecht, maar bvb wel in een email, twitter, whatsapp
            var subject = 'Iedereen West-Vlaams'; //email subject
            var link = null;//"http://www.iedereenwestvlaams.be"; //Indien we dit meegeven, dan zullen bij de facebook share de og:tags uitgelezen worden van deze pagina, en zal deze afbeelding primeren op de image die we meesturen. Geen goed idee dus

            //if is iOS, then we omit the message,
            //if we don't omit this, then the image won't be shown :(
            var isIOS = ionic.Platform.isIOS();
            if(isIOS) {
                message = null;
            }

            $cordovaSocialSharing.share(message, subject, image, link).then(function(result) {
                bol.sharing = false;
                if(typeof(succesCallback) === 'function') {
                  succesCallback(result);
                }

            }, function(err) {
                bol.sharing = false;
                console.error(err);
                Rollbar.error(err);

                if(typeof(failCallback) === 'function') {
                  failCallback(err);
                }
            });
          } catch(e) {
            console.error(e);
            Rollbar.error(e);
          }
      }
  };
}]);
