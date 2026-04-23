'use strict';

angular.module('app.components')

.directive('pageQuestion', function() {
    return {
        restrict: 'E',
        scope: {},
        replace: true,
        controller: function($scope, $window, $ionicSlideBoxDelegate, $ionicHistory, $timeout, $state, Store, AudioService, ShareService) {
            if(typeof analytics !== 'undefined') {
                analytics.trackView('Question');
            }

            $scope.soundPlaying = false;
            $scope.slidingToNext = false;
            $scope.scoreTitle = 'Goe gedoan';
            $scope.scoreSenctence = 'Je bent';

            $scope.score = 0;
            $scope.quiz = Store.buildQuiz();
            $scope.currentQuestion = 0;

            $scope.sound = Store.getSoundByObjectId($scope.quiz[0].question.objectId);

            $scope.correct = 'sound';
            $scope.phase = 'questions';

            $scope.answerQuestion = function(answer) {
                $scope.slidingToNext = true;

                if(answer.correct == true) {
                    $scope.score++;
                    $scope.correct = true;
                } else {
                    $scope.correct = false;
                }

                $timeout(function(){ $scope.goToNext(); }, 500);
            };

            $scope.goToNext = function() {
                if($ionicSlideBoxDelegate.$getByHandle('question-slider').currentIndex() < $ionicSlideBoxDelegate.$getByHandle('question-slider').slidesCount()-2) {
                    $scope.sound = Store.getSoundByObjectId($scope.quiz[$ionicSlideBoxDelegate.$getByHandle('question-slider').currentIndex()+1].question.objectId);
                    $scope.correct = 'sound';

                    $scope.playSound($scope.sound);
                } else {
                    $scope.phase = 'result';

                    switch($scope.score) {
                        case 0:
                        case 1:
                        case 2:
                        case 3:
                        case 4:
                        case 5:
                            $scope.scoreTitle = 'Nondeju';
                            $scope.scoreSenctence = 'Je bent nog maar';
                            break;

                        case 5:
                        case 6:
                        case 7:
                        case 8:
                        case 9:
                            $scope.scoreTitle = 'Goe gedoan';
                            $scope.scoreSenctence = 'Je bent al';
                            break;

                        case 10:
                            $scope.scoreTitle = 'Preus lik fjirtig';
                            $scope.scoreSenctence = 'Je bent';
                            break;
                    }
                }

                $ionicSlideBoxDelegate.$getByHandle('question-slider').next();

                $timeout(function() {
                    $scope.slidingToNext = false;
                }, 100);
            };

            $scope.share = function() {
                var image = "www/img/share/share-"+($scope.score*10)+".jpg";

                ShareService.shareImage(image, function(result) {
                    //success
                    analytics.trackEvent('Quiz', 'Share complete');
                }, function(err) {
                    //error
                });
            };

            var doPlaySound = function(sound) {
                $scope.soundPlaying = true;
                $scope.$apply();

                var filename = sound.fileName;
                AudioService.play(filename, function() {
                    //$scope.soundPlaying = false;
                    $scope.$apply();
                    //success
                }, function() {
                    //$scope.soundPlaying = false;
                    $scope.$apply();
                    console.error('Failed to play favorite sound');
                });


                 $timeout(function() {
                    var duration = $window.cordova ? bol.media.getDuration() * 1000 : 1000;

                    $timeout(function() {
                        $scope.soundPlaying = false;
                    }, duration);
                }, 0);

            };
            $scope.playSound = _.throttle(doPlaySound, 256);

            $scope.restart = function() {
                $state.go($state.current, {}, {reload: true});
            };

            $scope.disableSwipe = function() {
                $ionicSlideBoxDelegate.$getByHandle('question-slider').enableSlide(false);
            };

            $scope.playFirst = function() {
                $scope.playSound($scope.sound);
            };
        },
        templateUrl: 'js/pages/page-question/page-question.html'
    };
});
