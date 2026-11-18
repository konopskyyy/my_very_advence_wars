<?php

declare(strict_types=1);

namespace App\Auth\Application\Port;

use App\Auth\Application\Google\GoogleIdentity;

interface GoogleTokenVerifier
{
    public function verify(string $credential): GoogleIdentity;
}
