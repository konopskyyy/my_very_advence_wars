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
            'admin@example.com' => 'admin1234',
            'gracz@example.com' => 'gracz1234',
        ];

        foreach ($accounts as $email => $password) {
            $email = Email::fromString($email);

            if (null !== $this->users->findByEmail($email)) {
                continue;
            }

            $manager->persist(new User($email, $this->passwordHasher->hash($password)));
        }

        $manager->flush();
    }
}
