'use strict';

/* Controllers */

function AdminCtrl($scope, socket){
    console.log("in admin ctrl", socket);
    $scope.answers = [];

    $scope.addBlankAnswer = function(){
        console.log('add');
        $scope.answers.push({"aid": $scope.answers.length+1, "answer":"Anwser", "isValid": false});
    }

    $scope.addBlankAnswer();

    function sanitize(){
        var sanitizedAnswers = [];
        $scope.answers.forEach(function(v){
            console.log("sanitize ... ", v);
            if (v.Anwser !== "Anwser") {
                sanitizedAnswers.push(v);
            }

        });
        return sanitizedAnswers;
    }

    $scope.sendQuestion = function() {
        var results = sanitize();
        socket.send(JSON.stringify({"type": "poll"
                    ,"question": $scope.question
                    ,"answers": results}));
    }
}

function MainCtrl($scope, socket){
    console.log("in admin ctrl");
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
