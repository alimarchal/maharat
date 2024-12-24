<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

/**
 * Class AuthTest
 *
 * This test class handles all authentication-related tests including:
 * - User registration
 * - User login
 * - User logout
 * - Invalid credentials handling
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private string $authEndpoint = '/api/login';
    private string $registerEndpoint = '/api/register';
    private string $logoutEndpoint = '/api/logout';

    /**
     * Test user registration with valid data
     */
    #[Test]
    public function user_can_register()
    {
        $userData = [
            'firstname' => 'John',
            'lastname' => 'Doe',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson($this->registerEndpoint, $userData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'created_at',
                    'updated_at',
                ],
                'token'
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    /**
     * Test user registration validation
     */
    #[Test]
    public function user_cannot_register_with_invalid_data()
    {
        $response = $this->postJson($this->registerEndpoint, [
            'email' => 'not-an-email',
            'password' => 'short',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password', 'name']);
    }

    /**
     * Test successful login
     */
    #[Test]
    public function user_can_login_with_correct_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson($this->authEndpoint, [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
                'token'
            ]);
    }

    /**
     * Test login validation
     */
    #[Test]
    public function user_cannot_login_with_incorrect_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson($this->authEndpoint, [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test user logout
     */
    #[Test]
    public function user_can_logout()
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson($this->logoutEndpoint);

        $response->assertStatus(200);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}