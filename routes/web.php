<?php

use App\Http\Controllers\ProfileController;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
//    return to_route('login');
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

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/my-requests', function () {
        return Inertia::render('Dashboard', ['page' => 'Requests/RequestIndex']);
    })->name('requests.index');

    Route::get('/new-request', function () {
        return Inertia::render('Dashboard', ['page' => 'Requests/MakeRequest']);
    })->name('requests.create');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


Route::get('language/{locale}', function ($locale) {
    app()->setLocale($locale);
    session()->put('locale', $locale);
    return redirect()->back();
})->name('language.switch');

require __DIR__.'/auth.php';
