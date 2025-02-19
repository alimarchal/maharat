<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'messages' => [
            'welcome' => __('messages.welcome')
        ],
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Login Route
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Logout Route
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Register Route
Route::post('/register', [AuthController::class, 'register'])->name('register');

// Dashboard Route (Protected)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Dashboard'); })->name('dashboard');
});

// Forgot Password (Guest Only)
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', function () { return Inertia::render('Auth/ForgotPassword'); })->name('password.request');
});

// Profile Routes (Only for Authenticated Users)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Language Switch
Route::get('language/{locale}', function ($locale) {
    app()->setLocale($locale);
    session()->put('locale', $locale);
    return redirect()->back();
})->name('language.switch');

// Include Auth Routes
require __DIR__.'/auth.php';
