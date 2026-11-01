<?php

declare(strict_types=1);

namespace App\Auth\Domain\User;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;

    public function findByEmail(Email $email): ?User;

    public function save(User $user): void;
}
