<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // Drop the existing foreign key
            $table->dropForeign(['product_id']);

            // Recreate foreign key with cascade delete
            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // Drop the cascade foreign key if rolling back
            $table->dropForeign(['product_id']);

            // Re-add the old foreign key without cascade delete
            $table->foreign('product_id')
                ->references('id')
                ->on('products');
        });
    }
};
