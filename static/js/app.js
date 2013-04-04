'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('bookly', ['bookly.filters', 'bookly.services', 'bookly.directives', '$strap.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.when('/dashboard', {templateUrl: 'partials/dashboard', controller: DashboardCtrl});
    $routeProvider.when('/add-bookmark', {templateUrl: 'partials/addBookmark', controller: DashboardCtrl});
    // $routeProvider.when('/login', {templateUrl: 'partials/login', controller: loginCtrl});
    $routeProvider.when('/signup', {templateUrl: 'partials/signup', controller: signUpFormCtrl});
    $routeProvider.otherwise({redirectTo: '/dashboard'});
    $locationProvider.html5Mode(true);
  }]);
