<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Persistence;

use App\Auth\Domain\RefreshToken\RefreshToken;
use App\Auth\Domain\RefreshToken\RefreshTokenRepositoryInterface;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;

#[AsAlias(RefreshTokenRepositoryInterface::class)]
final readonly class DoctrineRefreshTokenRepository implements RefreshTokenRepositoryInterface
{
    public function __construct(
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[\Override]
    public function save(RefreshToken $token): void
    {
        $this->entityManager->persist($token);
        $this->entityManager->flush();
    }

    #[\Override]
    public function findByHash(string $hash): ?RefreshToken
    {
        return $this->entityManager
            ->getRepository(RefreshToken::class)
            ->findOneBy(['hash' => $hash]);
    }

    #[\Override]
    public function revokeFamily(string $familyId): void
    {
        $this->entityManager
            ->createQueryBuilder()
            ->update(RefreshToken::class, 'token')
            ->set('token.revokedAt', ':now')
            ->where('token.familyId = :family')
            ->andWhere('token.revokedAt IS NULL')
            ->setParameter('now', new \DateTimeImmutable())
            ->setParameter('family', $familyId)
            ->getQuery()
            ->execute();
    }
}
