<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * Class UserTest
 *
 * This test class handles all User CRUD operations including:
 * - Listing users (with filters and pagination)
 * - Creating new users
 * - Viewing user details
 * - Updating user information
 * - Deleting users
 * - Authorization checks
 */
class UserTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private string $token;
    private string $apiEndpoint = '/api/v1/users';

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    #[Test]
    public function authenticated_user_can_list_users()
    {
        User::factory()->count(5)->create();

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson($this->apiEndpoint);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'created_at',
                        'updated_at',
                    ]
                ],
                'meta' => [
                    'total',
                    'current_page',
                    'per_page',
                    'last_page'
                ]
            ]);
    }

    #[Test]
    public function authenticated_user_can_create_new_user()
    {
        $userData = [
            'firstname' => 'Jane',
            'lastname' => 'Doe',
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'mobile' => '1234567890',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->postJson($this->apiEndpoint, $userData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'mobile',
                    'created_at',
                    'updated_at',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'name' => 'Jane Doe',
            'mobile' => '1234567890',
        ]);
    }

    #[Test]
    public function authenticated_user_can_view_specific_user()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("{$this->apiEndpoint}/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'created_at',
                    'updated_at',
                ]
            ]);
    }

    #[Test]
    public function authenticated_user_can_update_user()
    {
        $updateData = [
            'name' => 'Updated Name',
            'mobile' => '9876543210',
        ];

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->putJson("{$this->apiEndpoint}/{$this->user->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'mobile',
                    'created_at',
                    'updated_at',
                ]
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Updated Name',
            'mobile' => '9876543210',
        ]);
    }

    #[Test]
    public function authenticated_user_can_delete_user()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->deleteJson("{$this->apiEndpoint}/{$this->user->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $this->user->id]);
    }

    #[Test]
    public function users_list_can_be_filtered_and_sorted()
    {
        User::factory()->count(5)->create();

        // Test search
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("{$this->apiEndpoint}?search={$this->user->name}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $this->user->name]);

        // Test sorting
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("{$this->apiEndpoint}?sort=name&order=desc");

        $response->assertStatus(200);
    }

    #[Test]
    public function unauthenticated_user_cannot_access_api()
    {
        $response = $this->getJson($this->apiEndpoint);
        $response->assertStatus(401);
    }

    #[Test]
    public function user_response_includes_roles_and_permissions()
    {
        // Create a role and permission
        $role = Role::create(['name' => 'editor']);
        $permission = Permission::create(['name' => 'edit articles']);

        // Assign role and permission to user
        $role->givePermissionTo($permission);
        $this->user->assignRole('editor');

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->getJson("{$this->apiEndpoint}/{$this->user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'permissions',
                    'created_at',
                    'updated_at',
                ]
            ])
            ->assertJsonFragment([
                'roles' => ['editor'],
                'permissions' => ['edit articles']
            ]);
    }

}