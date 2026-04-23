angular.module('app.config')
.constant('CONFIG', {
    defaultLang: 'nl',
    languages: [{
        id: 'nl',
        text: 'Nederlands'
    }, {
        id: 'en',
        text: 'English'
    }],
    defaultType: 'll',
    types: [{
        id: 'll'
    }, {
        id: 'lk'
    }],
    skipIntro: false,
    tabletMinWidth: 760
});
