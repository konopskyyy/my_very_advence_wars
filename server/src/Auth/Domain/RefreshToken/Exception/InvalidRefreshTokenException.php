<?php

declare(strict_types=1);

namespace App\Auth\Domain\RefreshToken\Exception;

final class InvalidRefreshTokenException extends \RuntimeException
{
    public static function create(): self
    {
        return new self('Invalid refresh token.');
    }
}
