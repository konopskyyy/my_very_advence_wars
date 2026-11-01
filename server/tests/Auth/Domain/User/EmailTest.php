<?php

declare(strict_types=1);

namespace App\Tests\Auth\Domain\User;

use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\InvalidEmailException;
use PHPUnit\Framework\TestCase;

final class EmailTest extends TestCase
{
    public function testNormalizesEmail(): void
    {
        self::assertSame('gracz@example.com', Email::fromString('  GRACZ@Example.COM ')->value());
    }

    public function testRejectsInvalidEmail(): void
    {
        $this->expectException(InvalidEmailException::class);

        Email::fromString('nie-email');
    }
}
