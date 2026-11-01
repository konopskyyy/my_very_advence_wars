<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RegisterRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Email(normalizer: 'trim')]
        #[Assert\Length(max: 180)]
        public string $email,
        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 72)]
        public string $password,
    ) {
    }
}
