<?php

declare(strict_types=1);

namespace App\Tests\Auth;

use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AuthApiTest extends WebTestCase
{
    #[\Override]
    public static function setUpBeforeClass(): void
    {
        $database = dirname(__DIR__, 2) . '/var/test.db';
        if (is_file($database)) {
            unlink($database);
        }

        self::bootKernel();

        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->createSchema($entityManager->getMetadataFactory()->getAllMetadata());

        self::ensureKernelShutdown();
    }

    public function testRegisterCreatesUserAndReturnsToken(): void
    {
        $email = $this->uniqueEmail();
        $client = self::createClient();

        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => '  ' . strtoupper($email) . '  ', 'password' => 'bardzo-tajne'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);
        $payload = $this->decode($client->getResponse()->getContent());

        self::assertArrayHasKey('token', $payload);
        self::assertNotSame('', $payload['token']);
        self::assertSame($email, $payload['user']['email']);
        self::assertIsInt($payload['user']['id']);
        self::assertArrayNotHasKey('password', $payload['user']);
    }

    public function testRegisterRejectsDuplicateEmail(): void
    {
        $email = $this->uniqueEmail();
        $client = self::createClient();

        $this->register($client, $email);

        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => 'inne-haslo'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(409);
        self::assertSame(['error' => sprintf('Email "%s" is already registered.', $email)], $this->decode($client->getResponse()->getContent()));
    }

    public function testRegisterValidatesPayload(): void
    {
        $client = self::createClient();

        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => 'nie-email', 'password' => 'krótkie'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(422);
    }

    public function testLoginReturnsTokenForValidCredentials(): void
    {
        $email = $this->uniqueEmail();
        $client = self::createClient();
        $this->register($client, $email, 'tajne-haslo');

        $client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => 'tajne-haslo'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(200);
        $payload = $this->decode($client->getResponse()->getContent());
        self::assertNotSame('', $payload['token']);
        self::assertSame($email, $payload['user']['email']);
    }

    public function testLoginRejectsWrongPassword(): void
    {
        $email = $this->uniqueEmail();
        $client = self::createClient();
        $this->register($client, $email, 'tajne-haslo');

        $client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => 'zle-haslo'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['error' => 'Invalid email or password.'], $this->decode($client->getResponse()->getContent()));
    }

    public function testLoginDoesNotRevealUnknownEmail(): void
    {
        $client = self::createClient();
        $client->request(
            'POST',
            '/api/auth/login',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $this->uniqueEmail(), 'password' => 'tajne-haslo'], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
        self::assertSame(['error' => 'Invalid email or password.'], $this->decode($client->getResponse()->getContent()));
    }

    public function testMeRequiresToken(): void
    {
        $client = self::createClient();
        $client->request('GET', '/api/auth/me', server: ['HTTP_ACCEPT' => 'application/json']);

        self::assertResponseStatusCodeSame(401);
    }

    public function testMeReturnsAuthenticatedUser(): void
    {
        $email = $this->uniqueEmail();
        $client = self::createClient();
        $registerPayload = $this->register($client, $email, 'tajne-haslo');

        $client->request('GET', '/api/auth/me', server: [
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $registerPayload['token'],
        ]);

        self::assertResponseStatusCodeSame(200);
        self::assertSame([
            'id' => $registerPayload['user']['id'],
            'email' => $email,
            'createdAt' => $registerPayload['user']['createdAt'],
        ], $this->decode($client->getResponse()->getContent()));
    }

    /**
     * @return array{token: string, user: array{id: int, email: string, createdAt: string}}
     */
    private function register(KernelBrowser $client, string $email, string $password = 'tajne-haslo'): array
    {
        $client->request(
            'POST',
            '/api/auth/register',
            server: ['CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json'],
            content: json_encode(['email' => $email, 'password' => $password], \JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);

        return $this->decode($client->getResponse()->getContent());
    }

    /**
     * @return array<string, mixed>
     */
    private function decode(string|false $content): array
    {
        self::assertIsString($content);

        $decoded = json_decode($content, true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($decoded);

        return $decoded;
    }

    private function uniqueEmail(): string
    {
        return sprintf('user-%s@example.com', bin2hex(random_bytes(6)));
    }
}
