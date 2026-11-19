<?php

declare(strict_types=1);

namespace App\Tests\Auth;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpKernel\KernelInterface;

final class RefreshTokenTest extends WebTestCase
{
    #[\Override]
    public static function setUpBeforeClass(): void
    {
        self::deleteDatabase();
        $kernel = self::bootKernel();
        self::createSchema($kernel);
        self::ensureKernelShutdown();
    }

    public function testRefreshRotatesTokenAndRevokesFamilyOnReuse(): void
    {
        $client = self::createClient();
        $session = $this->register($client);
        $oldRefresh = $session['refreshToken'];

        $rotated = $this->post($client, '/api/auth/refresh', ['refreshToken' => $oldRefresh]);
        self::assertResponseStatusCodeSame(200);
        self::assertNotSame($oldRefresh, $rotated['refreshToken']);
        $this->assertMe($client, $rotated['token']);

        $this->post($client, '/api/auth/refresh', ['refreshToken' => $oldRefresh]);
        self::assertResponseStatusCodeSame(401);

        $this->post($client, '/api/auth/refresh', ['refreshToken' => $rotated['refreshToken']]);
        self::assertResponseStatusCodeSame(401);
    }

    public function testLogoutRevokesRefreshToken(): void
    {
        $client = self::createClient();
        $session = $this->register($client);

        $this->post($client, '/api/auth/logout', ['refreshToken' => $session['refreshToken']]);
        self::assertResponseStatusCodeSame(204);

        $this->post($client, '/api/auth/refresh', ['refreshToken' => $session['refreshToken']]);
        self::assertResponseStatusCodeSame(401);
    }

    public function testUnknownAndMissingTokensReturnErrors(): void
    {
        $client = self::createClient();
        $this->post($client, '/api/auth/refresh', ['refreshToken' => 'does-not-exist']);
        self::assertResponseStatusCodeSame(401);

        $this->post($client, '/api/auth/refresh', []);
        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return array{token: string, refreshToken: string, user: array{id: int, email: string}}
     */
    private function register(KernelBrowser $client): array
    {
        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode([
                'email' => bin2hex(random_bytes(6)) . '@example.com',
                'password' => 'tajne-haslo',
            ], \JSON_THROW_ON_ERROR),
        );

        $payload = json_decode((string) $client->getResponse()->getContent(), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($payload);

        return $payload;
    }

    /**
     * @param array<string, string> $body
     *
     * @return array<string, mixed>
     */
    private function post(KernelBrowser $client, string $path, array $body): array
    {
        $client->request(
            'POST',
            $path,
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode($body, \JSON_THROW_ON_ERROR),
        );

        $content = (string) $client->getResponse()->getContent();

        if ('' === $content) {
            return [];
        }

        $payload = json_decode($content, true, flags: \JSON_THROW_ON_ERROR);

        return is_array($payload) ? $payload : [];
    }

    private function assertMe(KernelBrowser $client, string $token): void
    {
        $client->request('GET', '/api/auth/me', server: [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        self::assertResponseStatusCodeSame(200);
    }

    private static function createSchema(KernelInterface $kernel): void
    {
        $entityManager = $kernel->getContainer()->get('doctrine')->getManager();
        self::assertInstanceOf(EntityManagerInterface::class, $entityManager);
        (new SchemaTool($entityManager))->createSchema($entityManager->getMetadataFactory()->getAllMetadata());
    }

    private static function deleteDatabase(): void
    {
        $path = dirname(__DIR__, 2) . '/var/test.db';

        if (is_file($path)) {
            unlink($path);
        }
    }
}
