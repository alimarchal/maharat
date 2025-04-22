<?php

namespace App\Services;

use App\Models\UserManual;
use App\Models\ManualStep;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UserManualService
{
    public function createManual(array $data): UserManual
    {
        return DB::transaction(function () use ($data) {
            Log::info('Creating user manual', ['data' => $data]);

            // Handle video upload
            $videoPath = null;
            $videoType = null;

            if (isset($data['video']) && $data['video'] instanceof \Illuminate\Http\UploadedFile) {
                $video = $data['video'];
                $videoPath = $video->store('user-manuals/videos', 'public');
                $videoType = $video->getClientMimeType();

                Log::info('Video uploaded', ['path' => $videoPath, 'type' => $videoType]);
            }

            $manual = UserManual::create([
                'title' => $data['title'],
                'slug' => Str::slug($data['title']),
                'video_path' => $videoPath,
                'video_type' => $videoType,
                'created_by' => auth()->id(),
                'is_active' => $data['is_active'] ?? true,
            ]);

            $this->processSteps($manual, $data['steps'] ?? []);

            Log::info('User manual created successfully', ['manual_id' => $manual->id]);

            return $manual->load(['steps.details', 'steps.screenshots', 'steps.actions']);
        });
    }

    public function updateManual(UserManual $manual, array $data): UserManual
    {
        return DB::transaction(function () use ($manual, $data) {
            Log::info('Updating user manual', ['manual_id' => $manual->id, 'data' => $data]);

            // Handle video update
            if (isset($data['video']) && $data['video'] instanceof \Illuminate\Http\UploadedFile) {
                // Delete old video if exists
                if ($manual->video_path && Storage::disk('public')->exists($manual->video_path)) {
                    Storage::disk('public')->delete($manual->video_path);
                }

                $video = $data['video'];
                $videoPath = $video->store('user-manuals/videos', 'public');
                $videoType = $video->getClientMimeType();

                $manual->video_path = $videoPath;
                $manual->video_type = $videoType;

                Log::info('Video updated', ['path' => $videoPath, 'type' => $videoType]);
            }

            $manual->update([
                'title' => $data['title'] ?? $manual->title,
                'slug' => isset($data['title']) ? Str::slug($data['title']) : $manual->slug,
                'updated_by' => auth()->id(),
                'is_active' => $data['is_active'] ?? $manual->is_active,
            ]);

            if (isset($data['steps'])) {
                // Delete existing steps
                $manual->steps()->delete();

                // Create new steps
                $this->processSteps($manual, $data['steps']);
            }

            Log::info('User manual updated successfully', ['manual_id' => $manual->id]);

            return $manual->load(['steps.details', 'steps.screenshots', 'steps.actions']);
        });
    }
    protected function processSteps(UserManual $manual, array $steps): void
    {
        foreach ($steps as $index => $stepData) {
            $step = $manual->steps()->create([
                'step_number' => $index + 1,
                'title' => $stepData['title'],
                'description' => $stepData['description'],
                'action_type' => $stepData['action_type'] ?? null,
                'order' => $index + 1,
                'is_active' => true,
            ]);

            // Process step details
            if (isset($stepData['details'])) {
                foreach ($stepData['details'] as $detailIndex => $detail) {
                    $step->details()->create([
                        'content' => $detail,
                        'order' => $detailIndex + 1,
                    ]);
                }
            }

            // Process screenshots
            if (isset($stepData['screenshots'])) {
                foreach ($stepData['screenshots'] as $screenshotIndex => $screenshot) {
                    if ($screenshot instanceof \Illuminate\Http\UploadedFile) {
                        $path = $screenshot->store('user-manuals/screenshots', 'public');

                        $step->screenshots()->create([
                            'screenshot_path' => $path,
                            'alt_text' => $stepData['screenshot_alts'][$screenshotIndex] ?? null,
                            'caption' => $stepData['screenshot_captions'][$screenshotIndex] ?? null,
                            'order' => $screenshotIndex + 1,
                        ]);
                    }
                }
            }

            // Process actions
            if (isset($stepData['actions'])) {
                foreach ($stepData['actions'] as $actionIndex => $action) {
                    $step->actions()->create([
                        'action_type' => $action['type'],
                        'label' => $action['label'],
                        'url_or_action' => $action['url'] ?? null,
                        'order' => $actionIndex + 1,
                    ]);
                }
            }
        }
    }
}
