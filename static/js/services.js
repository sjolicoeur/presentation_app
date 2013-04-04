'use strict';

/* Services */
// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('bookly.services', ['ngCookies']).
  value('version', '0.1').
  factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  }).
  factory('AuthSession', function ($rootScope, $cookieStore, socket) {
    var modalCallback = function(){};
    var userSession = $cookieStore.get("BookliSession");

    var login = function(){
         socket.emit('user:login',
                     { email: this.user.email });
    };

    socket.on('user:login:result', function (data) {
        if(data.status === "success"){
          $cookieStore.put("BookliSession", data);
          modalCallback($cookieStore.get("BookliSession"));
        }
    });

    var manageLogin = function(callback){
      modalCallback = callback;
      console.log(callback);
      if ($cookieStore.get("BookliSession")){
        callback($cookieStore.get("BookliSession"));
      }
    }

    return {
        login: login,
        manageLogin: manageLogin,
        isLoggedIn: function () {
            return userSession ? true : false;
        }
    };

});
