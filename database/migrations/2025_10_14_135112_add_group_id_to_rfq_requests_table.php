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
        Schema::table('rfq_requests', function (Blueprint $table) {
            $table->string('group_id')->nullable()->after('id')->index();
            $table->text('group_description')->nullable()->after('group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rfq_requests', function (Blueprint $table) {
            $table->dropColumn(['group_id', 'group_description']);
        });
    }
};
