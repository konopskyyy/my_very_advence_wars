<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Security;

use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\InvalidEmailException;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\Exception\UserNotFoundException;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;

/**
 * @implements UserProviderInterface<User>
 */
final readonly class UserProvider implements UserProviderInterface
{
    public function __construct(
        private UserRepositoryInterface $users,
    ) {
    }

    #[\Override]
    public function loadUserByIdentifier(string $identifier): UserInterface
    {
        try {
            $email = Email::fromString($identifier);
        } catch (InvalidEmailException) {
            throw new UserNotFoundException();
        }

        return $this->users->findByEmail($email) ?? throw new UserNotFoundException();
    }

    #[\Override]
    public function refreshUser(UserInterface $user): UserInterface
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Unsupported user class "%s".', $user::class));
        }

        return $this->users->findById($user->id()) ?? throw new UserNotFoundException();
    }

    #[\Override]
    public function supportsClass(string $class): bool
    {
        return is_a($class, User::class, true);
    }
}
