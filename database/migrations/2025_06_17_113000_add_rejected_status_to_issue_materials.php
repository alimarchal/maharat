<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        DB::statement("ALTER TABLE issue_materials MODIFY COLUMN status ENUM('Pending', 'Issue Material', 'Rejected') DEFAULT 'Pending'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE issue_materials MODIFY COLUMN status ENUM('Pending', 'Issue Material') DEFAULT 'Pending'");
    }
};