<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;

class UserHierarchyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $director;
    private User $manager;
    private User $supervisor;
    private string $baseUrl = '/api/v1';

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles with hierarchy
        $adminRole = Role::create(['name' => 'Admin', 'guard_name' => 'web']);
        $directorRole = Role::create(['name' => 'Director', 'guard_name' => 'web', 'parent_role_id' => $adminRole->id]);
        $managerRole = Role::create(['name' => 'Manager', 'guard_name' => 'web', 'parent_role_id' => $directorRole->id]);
        $supervisorRole = Role::create(['name' => 'Supervisor', 'guard_name' => 'web', 'parent_role_id' => $managerRole->id]);

        // Create users and assign roles
        $this->admin = User::factory()->create(['email' => 'admin@example.com']);
        $this->admin->assignRole($adminRole);

        $this->director = User::factory()->create(['email' => 'director@example.com']);
        $this->director->assignRole($directorRole);

        $this->manager = User::factory()->create(['email' => 'manager@example.com']);
        $this->manager->assignRole($managerRole);

        $this->supervisor = User::factory()->create(['email' => 'supervisor@example.com']);
        $this->supervisor->assignRole($supervisorRole);
    }

    #[Test]
    public function it_can_get_hierarchy_for_authenticated_user(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("{$this->baseUrl}/users/hierarchy");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'children' => [
                        '*' => [
                            'id',
                            'name',
                            'email',
                            'roles',
                            'children'
                        ]
                    ]
                ]
            ])
            ->assertJson([
                'data' => [
                    'email' => 'admin@example.com',
                    'children' => [
                        [
                            'email' => 'director@example.com',
                            'children' => [
                                [
                                    'email' => 'manager@example.com',
                                    'children' => [
                                        [
                                            'email' => 'supervisor@example.com'
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]);
    }

    #[Test]
    public function it_can_get_hierarchy_for_specific_user(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("{$this->baseUrl}/users/hierarchy/{$this->director->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'director@example.com')
            ->assertJsonCount(1, 'data.children')
            ->assertJsonPath('data.children.0.email', 'manager@example.com');
    }

    #[Test]
    public function it_returns_empty_children_for_leaf_user(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("{$this->baseUrl}/users/hierarchy/{$this->supervisor->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.email', 'supervisor@example.com')
            ->assertJsonCount(0, 'data.children');
    }

    #[Test]
    public function it_requires_authentication(): void
    {
        $response = $this->getJson("{$this->baseUrl}/users/hierarchy");
        $response->assertStatus(401);
    }
} 