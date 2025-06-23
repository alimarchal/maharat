<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ExternalDeliveryNote\StoreExternalDeliveryNoteRequest;
use App\Http\Requests\V1\ExternalDeliveryNote\UpdateExternalDeliveryNoteRequest;
use App\Http\Resources\V1\ExternalDeliveryNoteResource;
use App\Http\Resources\V1\ExternalDeliveryNoteCollection;
use App\Models\ExternalDeliveryNote;
use App\QueryParameters\ExternalDeliveryNoteParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExternalDeliveryNoteController extends Controller
{
    /**
     * Display a listing of external delivery notes.
     */
    public function index(): JsonResponse|ExternalDeliveryNoteCollection
    {
        $notes = QueryBuilder::for(ExternalDeliveryNote::class)
            ->allowedFilters([
                // Regular filters
                'delivery_note_number',
                'created_at',
                // Exact filters
                AllowedFilter::exact('id'),
                AllowedFilter::exact('user_id'),
                AllowedFilter::exact('grn_id'),
                AllowedFilter::exact('purchase_order_id')
            ])
            ->allowedSorts(ExternalDeliveryNoteParameters::ALLOWED_SORTS)
            ->allowedIncludes(ExternalDeliveryNoteParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($notes->isEmpty()) {
            return response()->json([
                'message' => 'No external delivery notes found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new ExternalDeliveryNoteCollection($notes);
    }
    /**
     * Store a newly created external delivery note.
     */
    public function store(StoreExternalDeliveryNoteRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Set current user as creator if not provided
            if (!isset($data['user_id'])) {
                $data['user_id'] = auth()->id();
            }

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $path = $file->store('delivery-notes', 'public');
                $data['attachment_path'] = $path;
                $data['attachment_name'] = $request->input('attachment_name', $file->getClientOriginalName());
            }

            // Auto-populate purchase_order_id from GRN if grn_id is provided
            if (isset($data['grn_id'])) {
                $grn = \App\Models\Grn::findOrFail($data['grn_id']);
                $data['purchase_order_id'] = $grn->purchase_order_id;
            }

            $note = ExternalDeliveryNote::create($data);

            DB::commit();

            return response()->json([
                'message' => 'External delivery note created successfully',
                'data' => new ExternalDeliveryNoteResource(
                    $note->load(['user', 'grn', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create external delivery note',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified external delivery note.
     */
    public function show(string $id): JsonResponse
    {
        $note = QueryBuilder::for(ExternalDeliveryNote::class)
            ->allowedIncludes(ExternalDeliveryNoteParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ExternalDeliveryNoteResource($note)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified external delivery note.
     */
    public function update(UpdateExternalDeliveryNoteRequest $request, ExternalDeliveryNote $externalDeliveryNote): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                // Delete old file if exists
                if ($externalDeliveryNote->attachment_path && Storage::disk('public')->exists($externalDeliveryNote->attachment_path)) {
                    Storage::disk('public')->delete($externalDeliveryNote->attachment_path);
                }

                $file = $request->file('attachment');
                $path = $file->store('delivery-notes', 'public');
                $data['attachment_path'] = $path;
                $data['attachment_name'] = $request->input('attachment_name', $file->getClientOriginalName());
            }

            $externalDeliveryNote->update($data);

            DB::commit();

            return response()->json([
                'message' => 'External delivery note updated successfully',
                'data' => new ExternalDeliveryNoteResource(
                    $externalDeliveryNote->load(['user', 'grn', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update external delivery note',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified external delivery note.
     */
    public function destroy(ExternalDeliveryNote $externalDeliveryNote): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete the attachment file if exists
            if ($externalDeliveryNote->attachment_path && Storage::disk('public')->exists($externalDeliveryNote->attachment_path)) {
                Storage::disk('public')->delete($externalDeliveryNote->attachment_path);
            }

            $externalDeliveryNote->delete();

            DB::commit();

            return response()->json([
                'message' => 'External delivery note deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete external delivery note',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
