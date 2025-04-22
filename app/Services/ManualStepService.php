<?php

namespace App\Services;

use App\Models\UserManual;
use App\Models\ManualStep;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ManualStepService
{
    public function createStep(UserManual $manual, array $data): ManualStep
    {
        return DB::transaction(function () use ($manual, $data) {
            Log::info('Creating manual step', ['manual_id' => $manual->id, 'data' => $data]);

            // Get the next step number
            $lastStepNumber = $manual->steps()->max('step_number') ?? 0;
            $nextStepNumber = $lastStepNumber + 1;

            $step = $manual->steps()->create([
                'step_number' => $nextStepNumber,
                'title' => $data['title'],
                'description' => $data['description'],
                'action_type' => $data['action_type'] ?? null,
                'order' => $nextStepNumber,
                'is_active' => true,
            ]);

            $this->processStepComponents($step, $data);

            Log::info('Manual step created successfully', ['step_id' => $step->id]);

            return $step->load(['details', 'screenshots', 'actions']);
        });
    }

    public function updateStep(ManualStep $step, array $data): ManualStep
    {
        return DB::transaction(function () use ($step, $data) {
            Log::info('Updating manual step', ['step_id' => $step->id, 'data' => $data]);

            $step->update([
                'title' => $data['title'] ?? $step->title,
                'description' => $data['description'] ?? $step->description,
                'action_type' => $data['action_type'] ?? $step->action_type,
            ]);

            if (isset($data['details']) || isset($data['screenshots']) || isset($data['actions'])) {
                // Delete existing related records
                $step->details()->delete();
                if ($step->screenshots()->exists()) {
                    $this->deleteExistingScreenshots($step);
                }
                $step->actions()->delete();

                // Process new components
                $this->processStepComponents($step, $data);
            }

            Log::info('Manual step updated successfully', ['step_id' => $step->id]);

            return $step->load(['details', 'screenshots', 'actions']);
        });
    }

    public function deleteStep(ManualStep $step): bool
    {
        return DB::transaction(function () use ($step) {
            Log::info('Deleting manual step', ['step_id' => $step->id]);

            // Delete screenshots from storage
            if ($step->screenshots()->exists()) {
                $this->deleteExistingScreenshots($step);
            }

            // Delete the step (cascades to related records)
            $result = $step->delete();

            // Reorder remaining steps
            $this->reorderRemainingSteps($step->user_manual_id);

            Log::info('Manual step deleted successfully', ['step_id' => $step->id]);

            return $result;
        });
    }

    public function reorderSteps(UserManual $manual, array $data): \Illuminate\Database\Eloquent\Collection
    {
        return DB::transaction(function () use ($manual, $data) {
            Log::info('Reordering manual steps', ['manual_id' => $manual->id, 'data' => $data]);

            foreach ($data['items'] as $item) {
                ManualStep::where('id', $item['id'])
                    ->where('user_manual_id', $manual->id)
                    ->update([
                        'step_number' => $item['step_number'],
                        'order' => $item['step_number'],
                    ]);
            }

            Log::info('Manual steps reordered successfully', ['manual_id' => $manual->id]);

            return $manual->steps()
                ->with(['details', 'screenshots', 'actions'])
                ->orderBy('step_number')
                ->get();
        });
    }

    protected function processStepComponents(ManualStep $step, array $data): void
    {
        // Process details
        if (isset($data['details'])) {
            foreach ($data['details'] as $index => $detail) {
                $step->details()->create([
                    'content' => $detail,
                    'order' => $index + 1,
                ]);
            }
        }

        // Process screenshots
        if (isset($data['screenshots'])) {
            foreach ($data['screenshots'] as $index => $screenshot) {
                if ($screenshot instanceof \Illuminate\Http\UploadedFile) {
                    $path = $screenshot->store('user-manuals/screenshots', 'public');

                    $step->screenshots()->create([
                        'screenshot_path' => $path,
                        'alt_text' => $data['screenshot_alts'][$index] ?? null,
                        'caption' => $data['screenshot_captions'][$index] ?? null,
                        'order' => $index + 1,
                    ]);
                }
            }
        }

        // Process actions
        if (isset($data['actions'])) {
            foreach ($data['actions'] as $index => $action) {
                $step->actions()->create([
                    'action_type' => $action['type'],
                    'label' => $action['label'],
                    'url_or_action' => $action['url'] ?? null,
                    'order' => $index + 1,
                ]);
            }
        }
    }

    protected function deleteExistingScreenshots(ManualStep $step): void
    {
        foreach ($step->screenshots as $screenshot) {
            if (Storage::disk('public')->exists($screenshot->screenshot_path)) {
                Storage::disk('public')->delete($screenshot->screenshot_path);
            }
        }
        $step->screenshots()->delete();
    }

    protected function reorderRemainingSteps(int $userManualId): void
    {
        $steps = ManualStep::where('user_manual_id', $userManualId)
            ->orderBy('step_number')
            ->get();

        foreach ($steps as $index => $step) {
            $step->update([
                'step_number' => $index + 1,
                'order' => $index + 1,
            ]);
        }
    }
}
