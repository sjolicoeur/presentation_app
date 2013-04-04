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
    $routeProvider.when("/" + window.roomName + '/app/home', {templateUrl: '/static/partial/admin.html', controller: AdminCtrl});
    $routeProvider.when("/" + window.roomName + '/app/signup', {templateUrl: '/static/partial/signup.html', controller: signUpFormCtrl});
    $routeProvider.otherwise({redirectTo: "/" + window.roomName + '/app/home'});
    $locationProvider.html5Mode(true);
  }]);
