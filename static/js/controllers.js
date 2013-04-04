'use strict';

/* Controllers */

function userCtrl(scope, socket){
    scope.userlist = [
      {name: "Frank", img: "/photo.png", updatesCount: 0}
      , {name: "Audrey-Rose", img: "/photo.png", updatesCount: 0}];

    socket.on('userlist', function (data) {
        scope.userlist = data;
    });

    socket.emit('userlist', function (data) {});
}

function bookmarkCtrl(scope, socket){
    scope.bookmarkList = [
        {name: "Ace Editor", img: "/photo.png", commentCount: 0}
        ,{name: "", img: "/photo.png", commentCount: 0}];

    socket.on('bookmarklist', function (data) {
        scope.bookmarklist = data;
    });
}

function addBookmarkCtrl($scope, socket){
    $scope.newBookmark = {};
    $scope.addBookmark = function(){
        console.info("Adding : ", $scope.newBookmark);
        socket.emit('bokkmark:add', $scope.newBookmark);
        $scope.newBookmark = {};
    }
}

function DashboardCtrl($scope, socket) {
    userCtrl($scope, socket);
    bookmarkCtrl($scope, socket);
}

function MainCtrl($scope, socket){
    $scope.isLoggedIn = false;
    $scope.currentUser = {};
    $scope.$on("userLoggedIn", function(event, data){
        $scope.currentUser.name = data.user.username;
        $scope.currentUser.gravatarHash = data.gravatarHash;
        $scope.isLoggedIn = true;
    });

    $scope.modal = {
        "content": "Hello Modal",
        "saved": false
    }

}

// DashboardCtrl.$inject = [];
function signUpFormCtrl($scope, socket) {
    $scope.submit = function(){
        socket.emit('user:new'
                    , { email: this.email
                        ,username: this.username });
    };

    socket.on('user:new:result', function (data) {
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
