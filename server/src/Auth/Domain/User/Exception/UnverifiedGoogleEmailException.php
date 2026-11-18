<?php

declare(strict_types=1);

namespace App\Auth\Domain\User\Exception;

final class UnverifiedGoogleEmailException extends \RuntimeException
{
    public static function create(): self
    {
        return new self('Google email cannot be verified.');
    }
}
