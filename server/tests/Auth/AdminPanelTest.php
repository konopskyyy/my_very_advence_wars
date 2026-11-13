<?php

declare(strict_types=1);

namespace App\Tests\Auth;

use App\Auth\Application\Port\PasswordHasher;
use App\Auth\Domain\User\Email;
use App\Auth\Domain\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class AdminPanelTest extends WebTestCase
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

    public function testAnonymousIsRedirectedToLogin(): void
    {
        $client = self::createClient();
        $client->request('GET', '/admin');

        self::assertResponseRedirects('/admin/login');
    }

    public function testLoginPageRenders(): void
    {
        $client = self::createClient();
        $client->request('GET', '/admin/login');

        self::assertResponseIsSuccessful();
        self::assertSelectorTextContains('h1', 'Panel administratora');
    }

    public function testAdminCanOpenDashboardAndUserList(): void
    {
        $email = $this->uniqueEmail();
        $this->createUser($email, 'admin-haslo', ['ROLE_ADMIN']);

        $client = self::createClient();
        $this->login($client, $email, 'admin-haslo');

        self::assertResponseRedirects('/admin/dashboard');

        $client->followRedirect();
        self::assertResponseIsSuccessful();

        $client->request('GET', '/admin/auth/user/list');
        self::assertResponseIsSuccessful();
        self::assertStringContainsString($email, (string) $client->getResponse()->getContent());
    }

    public function testRegularUserCannotOpenAdmin(): void
    {
        $email = $this->uniqueEmail();
        $this->createUser($email, 'gracz-haslo', []);

        $client = self::createClient();
        $this->login($client, $email, 'gracz-haslo');

        self::assertResponseRedirects('/admin/dashboard');

        $client->followRedirect();
        self::assertResponseStatusCodeSame(403);
    }

    private function login(KernelBrowser $client, string $email, string $password): void
    {
        $client->request('POST', '/admin/login', [
            '_username' => $email,
            '_password' => $password,
        ]);
    }

    /**
     * @param list<string> $roles
     */
    private function createUser(string $email, string $password, array $roles): void
    {
        self::bootKernel();

        $entityManager = self::getContainer()->get(EntityManagerInterface::class);
        $hasher = self::getContainer()->get(PasswordHasher::class);

        $entityManager->persist(new User(Email::fromString($email), $hasher->hash($password), $roles));
        $entityManager->flush();

        self::ensureKernelShutdown();
    }

    private function uniqueEmail(): string
    {
        return sprintf('admin-%s@example.com', bin2hex(random_bytes(6)));
    }
}
