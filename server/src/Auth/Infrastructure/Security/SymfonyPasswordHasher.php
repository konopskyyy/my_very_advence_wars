<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Security;

use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Domain\User\User;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;

#[AsAlias(PasswordHasher::class)]
final readonly class SymfonyPasswordHasher implements PasswordHasher
{
    public function __construct(
        private PasswordHasherFactoryInterface $passwordHashers,
    ) {
    }

    #[\Override]
    public function hash(string $plainPassword): string
    {
        return $this->passwordHashers->getPasswordHasher(User::class)->hash($plainPassword);
    }

    #[\Override]
    public function verify(string $passwordHash, string $plainPassword): bool
    {
        return $this->passwordHashers->getPasswordHasher(User::class)->verify($passwordHash, $plainPassword);
    }
}
