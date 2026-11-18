<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RefreshRequest
{
    public function __construct(
        #[Assert\NotBlank]
        public string $refreshToken,
    ) {
    }
}
