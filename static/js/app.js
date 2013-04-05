'use strict';

// Declare app level module which depends on filters, and services
var app = angular.module('presentation'
    ,['presentation.filters', 'presentation.services', 'presentation.directives', '$strap.directives']
    ,function($interpolateProvider){
        $interpolateProvider.startSymbol('((');
        $interpolateProvider.endSymbol('))');
    }
    ).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.when("/" + window.roomName + '/app/poll', {templateUrl: '/static/partials/admin.html', controller: AdminCtrl});
    $routeProvider.when("/" + window.roomName + '/app/chat', {templateUrl: '/static/partials/chat.html', controller: ChatCtrl});
    $routeProvider.when("/" + window.roomName + '/app/login', {templateUrl: '/static/partials/login.html', controller: RoomCtrl});
    $routeProvider.otherwise({redirectTo: "/" + window.roomName + '/app/poll'});
    $locationProvider.html5Mode(true);
  }]);
