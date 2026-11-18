<?php

declare(strict_types=1);

namespace App\Auth\Application\GoogleLogin;

final readonly class GoogleLoginCommand
{
    public function __construct(
        public string $credential,
    ) {
    }
}
