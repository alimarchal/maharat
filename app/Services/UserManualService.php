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
            Log::info('Starting manual update', [
                'manual_id' => $manual->id,
                'data_keys' => array_keys($data),
                'has_steps' => isset($data['steps']),
                'step_count' => isset($data['steps']) ? count($data['steps']) : 0
            ]);

            // Update basic manual data
            $manual->update([
                'title' => $data['title'] ?? $manual->title,
                'slug' => $data['slug'] ?? $manual->slug,
                'video_path' => $data['video_path'] ?? $manual->video_path,
                'video_type' => $data['video_type'] ?? $manual->video_type,
                'is_active' => $data['is_active'] ?? $manual->is_active,
                'card_id' => $data['card_id'] ?? $manual->card_id,
            ]);

            if (isset($data['steps'])) {
                Log::info('Processing steps update', ['step_count' => count($data['steps'])]);
                
                // Get existing steps
                $existingSteps = $manual->steps()->get();
                
                // Update or create steps
                foreach ($data['steps'] as $index => $stepData) {
                    $stepNumber = $index + 1;
                    
                    // Find existing step with this number
                    $existingStep = $existingSteps->where('step_number', $stepNumber)->first();
                    
                    if ($existingStep) {
                        // Update existing step
                        $existingStep->update([
                            'title' => $stepData['title'],
                            'description' => $stepData['description'],
                            'action_type' => $stepData['action_type'] ?? null,
                            'order' => $stepNumber,
                            'is_active' => true,
                        ]);
                        
                        // Process step components
                        $this->processStepComponents($existingStep, $stepData);
                    } else {
                        // Create new step with explicit user_manual_id
                        $step = new ManualStep([
                            'user_manual_id' => $manual->id,
                            'step_number' => $stepNumber,
                            'title' => $stepData['title'],
                            'description' => $stepData['description'],
                            'action_type' => $stepData['action_type'] ?? null,
                            'order' => $stepNumber,
                            'is_active' => true,
                        ]);
                        
                        // Save the step first
                        $step->save();
                        
                        // Process step components
                        $this->processStepComponents($step, $stepData);
                    }
                }
                
                // Delete any steps that are no longer in the data
                $newStepNumbers = collect($data['steps'])->pluck('step_number')->toArray();
                $manual->steps()
                    ->whereNotIn('step_number', $newStepNumbers)
                    ->delete();
                
                Log::info('Steps update completed successfully');
            }

            Log::info('Manual update completed successfully', ['manual_id' => $manual->id]);

            return $manual->load(['steps.details', 'steps.screenshots', 'steps.actions']);
        });
    }

    protected function processSteps(UserManual $manual, array $steps): void
    {
        Log::info('Starting step processing', ['step_count' => count($steps)]);
        
        foreach ($steps as $index => $stepData) {
            Log::info('Processing step', ['index' => $index, 'data' => $stepData]);
            
            // Create new step with explicit user_manual_id
            $step = new ManualStep([
                'user_manual_id' => $manual->id,
                'step_number' => $index + 1,
                'title' => $stepData['title'],
                'description' => $stepData['description'],
                'action_type' => $stepData['action_type'] ?? null,
                'order' => $index + 1,
                'is_active' => true,
            ]);
            
            // Save the step first
            $step->save();

            Log::info('Step created', ['step_id' => $step->id]);

            // Process step details
            if (isset($stepData['details'])) {
                Log::info('Processing step details', ['detail_count' => count($stepData['details'])]);
                foreach ($stepData['details'] as $detailIndex => $detail) {
                    $step->details()->create([
                        'content' => $detail,
                        'order' => $detailIndex + 1,
                    ]);
                }
            }

            // Process screenshots
            if (isset($stepData['screenshots'])) {
                Log::info('Processing step screenshots', ['screenshot_count' => count($stepData['screenshots'])]);
                foreach ($stepData['screenshots'] as $screenshotIndex => $screenshot) {
                    if ($screenshot instanceof \Illuminate\Http\UploadedFile) {
                        $path = $screenshot->store('user-manuals/screenshots', 'public');

                        $step->screenshots()->create([
                            'screenshot_path' => $path,
                            'screenshot_url' => Storage::url($path),
                            'alt_text' => $stepData['screenshot_alts'][$screenshotIndex] ?? null,
                            'caption' => $stepData['screenshot_captions'][$screenshotIndex] ?? null,
                            'type' => 'image',
                            'order' => $screenshotIndex + 1,
                            'file_name' => $screenshot->getClientOriginalName(),
                            'mime_type' => $screenshot->getMimeType(),
                            'size' => $screenshot->getSize()
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
                Log::info('Processing step actions', ['action_count' => count($stepData['actions'])]);
                foreach ($stepData['actions'] as $actionIndex => $action) {
                    $actionType = $action['action_type'] ?? $action['type'] ?? 'click';
                    $style = $action['style'] ?? 'default';
                    $urlOrAction = '';
                    if (isset($action['url_or_action']) && !empty($action['url_or_action'])) {
                        $urlOrAction = $action['url_or_action'];
                    } elseif (isset($action['url']) && !empty($action['url'])) {
                        $urlOrAction = $action['url'];
                    }
                    
                    Log::info('Creating step action', [
                        'step_id' => $step->id,
                        'action_type' => $actionType,
                        'label' => $action['label'] ?? null,
                        'url_or_action' => $urlOrAction,
                        'style' => $style
                    ]);
                    
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
        Log::info('Step processing completed');
    }

    protected function processStepComponents(ManualStep $step, array $stepData): void
    {
        // Process step details
        if (isset($stepData['details'])) {
            Log::info('Processing step details', ['detail_count' => count($stepData['details'])]);
            $step->details()->delete();
            foreach ($stepData['details'] as $detailIndex => $detail) {
                $step->details()->create([
                    'content' => $detail,
                    'order' => $detailIndex + 1,
                ]);
            }
        }

        // Process screenshots
        if (isset($stepData['screenshots'])) {
            Log::info('Processing step screenshots', ['screenshot_count' => count($stepData['screenshots'])]);
            
            // Get existing screenshots
            $existingScreenshots = $step->screenshots()->get();
            
            // Process each screenshot
            foreach ($stepData['screenshots'] as $screenshotIndex => $screenshot) {
                Log::info('Processing screenshot', [
                    'index' => $screenshotIndex,
                    'type' => gettype($screenshot),
                    'is_uploaded_file' => $screenshot instanceof \Illuminate\Http\UploadedFile
                ]);
                
                if ($screenshot instanceof \Illuminate\Http\UploadedFile) {
                    // Delete existing screenshot at this position if it exists
                    $existingScreenshot = $existingScreenshots->where('order', $screenshotIndex + 1)->first();
                    if ($existingScreenshot) {
                        Storage::disk('public')->delete($existingScreenshot->screenshot_path);
                        $existingScreenshot->delete();
                    }

                    // Upload and create new screenshot
                    $path = $screenshot->store('user-manuals/screenshots', 'public');

                    $step->screenshots()->create([
                        'screenshot_path' => $path,
                        'screenshot_url' => Storage::url($path),
                        'alt_text' => $stepData['screenshot_alts'][$screenshotIndex] ?? null,
                        'caption' => $stepData['screenshot_captions'][$screenshotIndex] ?? null,
                        'type' => $stepData['screenshot_types'][$screenshotIndex] ?? 'image',
                        'order' => $screenshotIndex + 1,
                        'file_name' => $screenshot->getClientOriginalName(),
                        'mime_type' => $screenshot->getMimeType(),
                        'size' => $screenshot->getSize()
                    ]);
                    
                    Log::info('Screenshot uploaded', [
                        'step_id' => $step->id, 
                        'path' => $path, 
                        'order' => $screenshotIndex + 1
                    ]);
                } else if (is_string($screenshot) && !empty($screenshot)) {
                    // This is an existing screenshot path, just update its metadata
                    $existingScreenshot = $existingScreenshots->where('order', $screenshotIndex + 1)->first();
                    if ($existingScreenshot) {
                        $existingScreenshot->update([
                            'alt_text' => $stepData['screenshot_alts'][$screenshotIndex] ?? null,
                            'caption' => $stepData['screenshot_captions'][$screenshotIndex] ?? null,
                            'type' => $stepData['screenshot_types'][$screenshotIndex] ?? 'image',
                            'order' => $screenshotIndex + 1,
                        ]);
                    }
                } else {
                    Log::info('Screenshot not processed - not an uploaded file or string', [
                        'screenshot' => $screenshot,
                        'type' => gettype($screenshot)
                    ]);
                }
            }
        }

        // Process actions
        if (isset($stepData['actions'])) {
            Log::info('Processing step actions', ['action_count' => count($stepData['actions'])]);
            $step->actions()->delete();
            foreach ($stepData['actions'] as $actionIndex => $action) {
                $actionType = $action['action_type'] ?? $action['type'] ?? 'click';
                $style = $action['style'] ?? 'default';
                $urlOrAction = '';
                if (isset($action['url_or_action']) && !empty($action['url_or_action'])) {
                    $urlOrAction = $action['url_or_action'];
                } elseif (isset($action['url']) && !empty($action['url'])) {
                    $urlOrAction = $action['url'];
                }
                
                Log::info('Creating step action', [
                    'step_id' => $step->id,
                    'action_type' => $actionType,
                    'label' => $action['label'] ?? null,
                    'url_or_action' => $urlOrAction,
                    'style' => $style
                ]);
                
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

    protected function deleteExistingScreenshots(ManualStep $step): void
    {
        // Implementation of deleteExistingScreenshots method
    }
}
