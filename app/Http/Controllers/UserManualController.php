<?php

namespace App\Http\Controllers;

use App\Models\UserManual;
use Illuminate\Http\Request;

class UserManualController extends Controller
{
    /**
     * Check if a manual exists for a given card ID
     *
     * @param int $cardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkManualExists($cardId)
    {
        try {
            $exists = UserManual::where('card_id', $cardId)->exists();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'exists' => $exists
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking manual existence',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 