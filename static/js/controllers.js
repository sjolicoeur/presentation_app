'use strict';

/* Controllers */

function AdminCtrl($scope, socket){
    console.log("in admin ctrl", socket);
    $scope.questions = {};
    var nextQuestion = 0;

    $scope.addBlankAnswer = function(){
        console.log('add');
        $scope.question.answers.push({"aid": $scope.question.answers.length+1, "answer":"Answer"});
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
        var qid = $scope.question.qid;
        $scope.questions[$scope.question.qid] = {"qid": qid
                                  ,"type": "poll"
                                  ,"question": $scope.question.question
                                  ,"answer": $scope.question.answer
                                  ,"answers": results};
        console.log("hou", $scope.questions);
        $scope.question = {}
        return $scope.questions[qid];
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

function RoomCtrl($scope, socket){
    console.log("in Room ctrl");
}

function MainCtrl($scope, socket){
    console.log("in Main ctrl");
    $scope.isLoggedIn = false;
    $scope.currentUser = {};
    $scope.$on("userLoggedIn", function(event, data){
        $scope.currentUser.name = data.user.email;
        $scope.isLoggedIn = true;
    });
}

function loginCtrl($scope, socket, AuthSession) {
    $scope.user = {}
    $scope.login = function(){
        console.log("loggin in", $scope.user);
        if ($scope.dismiss !== undefined){
            $scope.dismiss();
        } // dismiss only available when modal is displayed
        $scope.$emit("userLoggedIn", $scope);
    }
    console.log("scope in loginCtrl", $scope);


    //$scope.login = AuthSession.login;
}
