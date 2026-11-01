<?php

declare(strict_types=1);

namespace App\Auth\Application\LoginUser;

use App\Auth\Application\AuthResult;
use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Application\Port\TokenIssuer;
use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\InvalidCredentialsException;
use App\Auth\Domain\User\Exception\InvalidEmailException;
use App\Auth\Domain\User\UserRepositoryInterface;

final readonly class LoginUserHandler
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasher $passwordHasher,
        private TokenIssuer $tokenIssuer,
    ) {
    }

    public function __invoke(LoginUserCommand $command): AuthResult
    {
        try {
            $email = Email::fromString($command->email);
        } catch (InvalidEmailException) {
            throw InvalidCredentialsException::create();
        }

        $user = $this->users->findByEmail($email);

        if (null === $user || !$this->passwordHasher->verify($user->getPassword(), $command->password)) {
            throw InvalidCredentialsException::create();
        }

        return new AuthResult($user, $this->tokenIssuer->issue($user));
    }
}
