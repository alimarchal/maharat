<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['category_id']);

            // Add the new foreign key with cascade delete
            $table->foreign('category_id')
                ->references('id')
                ->on('product_categories')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop the cascade foreign key if rolling back
            $table->dropForeign(['category_id']);

            // Re-add the old foreign key without cascade delete
            $table->foreign('category_id')
                ->references('id')
                ->on('product_categories');
        });
    }
};

