<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PrePrintHistory;

class PrePrintHistoryController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->query('type', 'badge');
        
        $histories = PrePrintHistory::with(['event', 'user'])
            ->where('type', $type)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($histories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => 'required|exists:events,id',
            'type' => 'nullable|string|in:badge,form',
            'start_code' => 'required|integer|min:1',
            'end_code' => 'required|integer|gte:start_code',
            'batch_size' => 'required|integer|min:1',
            'iterative_digits' => 'nullable|integer|min:1|max:10',
            'barcode_width' => 'nullable|string',
            'barcode_height' => 'nullable|string',
            'barcode_x' => 'nullable|string',
            'barcode_y' => 'nullable|string',
            'page_width' => 'nullable|string',
            'page_height' => 'nullable|string',
        ]);

        if (!isset($validated['type'])) {
            $validated['type'] = 'badge';
        }

        $history = new PrePrintHistory($validated);
        $history->user_id = $request->user()->id;
        $history->save();

        return response()->json($history->load(['event', 'user']), 201);
    }
}
