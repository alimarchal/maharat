<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    /**
     * Check if email exists and is verified
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $email = $request->input('email');
        
        $user = User::where('email', $email)
            ->whereNotNull('email_verified_at')
            ->first();
        
        return response()->json([
            'exists' => $user ? true : false,
            'verified' => $user ? true : false,
        ]);
    }
} 