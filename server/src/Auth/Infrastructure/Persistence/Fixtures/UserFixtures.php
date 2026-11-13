<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Persistence\Fixtures;

use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\User;
use App\Auth\Domain\User\UserRepositoryInterface;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

final class UserFixtures extends Fixture
{
    public function __construct(
        private readonly PasswordHasher $passwordHasher,
        private readonly UserRepositoryInterface $users,
    ) {
    }

    #[\Override]
    public function load(ObjectManager $manager): void
    {
        $accounts = [
            ['email' => 'admin@example.com', 'password' => 'admin1234', 'roles' => ['ROLE_ADMIN']],
            ['email' => 'gracz@example.com', 'password' => 'gracz1234', 'roles' => []],
        ];

        foreach ($accounts as $account) {
            $email = Email::fromString($account['email']);

            if (null !== $this->users->findByEmail($email)) {
                continue;
            }

            $manager->persist(new User(
                $email,
                $this->passwordHasher->hash($account['password']),
                $account['roles'],
            ));
        }

        $manager->flush();
    }
}
