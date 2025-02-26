<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\RfqCategory;
use Illuminate\Http\Request;

class RfqCategoryController extends Controller
{
    public function show($rfqId)
    {
        $rfqCategory = RfqCategory::where('rfq_id', $rfqId)
            ->join('product_categories', 'rfq_categories.category_id', '=', 'product_categories.id')
            ->select('product_categories.name as category_name')
            ->first();

        return response()->json([
            'data' => [
                'category_name' => $rfqCategory ? $rfqCategory->category_name : null
            ]
        ]);
    }
} 