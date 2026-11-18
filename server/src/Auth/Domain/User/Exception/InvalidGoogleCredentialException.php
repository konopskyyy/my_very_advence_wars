<?php

declare(strict_types=1);

namespace App\Auth\Domain\User\Exception;

final class InvalidGoogleCredentialException extends \RuntimeException
{
    public static function create(): self
    {
        return new self('Invalid Google credential.');
    }
}
