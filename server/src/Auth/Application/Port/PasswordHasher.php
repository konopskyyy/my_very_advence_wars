<?php

declare(strict_types=1);

namespace App\Auth\Application\Port;

interface PasswordHasher
{
    public function hash(string $plainPassword): string;

    public function verify(string $passwordHash, string $plainPassword): bool;
}
