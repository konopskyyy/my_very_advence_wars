<?php

declare(strict_types=1);

namespace App\Auth\Application\Port;

use App\Auth\Domain\User\User;

interface TokenIssuer
{
    public function issue(User $user): string;
}
