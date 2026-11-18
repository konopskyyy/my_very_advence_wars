<?php

declare(strict_types=1);

namespace App\Tests\Auth;

use App\Auth\Application\Google\GoogleIdentity;
use App\Auth\Application\Port\GoogleTokenVerifier;
use App\Auth\Domain\User\Exception\InvalidGoogleCredentialException;
use App\Auth\Infrastructure\Google\GoogleIdTokenVerifier;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\HttpKernel\KernelInterface;

final class GoogleLoginTest extends WebTestCase
{
    public static function setUpBeforeClass(): void
    {
        self::deleteDatabase();
        $kernel = self::bootKernel();
        self::createSchema($kernel);
        self::ensureKernelShutdown();
    }

    public function testGoogleLoginCreatesAccountAndSession(): void
    {
        $client = self::createClient();
        self::fakeVerifier($client, new GoogleIdentity('google-sub-1', 'nowy@gmail.com', true));

        $payload = $this->postGoogle($client, 'credential');

        self::assertResponseStatusCodeSame(200);
        self::assertNotSame('', $payload['token']);
        self::assertNotSame('', $payload['refreshToken']);
        self::assertSame('nowy@gmail.com', $payload['user']['email']);
        $this->assertMe($client, $payload['token']);
    }

    public function testGoogleLoginLinksExistingGmailAccount(): void
    {
        $client = self::createClient();
        $email = bin2hex(random_bytes(6)) . '@gmail.com';
        $registered = $this->register($client, $email);
        self::fakeVerifier($client, new GoogleIdentity('google-sub-2', $email, true));
        self::ensureKernelShutdown();

        $client = self::createClient();
        self::fakeVerifier($client, new GoogleIdentity('google-sub-2', $email, true));
        $payload = $this->postGoogle($client, 'credential');

        self::assertResponseStatusCodeSame(200);
        self::assertSame($registered['user']['id'], $payload['user']['id']);
    }

    public function testGoogleLoginRejectsNonAuthoritativeEmail(): void
    {
        $client = self::createClient();
        $email = bin2hex(random_bytes(6)) . '@example.com';
        $this->register($client, $email);
        self::ensureKernelShutdown();

        $client = self::createClient();
        self::fakeVerifier($client, new GoogleIdentity('google-sub-3', $email, true, null));
        $this->postGoogle($client, 'credential');

        self::assertResponseStatusCodeSame(403);
        self::assertSame(
            ['error' => 'Google email cannot be verified.'],
            $this->decode($client->getResponse()->getContent()),
        );
    }

    public function testGoogleLoginAcceptsVerifiedHostedDomain(): void
    {
        $client = self::createClient();
        $email = bin2hex(random_bytes(6)) . '@example.com';
        $this->register($client, $email);
        self::ensureKernelShutdown();

        $client = self::createClient();
        self::fakeVerifier($client, new GoogleIdentity('google-sub-4', $email, true, 'example.com'));
        $this->postGoogle($client, 'credential');

        self::assertResponseStatusCodeSame(200);
    }

    public function testInvalidGoogleCredentialReturnsUnauthorized(): void
    {
        $client = self::createClient();
        self::fakeVerifier($client, new GoogleIdentity('unused', 'unused@gmail.com', true), true);
        $this->postGoogle($client, 'invalid');

        self::assertResponseStatusCodeSame(401);
        self::assertSame(
            ['error' => 'Invalid Google credential.'],
            $this->decode($client->getResponse()->getContent()),
        );
    }

    public function testGoogleLoginValidatesPayload(): void
    {
        $client = self::createClient();
        $this->postGoogle($client, null);

        self::assertResponseStatusCodeSame(422);
    }

    /**
     * @return array<string, mixed>
     */
    private function postGoogle(KernelBrowser $client, ?string $credential): array
    {
        $body = null === $credential ? [] : ['credential' => $credential];
        $client->request(
            'POST',
            '/api/auth/google',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode($body, \JSON_THROW_ON_ERROR),
        );

        return $this->decode($client->getResponse()->getContent());
    }

    /**
     * @return array{token: string, refreshToken: string, user: array{id: int, email: string}}
     */
    private function register(KernelBrowser $client, string $email): array
    {
        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => 'tajne-haslo'], \JSON_THROW_ON_ERROR),
        );

        return $this->decode($client->getResponse()->getContent());
    }

    private static function fakeVerifier(
        KernelBrowser $client,
        GoogleIdentity $identity,
        bool $invalid = false,
    ): void {
        $verifier = new class($identity, $invalid) implements GoogleTokenVerifier {
            public function __construct(
                private readonly GoogleIdentity $identity,
                private readonly bool $invalid,
            ) {
            }

            #[\Override]
            public function verify(string $credential): GoogleIdentity
            {
                if ($this->invalid || 'invalid' === $credential) {
                    throw InvalidGoogleCredentialException::create();
                }

                return $this->identity;
            }
        };

        static::getContainer()->set(GoogleIdTokenVerifier::class, $verifier);
    }

    private function assertMe(KernelBrowser $client, string $token): void
    {
        $client->request('GET', '/api/auth/me', server: [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ]);

        self::assertResponseStatusCodeSame(200);
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(string|false $content): array
    {
        $decoded = json_decode((string) $content, true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        return $decoded;
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
