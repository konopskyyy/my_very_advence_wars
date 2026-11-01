<?php

declare(strict_types=1);

namespace App\Auth\Application;

use App\Auth\Domain\User\User;

final readonly class AuthResult
{
    public function __construct(
        public User $user,
        public string $token,
    ) {
    }
}
