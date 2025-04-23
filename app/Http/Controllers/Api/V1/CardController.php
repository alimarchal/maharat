<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Database\Seeders\CardSeeder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class CardController extends Controller
{
    /**
     * Display a listing of the cards.
     */
    public function index()
    {
        // Check if we already have cards in the database
        $cardCount = Card::count();
        
        // If no cards exist, let's seed them
        if ($cardCount === 0) {
            $seeder = new CardSeeder();
            $seeder->run();
        }
        
        // Get all cards ordered by section and subsection
        $cards = Card::orderBy('section_id')
                    ->orderBy('subsection_id')
                    ->orderBy('order')
                    ->get();
        
        return response()->json([
            'success' => true,
            'data' => $cards
        ]);
    }

    /**
     * Store a newly created card in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'section_id' => 'nullable|string|max:255',
            'subsection_id' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:cards,id',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean'
        ]);

        $card = Card::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Card created successfully',
            'data' => $card
        ], 201);
    }

    /**
     * Display the specified card.
     */
    public function show(Card $card)
    {
        return response()->json([
            'success' => true,
            'data' => $card
        ]);
    }

    /**
     * Update the specified card in storage.
     */
    public function update(Request $request, Card $card)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'section_id' => 'nullable|string|max:255',
            'subsection_id' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:cards,id',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean'
        ]);

        $card->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Card updated successfully',
            'data' => $card
        ]);
    }

    /**
     * Remove the specified card from storage.
     */
    public function destroy(Card $card)
    {
        $card->delete();

        return response()->json([
            'success' => true,
            'message' => 'Card deleted successfully'
        ], 200);
    }
    
    /**
     * Refresh the cards by reseeding them
     */
    public function refresh()
    {
        try {
            $seeder = new CardSeeder();
            $seeder->run();
            
            return response()->json([
                'success' => true,
                'message' => 'Cards refreshed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to refresh cards',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
