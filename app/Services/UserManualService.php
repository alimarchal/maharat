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
            Log::info('Creating user manual with data', [
                'title' => $data['title'],
                'video_path' => $data['video_path'] ?? null,
                'video_type' => $data['video_type'] ?? null,
                'card_id' => $data['card_id'] ?? null
            ]);

            // Handle video upload
            $videoPath = null;
            $videoType = null;

            if (isset($data['video']) && $data['video'] instanceof \Illuminate\Http\UploadedFile) {
                $video = $data['video'];
                $videoPath = $video->store('user-manuals/videos', 'public');
                $videoType = $video->getClientMimeType();

                Log::info('Video uploaded', ['path' => $videoPath, 'type' => $videoType]);
            }

            // Create a unique slug if needed
            $slug = $data['slug'] ?? Str::slug($data['title']);
            $originalSlug = $slug;
            $counter = 1;
            
            // Check if slug exists and increment counter until we find a unique one
            while (UserManual::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            // If we have a video_path passed directly, use it instead of uploaded file
            $finalVideoPath = $data['video_path'] ?? $videoPath;
            $finalVideoType = $data['video_type'] ?? $videoType;

            // Handle card_id conversion
            $cardId = null;
            if (isset($data['card_id'])) {
                if (is_numeric($data['card_id'])) {
                    $cardId = (int)$data['card_id'];
                } else if (is_string($data['card_id']) && is_numeric($data['card_id'])) {
                    $cardId = (int)$data['card_id'];
                }
            }

            $manual = UserManual::create([
                'title' => $data['title'],
                'slug' => $slug,
                'video_path' => $finalVideoPath,
                'video_type' => $finalVideoType,
                'created_by' => auth()->id(),
                'is_active' => $data['is_active'] ?? true,
                'card_id' => $cardId
            ]);
            
            Log::info('User manual created', [
                'id' => $manual->id,
                'title' => $manual->title,
                'video_path' => $manual->video_path,
                'video_type' => $manual->video_type,
                'card_id' => $manual->card_id
            ]);

            $this->processSteps($manual, $data['steps'] ?? []);

            Log::info('User manual created successfully', ['manual_id' => $manual->id]);

            return $manual->load(['steps.details', 'steps.screenshots', 'steps.actions']);
        });
    }

    public function updateManual(UserManual $manual, array $data): UserManual
    {
        return DB::transaction(function () use ($manual, $data) {
            Log::info('Updating user manual', [
                'manual_id' => $manual->id, 
                'data' => [
                    'title' => $data['title'] ?? $manual->title,
                    'video_path' => $data['video_path'] ?? $manual->video_path,
                    'video_type' => $data['video_type'] ?? $manual->video_type,
                    'card_id' => $data['card_id'] ?? $manual->card_id
                ]
            ]);

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

            // Handle slug uniqueness for updates
            $slug = $data['slug'] ?? (isset($data['title']) ? Str::slug($data['title']) : $manual->slug);
            
            // Only check for uniqueness if the slug is different from the current one
            if ($slug !== $manual->slug) {
                $originalSlug = $slug;
                $counter = 1;
                
                // Check if slug exists and increment counter until we find a unique one
                while (UserManual::where('slug', $slug)->where('id', '!=', $manual->id)->exists()) {
                    $slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }

            // Handle video path properly - ensure it's stored correctly
            $videoPath = $data['video_path'] ?? $manual->video_path;
            if ($videoPath && !empty($videoPath)) {
                // If it's a URL (starts with http), store as is, otherwise ensure proper storage path
                if (!Str::startsWith($videoPath, ['http://', 'https://']) && !Str::startsWith($videoPath, 'storage/')) {
                    $videoPath = trim($videoPath);
                }
            }

            // Handle card_id conversion
            $cardId = $manual->card_id;
            if (isset($data['card_id'])) {
                if (is_numeric($data['card_id'])) {
                    $cardId = (int)$data['card_id'];
                } else if (is_string($data['card_id']) && is_numeric($data['card_id'])) {
                    $cardId = (int)$data['card_id'];
                }
            }

            $manual->update([
                'title' => $data['title'] ?? $manual->title,
                'slug' => $slug,
                'video_path' => $videoPath,
                'video_type' => $data['video_type'] ?? $manual->video_type,
                'updated_by' => auth()->id(),
                'is_active' => $data['is_active'] ?? $manual->is_active,
                'card_id' => $cardId
            ]);
            
            Log::info('User manual updated with values', [
                'id' => $manual->id,
                'title' => $manual->title,
                'video_path' => $manual->video_path,
                'video_type' => $manual->video_type,
                'card_id' => $manual->card_id
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
        Log::info('Processing steps data', ['step_count' => count($steps)]);
        
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
                        
                        Log::info('Screenshot uploaded', [
                            'step_id' => $step->id, 
                            'path' => $path, 
                            'order' => $screenshotIndex + 1
                        ]);
                    }
                }
            }

            // Process actions
            if (isset($stepData['actions'])) {
                foreach ($stepData['actions'] as $actionIndex => $action) {
                    // Ensure we have an action type
                    $actionType = $action['action_type'] ?? $action['type'] ?? 'click';
                    
                    // Ensure we have a style, defaulting to "default" if none provided
                    $style = $action['style'] ?? 'default';
                    
                    // Ensure url_or_action is set and clean it up if needed
                    $urlOrAction = '';
                    if (isset($action['url_or_action']) && !empty($action['url_or_action'])) {
                        $urlOrAction = $action['url_or_action'];
                    } elseif (isset($action['url']) && !empty($action['url'])) {
                        $urlOrAction = $action['url'];
                    }
                    
                    // Log the action creation for debugging
                    Log::info('Creating step action', [
                        'step_id' => $step->id,
                        'action_type' => $actionType,
                        'label' => $action['label'] ?? null,
                        'url_or_action' => $urlOrAction,
                        'style' => $style
                    ]);
                    
                    // Create the action with all necessary fields
                    $step->actions()->create([
                        'action_type' => $actionType,
                        'label' => $action['label'] ?? null,
                        'url_or_action' => $urlOrAction,
                        'style' => $style,
                        'order' => $actionIndex + 1,
                    ]);
                }
            }
        }
    }
}
