<?php

declare(strict_types=1);

namespace App\Auth\Application\Google;

final readonly class GoogleIdentity
{
    public function __construct(
        public string $sub,
        public string $email,
        public bool $emailVerified,
        public ?string $hostedDomain = null,
    ) {
    }

    public function hasAuthoritativeEmail(): bool
    {
        if (!$this->emailVerified) {
            return false;
        }

        return null !== $this->hostedDomain || str_ends_with(strtolower($this->email), '@gmail.com');
    }
}
