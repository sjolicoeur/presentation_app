'use strict';

/* Controllers */

function AdminCtrl($scope, socket){
    console.log("in admin ctrl");
    socket.onmessage('bookmarklist', function (data) {
        $scope.classroom = data;
    });
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
