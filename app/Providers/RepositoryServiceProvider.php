<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\UserManualRepositoryInterface;
use App\Repositories\UserManualRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->bind(
            UserManualRepositoryInterface::class,
            UserManualRepository::class
        );
    }
}
