<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Response;

use App\Auth\Application\AuthResult;

final readonly class AuthResponse
{
    public function __construct(
        public string $token,
        public UserResponse $user,
    ) {
    }

    public static function fromResult(AuthResult $result): self
    {
        return new self($result->token, UserResponse::fromUser($result->user));
    }
}
