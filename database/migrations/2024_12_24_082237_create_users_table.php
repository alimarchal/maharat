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
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();
                $table->unsignedInteger('hierarchy_level')->nullable()->default(null);
                $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete();
                $table->foreignId('company_id')->nullable()->constrained('companies')->cascadeOnUpdate()->nullOnDelete();
                $table->foreignId('department_id')->nullable()->constrained('departments')->cascadeOnUpdate()->nullOnDelete();
                $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnUpdate()->nullOnDelete();
                $table->string('firstname')->nullable();
                $table->string('lastname')->nullable();
                $table->string('name');  // Full Name
                $table->string('username')->unique()->nullable(); // For separate username if different from email
                $table->string('email')->unique();
                $table->string('password');
                $table->timestamp('email_verified_at')->nullable();

                // Additional User Information
                $table->string('title')->nullable();           // Title (Mr, Mrs, etc.)
                //$table->string('designation')->nullable();

                $table->string('landline')->nullable();        // Landline phone number
                $table->string('mobile')->nullable();          // Mobile phone number
                $table->string('language')->nullable();        // Preferred language
                $table->string('favourite_module')->nullable(); // User's preferred module

                // User Settings & Preferences
                $table->boolean('enable_otp')->default(false); // Two-factor authentication setting
                $table->string('is_salesman_linked')->nullable(); // Salesman association flag
                $table->integer('login_id')->nullable();       // System login ID (e.g., 2000028064)

                // Security & Session Management
                $table->string('api_token', 80)->nullable()->unique(); // API authentication token
                $table->boolean('is_active')->default(true);   // Account status
                $table->boolean('is_admin')->default(false);   // Account status
                $table->timestamp('last_login_at')->nullable(); // Last login timestamp
                $table->string('last_login_ip')->nullable();   // Last login IP address

                $table->string('attachment')->nullable();
                $table->rememberToken();
                $table->timestamps();
                $table->softDeletes();
            });

            Schema::create('password_reset_tokens', function (Blueprint $table) {
                $table->string('email')->primary();
                $table->string('token');
                $table->timestamp('created_at')->nullable();
            });

            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
