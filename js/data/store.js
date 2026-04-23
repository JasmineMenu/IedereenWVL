'use strict';

angular.module('app.services')

.factory('Store', function(StorageService) {

    var STORE = new Baobab({
        //favorites: null, //set in DataService
        themes: [],
        sounds: [],
        quiz: [],
        photo: null,
        shareImage: null,
        shareImageLocation: null,
        shareImageRemoteLocation: null,
        photoMode: 0
    }, {
        clone: true
    });

    return {
        //favorites: STORE.select('favorites'),
        stickers: STORE.select('stickers'),
        photo: STORE.select('photo'),
        photoMode: STORE.select('photoMode'),
        shareImage: STORE.select('shareImage'), //share image in base64
        shareImageLocation: STORE.select('shareImageLocation'), //share image path (local)
        shareImageRemoteLocation: STORE.select('shareImageRemoteLocation'), //share image path (remote)
        themes: STORE.select('themes'),
        sounds: STORE.select('sounds'),
        quiz: STORE.select('quiz'),
        expressionThemes: STORE.select('expressionThemes'),

        commit: function() {
            STORE.commit();
            return this;
        },

        /**
         * Base64 representation of the share image
         */
        getShareImage: function() {
            return this.shareImage.get();
        },

        /**
         * Location (path) of the share image (local)
         */
        getShareImageLocation: function() {
            return this.shareImageLocation.get();
        },

        /**
         * Location (path) of the share image (remote)
         */
        getShareImageRemoteLocation: function() {
            return this.shareImageRemoteLocation.get();
        },

        getPhotoMode: function() {
            return this.photoMode.get();
        },



       getFavoriteSounds: function() {
            var sounds = this.sounds.get();
            var favoriteSounds = _.filter(sounds, function(sound) {
                return sound.isFavorite;
            });
            //var unique = _.uniq(favoriteSounds);

            var sorted = _.sortBy(favoriteSounds, function(sound) {
                return sound.favoriteIndex;
            });
            return sorted;
       },

        getThemes: function() {
            return this.themes.get();
        },

        getCategoryByIndex: function(index) {
            return this.themes.get(index);
        },

        getSoundsByTheme: function(theme) {

            //todo this should be an associative array set via DataService, so we don't have to filter on the fly
            var sounds = Lazy(this.sounds.get()).filter(function(a) {
                return a.category.objectId === theme;
            }).toArray();

            return sounds;
        },

        getSoundByObjectId: function(id) {

            //todo this should be an associative array set via DataService, so we don't have to filter on the fly
            var sound =  Lazy(this.sounds.get()).where({objectId: id}).toArray();
            return Lazy(sound).get(0);
        },

        getSoundByFileName: function(fileName) {

            //todo this should be an associative array set via DataService, so we don't have to filter on the fly
            var sound =  Lazy(this.sounds.get()).where({fileName: fileName}).toArray();
            return Lazy(sound).get(0);
        },

        getPhoto: function() {
            return this.photo.get();
        },

        getStickers: function() {
            return this.stickers.get();
        },

        getQuiz: function() {
            var max = 8;
            var min = 1;

            var id = Math.floor(Math.random() * (max - min + 1)) + min;

            var questions = Lazy(this.quiz.get()).where({quizId: id}).toArray();
            Lazy(questions).each(function(question) {
                question.answers = [];
                question.answers.push({"answer": question.answer1, "correct": true});
                question.answers.push({"answer": question.answer2, "correct": false});
                question.answers.push({"answer": question.answer3, "correct": false});

                question.answers = Lazy(question.answers).shuffle().toArray();
            });

            return questions;
        },

        buildQuiz: function() {
            var questions = Lazy(this.quiz.get()).shuffle().first(10).toArray();
            Lazy(questions).each(function(question) {
                question.answers = [];
                question.answers.push({"answer": question.answer1, "correct": true});
                question.answers.push({"answer": question.answer2, "correct": false});
                question.answers.push({"answer": question.answer3, "correct": false});

                question.answers = Lazy(question.answers).shuffle().toArray();
            });

            return questions;
        },

        getDefaultFavoritesFilenames: function() {
            return {
                'WVL_APP_1_Cafe_Zuuptjele.mp3' : true,
                'WVL_APP_9_UitdrukkingenRoeselare_PreusLikVijrtig.mp3' : true,
                'WVL_APP_9_UitdrukkingenRoeselare_GifMaChette.mp3' : true,
                'WVL_APP_10_UitdrukkingenBrugge_MoGowZeg.mp3' : true,
                'WVL_APP_9_UitdrukkingenRoeselare_KjerEkjeWere.mp3' : true,
                'WVL_APP_9_UitdrukkingenRoeselare_MoVintToch.mp3' : true,
                'WVL_APP_9_UitdrukkingenRoeselare_GeMoeDjeMuleOed\'n.mp3' : true,
                'Scheur_je_puuste.mp3' : true,
                'WVL_APP_8_UitdrukkingenOostende_ZedEMuuleVaLintjes.mp3' : true
            };
        },

        getBaseUrl: function() {
            //todo this should toggle between a dev & production url, depending on the environment variable
            //but we don't have a production url yet
            return 'http://random.projects.bitsoflove.be/iedereen-west-vlaams/dev/';
        },

        onPhotoModeUpdated: function(cb, $scope) {
            this.photoMode.on('update', cb, $scope);
        },

        onPhotoUpdated: function(cb, $scope) {
            this.photo.on('update', cb, $scope);
        },

        onShareImageUpdated: function(cb, $scope) {
            this.shareImage.on('update', cb, $scope);
        },

        onShareImageLocationUpdated: function(cb, $scope) {
            this.shareImageLocation.on('update', cb, $scope);
        },

        onShareImageRemoteLocationUpdated: function(cb, $scope) {
            this.shareImageRemoteLocation.on('update', cb, $scope);
        },

        onThemesUpdated: function(cb, $scope) {
            this.themes.on('update', cb, $scope);
        },

        onSoundsUpdated: function(cb, $scope) {
            this.sounds.on('update', cb, $scope);
        }
    };
});
