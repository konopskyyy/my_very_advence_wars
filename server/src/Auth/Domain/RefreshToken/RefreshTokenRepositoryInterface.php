<?php

declare(strict_types=1);

namespace App\Auth\Domain\RefreshToken;

interface RefreshTokenRepositoryInterface
{
    public function save(RefreshToken $token): void;

    public function findByHash(string $hash): ?RefreshToken;

    public function revokeFamily(string $familyId): void;
}
