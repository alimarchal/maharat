<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class FileController extends Controller
{
    public function download($filename)
    {
        $path = storage_path('app/public/rfq-attachments/' . $filename);

        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return response()->download($path);
    }
}
