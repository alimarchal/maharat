<?php

use Illuminate\Support\Facades\Route;

// Emergency cookie clearing route for ScalaHosting issue
Route::get('/clear-cookies', function () {
    $response = response()->view('clear-cookies');
    
    // Clear all cookies
    $response->withCookie(cookie()->forget('maharat_session'));
    $response->withCookie(cookie()->forget('XSRF-TOKEN'));
    
    return $response;
});

Route::get('/emergency-login', function () {
    // Force clear all cookies and redirect to login
    $response = redirect('/login');
    
    $response->withCookie(cookie()->forget('maharat_session'));
    $response->withCookie(cookie()->forget('XSRF-TOKEN'));
    
    return $response;
});
