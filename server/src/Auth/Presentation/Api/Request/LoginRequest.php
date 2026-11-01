<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class LoginRequest
{
    public function __construct(
        #[Assert\NotBlank]
        public string $email,
        #[Assert\NotBlank]
        public string $password,
    ) {
    }
}
