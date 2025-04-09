<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FAQController extends Controller
{
    public function view()
    {
        return Inertia::render('FAQs/ViewFAQ');
    }
} 