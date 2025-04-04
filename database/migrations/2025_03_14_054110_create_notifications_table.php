<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        Schema::create('notification_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');          // e.g., 'RFQ document', 'Quotations document'
            $table->string('key')->unique(); // e.g., 'rfq_document', 'quotations_document'
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('notification_channels', function (Blueprint $table) {
            $table->id();
            $table->string('name');          // e.g., 'System', 'Email', 'SMS'
            $table->string('key')->unique(); // e.g., 'system', 'email', 'sms'
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });


        Schema::create('user_notification_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('notification_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('notification_channel_id')->constrained()->onDelete('cascade');
            $table->boolean('is_user')->nullable()->default(false);
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            // Composite unique key to prevent duplicates
            $table->unique(['user_id', 'notification_type_id', 'notification_channel_id'], 'user_notification_setting_unique');
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->char('id', 36)->comment("Its hash it will created by auto using api")->primary();
            $table->string('type')->comment("Channel: When calling api you have to send request  type: system_alert or type: sms");
            // morphs is polymorphism relationship it's store auto Laravel Model App\Models\User api storing user id
            $table->morphs('notifiable');
            $table->text('data')->comment('data in json any example available in postman');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
