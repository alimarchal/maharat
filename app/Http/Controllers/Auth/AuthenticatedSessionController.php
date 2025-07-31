<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        $user = Auth::user()->load(['roles', 'permissions']);
        
        // Auto-verify email on login if not already verified
        if (!$user->email_verified_at) {
            Log::info('Auto-verifying email for user', [
                'user_id' => $user->id,
                'email' => $user->email,
                'current_email_verified_at' => $user->email_verified_at
            ]);
            
            $user->update(['email_verified_at' => now()]);
            // Refresh the user object to get the updated data
            $user->refresh();
            
            Log::info('Email verification completed', [
                'user_id' => $user->id,
                'new_email_verified_at' => $user->email_verified_at
            ]);
        }
        
        // Transform roles and permissions to match API format
        $roles = $user->roles->pluck('name')->toArray();
        $permissions = $user->permissions->pluck('name')->toArray();

        return redirect()->intended(route('dashboard', absolute: false))
            ->with('auth', [
                'user' => array_merge($user->toArray(), [
                    'roles' => $roles,
                    'permissions' => $permissions
                ])
            ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Logged out successfully'], 200);
        }

        return redirect()->route('login');
    }
}
