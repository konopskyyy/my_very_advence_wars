<?php

declare(strict_types=1);

namespace App\Auth\Domain\User;

use App\Auth\Domain\User\Exception\InvalidEmailException;

final readonly class Email
{
    private function __construct(
        private string $value,
    ) {
    }

    public static function fromString(string $value): self
    {
        $normalized = strtolower(trim($value));

        if ('' === $normalized || false === filter_var($normalized, \FILTER_VALIDATE_EMAIL)) {
            throw new InvalidEmailException(sprintf('"%s" is not a valid e-mail address.', $value));
        }

        return new self($normalized);
    }

    public function value(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
