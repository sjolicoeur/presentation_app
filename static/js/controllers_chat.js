'use strict';

function ChatCtrl($scope, socket){
    $scope.sendComment = function() {
        socket.send(JSON.stringify(
            {"message": $scope.comment
             ,"username": $scope.currentUser
             ,"type": "chat" }));
    }
}