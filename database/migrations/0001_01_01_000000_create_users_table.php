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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('firstname')->nullable();
            $table->string('lastname')->nullable();
            $table->string('name');  // Full Name
            $table->string('username')->unique()->nullable(); // For separate username if different from email
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamp('email_verified_at')->nullable();

            // Additional User Information
            $table->string('title')->nullable();           // Title (Mr, Mrs, etc.)
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

            // Relationships (Laravel 11 style - explicit foreign keys)
//            $table->foreignId('company_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
//            $table->foreignId('department_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
//            $table->foreignId('branch_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();

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

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }


    /*
    erDiagram
    users ||--o{ personal_access_tokens : has
    users ||--o{ activity_logs : creates
    users ||--o{ model_has_roles : has
    users ||--o{ model_has_permissions : has
    users ||--o{ currencies : "created by"
    users ||--o{ currencies : "updated by"
    users }|--|| companies : "belongs to"
    users }|--|| departments : "belongs to"
    users }|--|| branches : "belongs to"

    companies ||--o{ departments : has
    companies ||--o{ branches : has
    companies ||--o{ activity_logs : has
    companies ||--o{ smtp_settings : has
    companies ||--o{ workflow_setups : has
    companies ||--o{ system_alert_configurations : has
    companies ||--o{ levels : has

    workflow_setups ||--o{ workflow_levels : has
    workflow_levels }|--|| levels : contains

    roles ||--o{ model_has_roles : has
    roles ||--o{ role_has_permissions : has
    permissions ||--o{ role_has_permissions : has
    permissions ||--o{ model_has_permissions : has

    countries }|--|| currencies : uses

    users {
        id bigint PK
        firstname string
        lastname string
        name string
        email string "unique"
        password string
        language string
        is_salesman_linked boolean
        company_id bigint FK
        department_id bigint FK
        branch_id bigint FK
    }

    companies {
        id bigint PK
        name string
        name_ar string
        email string
        fiscal_year_start date
        fiscal_year_end date
        zatca_environment enum
        currency string
        timezone string
    }

    workflow_setups {
        id bigint PK
        name string
        type string
        workflow_steps json
        is_active boolean
        company_id bigint FK
    }

    levels {
        id bigint PK
        name string
        level_code integer "unique"
        level_order integer
        users json
        permissions json
        company_id bigint FK
    }

    activity_logs {
        id bigint PK
        page string
        action string
        description text
        ip_address string
        user_id bigint FK
        company_id bigint FK
        old_values json
        new_values json
    }

    countries {
        id bigint PK
        name string
        code string "unique"
        phone_code string
        currency_id bigint FK
        is_active boolean
    }
     */
};
