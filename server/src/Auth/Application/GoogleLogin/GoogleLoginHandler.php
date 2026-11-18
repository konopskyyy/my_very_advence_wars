<?php

declare(strict_types=1);

namespace App\Auth\Application\GoogleLogin;

use App\Auth\Application\AuthResult;
use App\Auth\Application\Port\GoogleTokenVerifier;
use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Application\Port\TokenIssuer;
use App\Auth\Application\Refresh\RefreshTokenManager;
use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\InvalidEmailException;
use App\Auth\Domain\User\Exception\InvalidGoogleCredentialException;
use App\Auth\Domain\User\Exception\UnverifiedGoogleEmailException;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;

final readonly class GoogleLoginHandler
{
    public function __construct(
        private GoogleTokenVerifier $verifier,
        private UserRepositoryInterface $users,
        private PasswordHasher $passwordHasher,
        private TokenIssuer $tokenIssuer,
        private RefreshTokenManager $refreshTokens,
    ) {
    }

    public function __invoke(GoogleLoginCommand $command): AuthResult
    {
        $identity = $this->verifier->verify($command->credential);

        try {
            $email = Email::fromString($identity->email);
        } catch (InvalidEmailException) {
            throw InvalidGoogleCredentialException::create();
        }

        $user = $this->users->findByGoogleSub($identity->sub);

        if (null === $user) {
            $user = $this->users->findByEmail($email);

            if (null !== $user) {
                if (!$identity->hasAuthoritativeEmail()) {
                    throw UnverifiedGoogleEmailException::create();
                }

                $user->linkGoogle($identity->sub);
            } else {
                $user = User::forGoogle(
                    $email,
                    $identity->sub,
                    $this->passwordHasher->hash(bin2hex(random_bytes(32))),
                );
            }

            $this->users->save($user);
        }

        return new AuthResult(
            $user,
            $this->tokenIssuer->issue($user),
            $this->refreshTokens->issue($user),
        );
    }
}
