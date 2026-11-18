<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class GoogleLoginRequest
{
    public function __construct(
        #[Assert\NotBlank]
        public string $credential,
    ) {
    }
}
