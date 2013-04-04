'use strict';

/* Controllers */

function AdminCtrl($scope, socket){
    console.log("in admin ctrl", socket);
    $scope.questions = {};
    var nextQuestion = 0;

    $scope.addBlankAnswer = function(){
        console.log('add');
        $scope.question.answers.push({"aid": $scope.question.answers.length+1, "answer":"Answer", "isCorrect": false});
    }

    function createNewQuestion(){
        nextQuestion += 1;
        $scope.question = { question: "", answer: undefined, qid: nextQuestion, answers:[] };
        $scope.addBlankAnswer();
    }
    createNewQuestion();

    function sanitize(){
        var sanitizedAnswers = [];
        $scope.question.answers.forEach(function(v){
            console.log("sanitize ... ", v);
            if (v.answer !== "Answer") {
                sanitizedAnswers.push(v);
            }
        });
        console.log("sanitezed : ", sanitizedAnswers);
        return sanitizedAnswers;
    }

    $scope.addNewQuestion = function(){
        console.log('addQuestion', $scope.question.answer);
        var results = sanitize();
        $scope.questions[$scope.question.qid] = {"qid": $scope.question.qid
                                  ,"type": "poll"
                                  ,"question": $scope.question.question
                                  ,"answer": $scope.question.answer
                                  ,"answers": results};
        console.log("hou", $scope.questions);
        $scope.question = {}
        return $scope.questions[$scope.questions.length-1];
    }

    $scope.setCurrentQuestionActive = function(qid){
        $scope.question = $scope.questions[qid];
    }
    $scope.deleteQuestion = function(qid){
        delete $scope.questions[qid];
        socket.send(JSON.stringify({"type": "poll:delete", "qid": qid}));
    }

    $scope.sendQuestion = function() {
        socket.send(JSON.stringify($scope.addNewQuestion()));
        createNewQuestion();
    }
}

function MainCtrl($scope, socket){
    console.log("in Main ctrl");
}

// DashboardCtrl.$inject = [];
function signUpFormCtrl($scope, socket) {
    $scope.submit = function(){
        socket.emit('user:new'
                    , { email: this.email
                        ,username: this.username });
    };

    socket.onmessage('user:new:result', function (data) {
        $scope.newUser = data;
        $scope.$emit("userLoggedIn", data);
    });
}

function loginCtrl($scope, socket, AuthSession) {
    AuthSession.manageLogin(function(data){
        console.log("scope in loginCtrl", $scope);
        if ($scope.dismiss !== undefined){
            $scope.dismiss();
        } // dismiss only available when modal is displayed
        $scope.$emit("userLoggedIn", data);
    });

    $scope.login = AuthSession.login;
}
