<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Response;

use App\Auth\Domain\User\User;

final readonly class UserResponse
{
    public function __construct(
        public int $id,
        public string $email,
        public string $createdAt,
    ) {
    }

    public static function fromUser(User $user): self
    {
        return new self(
            $user->id(),
            $user->email()->value(),
            $user->createdAt()->format(\DateTimeInterface::ATOM),
        );
    }
}
