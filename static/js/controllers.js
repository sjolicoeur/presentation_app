'use strict';

/* Controllers */

function AdminCtrl($scope, $cookieStore, socket){
    console.log("in admin ctrl", socket);

    var questionsSession = $cookieStore.get("PresentationQuestionsSession");
    var nextQuestion = 0;
    if (questionsSession !== undefined){
        $scope.questions = questionsSession.questions;
        for(var elem in $scope.questions){
            if($scope.questions.hasOwnProperty(elem)){
                nextQuestion++;
            }
        }

    } else {
        $scope.questions = {};
    }

    function UpdateQuestionsSession(data){
        $cookieStore.put("PresentationQuestionsSession", {"questions": data});
    }

    $scope.addBlankAnswer = function(){
        console.log('add');
        $scope.question.answers.push({"aid": $scope.question.answers.length+1, "answer": null});
    }

    function createNewQuestion(){
        nextQuestion += 1;
        $scope.question = { question: "", answer: undefined, qid: nextQuestion, answers:[] };
        $scope.addBlankAnswer();
        $scope.defaultAnswers = $scope.question.answers[0].aid;
    }
    createNewQuestion();

    function sanitize(){
        var sanitizedAnswers = [];
        $scope.question.answers.forEach(function(v){
            console.log("sanitize ... ", v);
            if (v.answer !== "Answer" && v.answer !== undefined && v.answer !== null && v.answer !== "") {
                console.log("sanitize value ... ", v.answer);
                sanitizedAnswers.push(v);
            }
        });
        console.log("sanitezed : ", sanitizedAnswers);
        return sanitizedAnswers;
    }

    $scope.addNewQuestion = function(){
        console.log('addQuestion', $scope.question, $scope.defaultAnswers);
        var results = sanitize();
        console.log('results : ', results.length)
        var qid = $scope.question.qid;
        if($scope.question.question === "" || $scope.question.question == undefined || results.length === 0){
            return undefined;
        }
        $scope.questions[$scope.question.qid] = {
            "qid": qid
            ,"type": "poll"
            ,"question": $scope.question.question
            ,"answer": parseInt($scope.defaultAnswers)
            ,"answers": results};

        console.log("hou", $scope.questions);
        $scope.question = {}
        UpdateQuestionsSession($scope.questions);
        return $scope.questions[qid];
    }

    $scope.setCurrentQuestionActive = function(qid){
        $scope.question = $scope.questions[qid];
        $scope.defaultAnswers = $scope.question.answer;
    }

    $scope.deleteQuestion = function(qid){
        delete $scope.questions[qid];
        UpdateQuestionsSession($scope.questions);
        socket.send(JSON.stringify({"type": "poll:delete", "qid": qid}));
    }

    $scope.sendQuestion = function() {
        var addedPoll = $scope.addNewQuestion();
        if (addedPoll !== undefined){
            socket.send(JSON.stringify(addedPoll));
            SendChatMessage(socket, "New Poll has been post " + addedPoll.question, $scope.currentUser)
            createNewQuestion();
        }

    }
}

function RoomCtrl($scope, socket){
    console.log("in Room ctrl");
}

function MainCtrl($scope, $cookieStore, socket){
    console.log("in Main ctrl");
    var userSession = $cookieStore.get("PresentationSession");
    if (userSession !== undefined){
        $scope.isLoggedIn = true;
        $scope.currentUser = userSession.email;
    } else {
        $scope.isLoggedIn = false;
        $scope.currentUser = {};
    }

    $scope.$on("userLoggedIn", function(event, data){
        $scope.currentUser.email = data.user.email;
        $scope.isLoggedIn = true;
    });

     $scope.$on("userLoggedOut", function(event, data){
        $scope.currentUser= {};
        $scope.isLoggedIn = false;
    });
}

function loginCtrl($scope, $cookieStore, socket) {
    $scope.user = {}
    $scope.login = function(){
        console.log("loggin in", $scope.user);
        $cookieStore.put("PresentationSession", $scope.user);
        if ($scope.dismiss !== undefined){
            $scope.dismiss();
        } // dismiss only available when modal is displayed
        $scope.$emit("userLoggedIn", $scope);
    }
    $scope.logout = function(){
        console.log("logout!");
        $cookieStore.remove("PresentationSession");
        $scope.$emit("userLoggedOut", {});
    }
    console.log("scope in loginCtrl", $scope);
    //$scope.login = AuthSession.login;
}
