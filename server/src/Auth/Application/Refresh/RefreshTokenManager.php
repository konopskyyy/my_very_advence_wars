<?php

declare(strict_types=1);

namespace App\Auth\Application\Refresh;

use App\Auth\Application\AuthResult;
use App\Auth\Application\Port\TokenIssuer;
use App\Auth\Domain\RefreshToken\Exception\InvalidRefreshTokenException;
use App\Auth\Domain\RefreshToken\RefreshToken;
use App\Auth\Domain\RefreshToken\RefreshTokenRepositoryInterface;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;

final readonly class RefreshTokenManager
{
    private const TTL = '+30 days';

    public function __construct(
        private RefreshTokenRepositoryInterface $tokens,
        private UserRepositoryInterface $users,
        private TokenIssuer $tokenIssuer,
    ) {
    }

    public function issue(User $user, ?string $familyId = null): string
    {
        $raw = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $token = new RefreshToken(
            $user->id(),
            self::hash($raw),
            $familyId ?? bin2hex(random_bytes(32)),
            new \DateTimeImmutable(self::TTL),
        );
        $this->tokens->save($token);

        return $raw;
    }

    public function rotate(string $raw): AuthResult
    {
        $stored = $this->tokens->findByHash(self::hash($raw));

        if (null === $stored) {
            throw InvalidRefreshTokenException::create();
        }

        if (!$stored->isUsable()) {
            $this->tokens->revokeFamily($stored->familyId());
            throw InvalidRefreshTokenException::create();
        }

        $user = $this->users->findById($stored->userId());

        if (null === $user) {
            throw InvalidRefreshTokenException::create();
        }

        $stored->revoke();
        $this->tokens->save($stored);

        return new AuthResult(
            $user,
            $this->tokenIssuer->issue($user),
            $this->issue($user, $stored->familyId()),
        );
    }

    public function revoke(string $raw): void
    {
        $stored = $this->tokens->findByHash(self::hash($raw));

        if (null === $stored) {
            return;
        }

        if (null !== $stored->revokedAt()) {
            $this->tokens->revokeFamily($stored->familyId());

            return;
        }

        $stored->revoke();
        $this->tokens->save($stored);
    }

    private static function hash(string $raw): string
    {
        return hash('sha256', $raw);
    }
}
