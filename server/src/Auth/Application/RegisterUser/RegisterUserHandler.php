<?php

declare(strict_types=1);

namespace App\Auth\Application\RegisterUser;

use App\Auth\Application\AuthResult;
use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Application\Port\TokenIssuer;
use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\EmailAlreadyTakenException;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;

final readonly class RegisterUserHandler
{
    public function __construct(
        private UserRepositoryInterface $users,
        private PasswordHasher $passwordHasher,
        private TokenIssuer $tokenIssuer,
    ) {
    }

    public function __invoke(RegisterUserCommand $command): AuthResult
    {
        $email = Email::fromString($command->email);

        if (null !== $this->users->findByEmail($email)) {
            throw EmailAlreadyTakenException::forEmail($email->value());
        }

        $user = new User($email, $this->passwordHasher->hash($command->password));
        $token = $this->tokenIssuer->issue($user);
        $this->users->save($user);

        return new AuthResult($user, $token);
    }
}
