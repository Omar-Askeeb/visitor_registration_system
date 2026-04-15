<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\TrainingRecord;
use App\Models\Event;
use Illuminate\Http\JsonResponse;

class TrainingRecordController extends Controller
{
    public function store(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'formID'        => 'nullable|string',
            'badgeID'       => 'nullable|string',
            'visitorName'   => 'nullable|string|max:255',
            'midleName'     => 'nullable|string|max:255',
            'surName'       => 'nullable|string|max:255',
            'organisation'  => 'nullable|string|max:255',
            'email'         => 'nullable|email|max:255',
            'phone1'        => 'nullable|string|max:30',
            'phone2'        => 'nullable|string|max:30',
            'gender'        => 'nullable|string|max:20',
            'nationality'   => 'nullable|string|max:100',
            'resident'      => 'nullable|string|max:100',
            'workfield'     => 'nullable|array',
            'howexpo'       => 'nullable|array',
            'fill_duration' => 'nullable|numeric',
        ]);

        $validated['event_id'] = $event->id;
        $validated['user_id']  = auth()->id();

        $record = TrainingRecord::create($validated);

        return response()->json([
            'message' => 'Practice record saved',
            'record'  => $record
        ], 201);
    }
}
