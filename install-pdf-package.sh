#!/bin/bash

# Install Laravel DomPDF package
composer require barryvdh/laravel-dompdf

# Publish configuration files
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"

# Create required directories
mkdir -p storage/app/public/balance_sheets
php artisan storage:link

echo "PDF package installed successfully!" 