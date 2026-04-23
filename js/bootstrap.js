angular.module('app.services', []);
angular.module('app.controllers', []);
angular.module('app.directives', []);
angular.module('app.components', []);
/*angular.module('starter.filters', []);*/

angular.module('app.config', []);

angular.module('app', [
    'ionic',
    'ngCordova',
    'ui.router',
    'app.services',
    'app.controllers',
    'app.directives',
    'app.components',
    'app.config',
    'ngIOS9UIWebViewPatch'
]);
