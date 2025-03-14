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
