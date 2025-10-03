<?php

return [
    App\Providers\AppServiceProvider::class,
    // Temporarily disabled to fix redirect loop
    // App\Providers\ScalaHostingServiceProvider::class,
    App\Providers\UserTrackingServiceProvider::class,
    App\Providers\PermissionServiceProvider::class,

];
