<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Response;

use App\Auth\Application\AuthResult;

final readonly class AuthResponse
{
    public function __construct(
        public string $token,
        public string $refreshToken,
        public UserResponse $user,
    ) {
    }

    public static function fromResult(AuthResult $result): self
    {
        return new self($result->token, $result->refreshToken, UserResponse::fromUser($result->user));
    }
}
