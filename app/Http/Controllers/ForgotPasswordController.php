<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Models\User;

class ForgotPasswordController extends Controller
{
    public function sendVerificationCode(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        // Generate 6-digit code
        $verificationCode = mt_rand(100000, 999999);

        // Store in the database
        DB::table('password_resets')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $verificationCode, 'created_at' => now()]
        );

        // Send email
        Mail::raw("Your verification code is: $verificationCode", function ($message) use ($request) {
            $message->to($request->email)
                ->subject("Password Reset Verification Code");
        });

        return response()->json(['message' => 'Verification code sent!'], 200);
    }
}

