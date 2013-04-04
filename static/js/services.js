'use strict';

/* Services */
// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('presentation.services', ['ngCookies']).
  value('version', '0.1').
  factory('socket', function ($rootScope) {
    var roomName = undefined;
    var createSocket = function () {
      var port = (location.port != 8888) ? ':'+location.port : '8888'
      var socket = new WebSocket('ws://' + document.domain + "8888" + '/' + roomName + '/ws');
      socket.onopen = function () {
        var args = arguments;
        $rootScope.$apply(function () {
          self.socket_handlers.onopen.apply(socket, args)
        })
      }

      socket.onmessage = function (data) {
        var args = arguments;
        $rootScope.$apply(function () {
          self.socket_handlers.onmessage.apply(socket, args)
        })
      }

      socket.onclose = function () {
        setTimeout(function () {
          createSocket();
        }, 10000);

        var args = arguments;
        $rootScope.$apply(function () {
          console.log("self : ", self);
          console.log("self.socket_handlers : ", self.socket_handlers.onclose);
          if (self.socket_handlers.onclose != undefined){
            self.socket_handlers.onclose.apply(socket, args);
          }
        })
      }
      return socket
    }

    self.socket_handlers = {}

    var methods = {
      init: function(roomName){
        roomName = roomName;
        var socket = createSocket()
      }
      ,onopen: function (callback) {
        self.socket_handlers.onopen = callback
      }
      , onmessage: function (callback) {
        self.socket_handlers.onmessage = callback
      }
      , onclose: function (callback) {
        self.socket_handlers.onclose = callback
      }
    }
    return methods

  }).
  factory('AuthSession', function ($rootScope, $cookieStore, socket) {
    var modalCallback = function(){};
    var userSession = $cookieStore.get("BookliSession");

    var login = function(){
         socket.emit('user:login',
                     { email: this.user.email });
    };

    socket.onmessage('user:login:result', function (data) {
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
