<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PasswordResetLinkController;

// Home Route
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

// Dashboard Routes (Protected by Auth & Email Verification)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () { return Inertia::render('Dashboard'); })->name('dashboard');
    Route::get('/my-requests', function () { return Inertia::render('Dashboard', ['page' => 'Requests/RequestIndex']); })->name('requests.index');
    Route::get('/new-request', function () { return Inertia::render('Dashboard', ['page' => 'Requests/MakeRequest']); })->name('requests.create');
    Route::get('/warehouse', function () { return Inertia::render('Dashboard/Warehouse/Warehouse'); })->name('warehouse.index');
});

// Profile Routes (Only for Authenticated Users)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Forgot Password Route (Guest Only)
Route::middleware('guest')->group(function () {
    Route::get('/forgot-password', function () { return Inertia::render('Auth/ForgotPassword');})->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('password.email');
});

// Language Switch Route
Route::get('language/{locale}', function ($locale) {
    app()->setLocale($locale);
    session()->put('locale', $locale);
    return redirect()->back();
})->name('language.switch');

require __DIR__.'/auth.php';
