<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use PHPUnit\Framework\Attributes\Test;

class RoleManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private string $baseUrl = '/api/v1';

    protected function setUp(): void
    {
        parent::setUp();

        // Create test permissions
        Permission::create(['name' => 'create_users', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit_users', 'guard_name' => 'web']);
        Permission::create(['name' => 'delete_users', 'guard_name' => 'web']);

        // Create admin user
        $this->admin = User::factory()->create();

        // Create admin role with all permissions
        $adminRole = Role::create(['name' => 'Admin', 'guard_name' => 'web']);
        $adminRole->givePermissionTo(Permission::all());
        $this->admin->assignRole($adminRole);
    }

    #[Test]
    public function it_can_list_all_roles(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson("{$this->baseUrl}/roles");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'guard_name',
                        'permissions',
                        'parent',
                        'children'
                    ]
                ]
            ]);
    }

    #[Test]
    public function it_can_create_a_new_role_with_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $roleData = [
            'name' => 'Manager',
            'permissions' => ['create_users', 'edit_users']
        ];

        $response = $this->postJson("{$this->baseUrl}/roles", $roleData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'guard_name',
                    'permissions'
                ]
            ]);

        $this->assertDatabaseHas('roles', [
            'name' => 'Manager'
        ]);
    }

    #[Test]
    public function it_can_update_a_role(): void
    {
        Sanctum::actingAs($this->admin);

        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);

        $updateData = [
            'name' => 'Senior Editor',
            'permissions' => ['create_users']
        ];

        $response = $this->putJson("{$this->baseUrl}/roles/{$role->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Role updated successfully',
                'data' => [
                    'name' => 'Senior Editor'
                ]
            ]);
    }

    #[Test]
    public function it_can_delete_a_role_and_orphan_children(): void
    {
        Sanctum::actingAs($this->admin);

        $parentRole = Role::create(['name' => 'Parent', 'guard_name' => 'web']);
        $childRole = Role::create([
            'name' => 'Child',
            'guard_name' => 'web',
            'parent_role_id' => $parentRole->id
        ]);

        $response = $this->deleteJson("{$this->baseUrl}/roles/{$parentRole->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Role deleted successfully']);

        $this->assertDatabaseHas('roles', [
            'id' => $childRole->id,
            'parent_role_id' => null
        ]);
    }

    #[Test]
    public function it_can_get_role_hierarchy(): void
    {
        Sanctum::actingAs($this->admin);

        $parentRole = Role::create(['name' => 'Director', 'guard_name' => 'web']);
        $childRole = Role::create([
            'name' => 'Manager',
            'guard_name' => 'web',
            'parent_role_id' => $parentRole->id
        ]);

        $response = $this->getJson("{$this->baseUrl}/roles/hierarchy");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'children'
                    ]
                ]
            ]);
    }

    #[Test]
    public function it_can_validate_role_creation_data(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson("{$this->baseUrl}/roles", [
            'name' => '',
            'permissions' => ['invalid_permission']
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'permissions.0']);
    }

    #[Test]
    public function it_prevents_duplicate_role_names(): void
    {
        Sanctum::actingAs($this->admin);

        Role::create(['name' => 'Manager', 'guard_name' => 'web']);

        $response = $this->postJson("{$this->baseUrl}/roles", [
            'name' => 'Manager'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }
}