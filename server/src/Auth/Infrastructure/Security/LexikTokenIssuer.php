<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Security;

use App\Auth\Application\Port\TokenIssuer;
use App\Auth\Domain\User\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;

#[AsAlias(TokenIssuer::class)]
final readonly class LexikTokenIssuer implements TokenIssuer
{
    public function __construct(
        private JWTTokenManagerInterface $tokenManager,
    ) {
    }

    #[\Override]
    public function issue(User $user): string
    {
        return $this->tokenManager->create($user);
    }
}
