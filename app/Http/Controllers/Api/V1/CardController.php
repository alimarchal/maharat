<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Database\Seeders\CardSeeder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class CardController extends Controller
{
    /**
     * Display a listing of the cards.
     */
    public function index()
    {
        try {
            // Get all cards with their recursive descendants
            $cards = Card::with(['descendants' => function($query) {
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get();

            // Separate main cards and sub-cards
            $mainCards = $cards->whereNull('parent_id')->values()->all();
            $subCards = $cards->whereNotNull('parent_id')->values()->all();

            return response()->json([
                'success' => true,
                'data' => [
                    'main_cards' => $mainCards,
                    'sub_cards' => $subCards
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch cards: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch cards'
            ], 500);
        }
    }

    /**
     * Recursively build the sub-cards hierarchy
     */
    private function buildSubCards($descendants)
    {
        return $descendants->map(function($card) {
            return [
                'id' => $card->id,
                'name' => $card->name,
                'description' => $card->description,
                'section_id' => $card->section_id,
                'subsection_id' => $card->subsection_id,
                'parent_id' => $card->parent_id,
                'order' => $card->order,
                'is_active' => $card->is_active,
                'subCards' => $this->buildSubCards($card->descendants)
            ];
        })->all();
    }

    /**
     * Store a newly created card in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'parent_id' => 'nullable|exists:cards,id',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'section_id' => 'required|string',
            ]);

            $card = new Card();
            $card->name = $validated['name'];
            $card->description = $validated['description'];
            
            // Format subsection_id from name (lowercase, replace spaces with hyphens)
            $subsectionId = strtolower(str_replace(' ', '-', $validated['name']));
            
            // Handle parent_id and section_id
            if (isset($validated['parent_id'])) {
                $parentCard = Card::find($validated['parent_id']);
                if ($parentCard) {
                    $card->parent_id = $parentCard->id;
                    $card->section_id = $parentCard->section_id;
                    $card->subsection_id = $subsectionId;
                }
            } else {
                $card->section_id = $validated['section_id'];
            }
            
            $card->is_active = true;

            if ($request->hasFile('icon')) {
                $icon = $request->file('icon');
                $path = $icon->store('card-icons', 'public');
                $card->icon_path = $path;
            }

            $card->save();

            return response()->json([
                'success' => true,
                'message' => 'Card created successfully',
                'data' => $card
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Card creation failed: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create card: ' . $e->getMessage()
            ], 500);
        }
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
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'section_id' => 'required|string',
                'parent_id' => 'nullable|integer|exists:cards,id',
                'subsection_id' => 'nullable|string',
                'order' => 'required|integer',
                'icon' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            // Update card data
            $card->name = $validated['name'];
            $card->description = $validated['description'];
            $card->section_id = $validated['section_id'];
            $card->parent_id = $validated['parent_id'] ?? null;
            $card->subsection_id = $validated['subsection_id'] ?? null;
            $card->order = $validated['order'];

            // Handle icon upload
            if ($request->hasFile('icon')) {
                // Delete old icon if exists
                if ($card->icon_path) {
                    Storage::delete($card->icon_path);
                }
                
                $path = $request->file('icon')->store('card-icons', 'public');
                $card->icon_path = $path;
            }

            $card->save();

            return response()->json([
                'success' => true,
                'message' => 'Card updated successfully',
                'data' => $card
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update card',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified card from storage.
     */
    public function destroy(Card $card)
    {
        try {
            // Delete icon if exists
            if ($card->icon_path) {
                Storage::delete('public/' . $card->icon_path);
            }

            $card->delete();

            return response()->json([
                'message' => 'Card deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Card deletion failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to delete card'
            ], 500);
        }
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

    /**
     * Get card hierarchy
     */
    public function getHierarchy()
    {
        $cards = Card::with(['children' => function($query) {
            $query->orderBy('order');
        }])
        ->whereNull('parent_id')
        ->orderBy('order')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $cards
        ]);
    }

    /**
     * Create a new card with hierarchy support
     */
    public function createWithHierarchy(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cards,id',
            'icon_path' => 'nullable|string',
            'color_scheme' => 'nullable|string',
            'metadata' => 'nullable|json',
            'order' => 'nullable|integer',
            'is_active' => 'nullable|boolean'
        ]);

        // Handle file upload if icon is provided
        if ($request->hasFile('icon')) {
            $path = $request->file('icon')->store('card-icons', 'public');
            $validated['icon_path'] = $path;
        }

        $card = Card::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Card created successfully',
            'data' => $card
        ], 201);
    }

    /**
     * Update card hierarchy
     */
    public function updateHierarchy(Request $request)
    {
        $validated = $request->validate([
            'hierarchy' => 'required|array',
            'hierarchy.*.id' => 'required|exists:cards,id',
            'hierarchy.*.parent_id' => 'nullable|exists:cards,id',
            'hierarchy.*.order' => 'required|integer'
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['hierarchy'] as $item) {
                Card::where('id', $item['id'])->update([
                    'parent_id' => $item['parent_id'],
                    'order' => $item['order']
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Card hierarchy updated successfully'
        ]);
    }

    /**
     * Get card with all its children recursively
     */
    public function getCardWithChildren($id)
    {
        $card = Card::with(['children' => function($query) {
            $query->orderBy('order');
        }])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $card
        ]);
    }

    /**
     * Update the order of cards
     */
    public function reorder(Request $request)
    {
        try {
            $validated = $request->validate([
                'cards' => 'required|array',
                'cards.*.id' => 'required|exists:cards,id',
                'cards.*.order' => 'required|integer',
                'cards.*.parent_id' => 'nullable|exists:cards,id'
            ]);

            DB::transaction(function () use ($validated) {
                foreach ($validated['cards'] as $cardData) {
                    Card::where('id', $cardData['id'])->update([
                        'order' => $cardData['order'],
                        'parent_id' => $cardData['parent_id'] ?? null
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Cards reordered successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to reorder cards: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder cards: ' . $e->getMessage()
            ], 500);
        }
    }
}
