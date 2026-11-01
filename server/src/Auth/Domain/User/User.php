<?php

declare(strict_types=1);

namespace App\Auth\Domain\User;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity]
#[ORM\Table(name: 'app_user')]
#[ORM\UniqueConstraint(name: 'uniq_app_user_email', columns: ['email'])]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180)]
    private string $email;

    #[ORM\Column(name: 'password_hash', length: 255)]
    private string $passwordHash;

    /**
     * @var list<string>
     */
    #[ORM\Column]
    private array $roles = [];

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    /**
     * @param list<string> $roles
     */
    public function __construct(Email $email, string $passwordHash, array $roles = ['ROLE_USER'])
    {
        $this->email = $email->value();
        $this->passwordHash = $passwordHash;
        $this->roles = array_values(array_unique(array_merge(['ROLE_USER'], $roles)));
        $this->createdAt = new \DateTimeImmutable();
    }

    public function id(): int
    {
        return $this->id ?? throw new \LogicException('User has not been persisted yet.');
    }

    public function email(): Email
    {
        return Email::fromString($this->email);
    }

    #[\Override]
    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    /**
     * @return list<string>
     */
    #[\Override]
    public function getRoles(): array
    {
        return array_values(array_unique([...$this->roles, 'ROLE_USER']));
    }

    #[\Override]
    public function getPassword(): string
    {
        return $this->passwordHash;
    }

    public function eraseCredentials(): void
    {
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
