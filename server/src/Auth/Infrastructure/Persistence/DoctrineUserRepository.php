<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Persistence;

use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\Exception\EmailAlreadyTakenException;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;

#[AsAlias(UserRepositoryInterface::class)]
final readonly class DoctrineUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[\Override]
    public function findById(int $id): ?User
    {
        return $this->entityManager->find(User::class, $id);
    }

    #[\Override]
    public function findByEmail(Email $email): ?User
    {
        return $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['email' => $email->value()]);
    }

    #[\Override]
    public function save(User $user): void
    {
        $this->entityManager->persist($user);

        try {
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            throw EmailAlreadyTakenException::forEmail($user->getUserIdentifier());
        }
    }
}
