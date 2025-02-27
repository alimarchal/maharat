<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('rfq_items', function (Blueprint $table) {
            // First create the new column
            $table->unsignedBigInteger('brand_id')->nullable()->after('brand');
            
            // Add foreign key constraint
            $table->foreign('brand_id')->references('id')->on('brands');
            
            // Drop the old column
            $table->dropColumn('brand');
        });
    }

    public function down()
    {
        Schema::table('rfq_items', function (Blueprint $table) {
            $table->string('brand')->nullable()->after('brand_id');
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });
    }
}; 