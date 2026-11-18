<?php

declare(strict_types=1);

namespace App\Auth\Domain\RefreshToken;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'auth_refresh_token')]
#[ORM\Index(name: 'idx_refresh_token_family', columns: ['family_id'])]
class RefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'user_id')]
    private int $userId;

    #[ORM\Column(length: 64)]
    private string $hash;

    #[ORM\Column(name: 'family_id', length: 64)]
    private string $familyId;

    #[ORM\Column(name: 'expires_at')]
    private \DateTimeImmutable $expiresAt;

    #[ORM\Column(name: 'revoked_at', nullable: true)]
    private ?\DateTimeImmutable $revokedAt = null;

    public function __construct(int $userId, string $hash, string $familyId, \DateTimeImmutable $expiresAt)
    {
        $this->userId = $userId;
        $this->hash = $hash;
        $this->familyId = $familyId;
        $this->expiresAt = $expiresAt;
    }

    public function userId(): int
    {
        return $this->userId;
    }

    public function hash(): string
    {
        return $this->hash;
    }

    public function familyId(): string
    {
        return $this->familyId;
    }

    public function expiresAt(): \DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function revokedAt(): ?\DateTimeImmutable
    {
        return $this->revokedAt;
    }

    public function revoke(): void
    {
        $this->revokedAt = new \DateTimeImmutable();
    }

    public function isUsable(): bool
    {
        return null === $this->revokedAt && $this->expiresAt > new \DateTimeImmutable();
    }
}
