<?php

namespace App\Http\Controllers;

use App\Models\Exhibitor;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ExhibitorController extends Controller
{
    /**
     * List all exhibitors for a specific event, with optional filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Exhibitor::with('printedBy:id,name')
            ->when($request->event_id, fn($q) => $q->where('event_id', $request->event_id))
            ->when($request->type,     fn($q) => $q->where('type', $request->type))
            ->when($request->filled('is_printed'), fn($q) => $q->where('is_printed', $request->is_printed))
            ->when($request->search,   function ($q) use ($request) {
                $s = '%' . $request->search . '%';
                $q->where(function ($q2) use ($s) {
                    $q2->where('company_name_ar', 'like', $s)
                       ->orWhere('company_name_en', 'like', $s)
                       ->orWhere('nationality',     'like', $s)
                       ->orWhere('receiver_name',   'like', $s);
                });
            })
            ->orderBy('company_name_en')
            ->get();

        return response()->json($query);
    }

    /**
     * Create a new exhibitor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id'         => 'required|exists:events,id',
            'type'             => 'required|in:local,international',
            'nationality'      => 'nullable|string|max:100',
            'company_name_ar'  => 'nullable|string|max:255',
            'company_name_en'  => 'nullable|string|max:255',
            'hall_number'      => 'nullable|integer',
            'stand_number'     => 'nullable|string|max:50',
            'number_of_badges'    => 'nullable|integer|min:0',
            'receiver_name'       => 'nullable|string|max:255',
            'receiver_phone'      => 'nullable|string|max:30',
            'extra_badges'        => 'nullable|integer|min:0',
            'number_of_vip_cards' => 'nullable|integer|min:0',
            'vip_cards_received'  => 'nullable|boolean',
            'employees'           => 'nullable|array',
            'employees.*.name'    => 'required|string|max:255',
        ]);

        // Auto-generate barcode_id
        $validated['barcode_id'] = 'EXH-' . strtoupper(uniqid());

        $exhibitor = Exhibitor::create($validated);

        return response()->json($exhibitor->load('printedBy:id,name'), 201);
    }

    /**
     * Update an exhibitor.
     */
    public function update(Request $request, Exhibitor $exhibitor): JsonResponse
    {
        $validated = $request->validate([
            'type'             => 'sometimes|in:local,international',
            'nationality'      => 'nullable|string|max:100',
            'company_name_ar'  => 'nullable|string|max:255',
            'company_name_en'  => 'nullable|string|max:255',
            'hall_number'      => 'nullable|integer',
            'stand_number'     => 'nullable|string|max:50',
            'number_of_badges'    => 'nullable|integer|min:0',
            'receiver_name'       => 'nullable|string|max:255',
            'receiver_phone'      => 'nullable|string|max:30',
            'extra_badges'        => 'nullable|integer|min:0',
            'number_of_vip_cards' => 'nullable|integer|min:0',
            'vip_cards_received'  => 'nullable|boolean',
            'employees'           => 'nullable|array',
            'employees.*.name'    => 'required|string|max:255',
        ]);

        $exhibitor->update($validated);

        return response()->json($exhibitor->fresh()->load('printedBy:id,name'));
    }

    /**
     * Delete an exhibitor.
     */
    public function destroy(Exhibitor $exhibitor): JsonResponse
    {
        $exhibitor->delete();
        return response()->json(['message' => 'Exhibitor deleted.']);
    }

    /**
     * Mark one or more exhibitors as printed.
     */
    public function markPrinted(Request $request): JsonResponse
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:exhibitors,id']);

        Exhibitor::whereIn('id', $request->ids)->update([
            'is_printed' => true,
            'printed_at' => now(),
            'printed_by' => Auth::id(),
        ]);

        return response()->json(['message' => count($request->ids) . ' exhibitors marked as printed.']);
    }

    /**
     * Mark an exhibitor as badges received.
     */
    public function markReceived(Request $request, Exhibitor $exhibitor): JsonResponse
    {
        $exhibitor->update([
            'badges_received'    => true,
            'badges_received_at' => now(),
        ]);

        return response()->json($exhibitor->fresh());
    }

    /**
     * Toggle the VIP cards received status.
     */
    public function toggleVIPReceived(Request $request, Exhibitor $exhibitor): JsonResponse
    {
        $exhibitor->update([
            'vip_cards_received' => !$exhibitor->vip_cards_received,
        ]);

        return response()->json($exhibitor->fresh());
    }

    /**
     * Bulk import exhibitors from a JSON payload.
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $request->validate([
            'event_id'    => 'required|exists:events,id',
            'exhibitors'  => 'required|array',
            'exhibitors.*.type'            => 'required|in:local,international',
            'exhibitors.*.nationality'     => 'nullable|string|max:100',
            'exhibitors.*.company_name_en' => 'required|string|max:255',
            'exhibitors.*.company_name_ar' => 'nullable|string|max:255',
            'exhibitors.*.hall_number'     => 'nullable|integer',
            'exhibitors.*.stand_number'    => 'nullable|string|max:50',
            'exhibitors.*.number_of_badges'   => 'nullable|integer|min:0',
            'exhibitors.*.receiver_name'      => 'nullable|string|max:255',
            'exhibitors.*.receiver_phone'     => 'nullable|string|max:30',
            'exhibitors.*.extra_badges'       => 'nullable|integer|min:0',
            'exhibitors.*.number_of_vip_cards'=> 'nullable|integer|min:0',
            'exhibitors.*.vip_cards_received' => 'nullable|boolean',
            'exhibitors.*.employees'          => 'nullable|array',
        ]);

        $created = [];
        DB::transaction(function () use ($request, &$created) {
            foreach ($request->exhibitors as $row) {
                $row['event_id']   = $request->event_id;
                $row['barcode_id'] = 'EXH-' . strtoupper(uniqid());
                $created[] = Exhibitor::create($row);
            }
        });

        return response()->json([
            'message'    => count($created) . ' exhibitors imported.',
            'exhibitors' => $created,
        ], 201);
    }
}
