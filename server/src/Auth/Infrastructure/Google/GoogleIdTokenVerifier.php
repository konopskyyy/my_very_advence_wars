<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Google;

use App\Auth\Application\Google\GoogleIdentity;
use App\Auth\Application\Port\GoogleTokenVerifier;
use App\Auth\Domain\User\Exception\InvalidGoogleCredentialException;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use Lcobucci\JWT\Token\Plain;
use Lcobucci\JWT\Validation\Constraint\LooseValidAt;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Symfony\Component\Clock\Clock;
use Symfony\Component\DependencyInjection\Attribute\AsAlias;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[AsAlias(GoogleTokenVerifier::class)]
final readonly class GoogleIdTokenVerifier implements GoogleTokenVerifier
{
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
    private const CACHE_KEY = 'google_jwks';

    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheInterface $cache,
        #[Autowire('%env(default:google_client_ids:GOOGLE_CLIENT_IDS)%')]
        private string $clientIds,
    ) {
    }

    #[\Override]
    public function verify(string $credential): GoogleIdentity
    {
        try {
            $configuration = Configuration::forAsymmetricSigner(
                new Sha256(),
                InMemory::plainText('unused'),
                InMemory::plainText('unused'),
            );
            $token = $configuration->parser()->parse($credential);

            if (!$token instanceof Plain) {
                throw InvalidGoogleCredentialException::create();
            }

            $kid = $token->headers()->get('kid');

            if (!is_string($kid)) {
                throw InvalidGoogleCredentialException::create();
            }

            $pem = $this->certificateFor($kid);
            $key = InMemory::plainText($pem);
            $verification = Configuration::forAsymmetricSigner(new Sha256(), $key, $key);
            $verification->validator()->assert(
                $token,
                new SignedWith(new Sha256(), $key),
                new LooseValidAt(new Clock(), new \DateInterval('PT1M')),
            );

            $claims = $token->claims();
            $issuer = $claims->get('iss');

            if (!is_string($issuer) || !in_array($issuer, self::ISSUERS, true)) {
                throw InvalidGoogleCredentialException::create();
            }

            $audience = $claims->get('aud');
            $audiences = is_array($audience) ? $audience : [$audience];
            $allowed = array_filter(array_map('trim', explode(',', $this->clientIds)));

            if ([] === $allowed || [] === array_intersect($allowed, array_map('strval', $audiences))) {
                throw InvalidGoogleCredentialException::create();
            }

            $sub = $claims->get('sub');
            $email = $claims->get('email');
            $verified = $claims->get('email_verified');

            if (!is_string($sub) || '' === $sub || !is_string($email) || '' === $email) {
                throw InvalidGoogleCredentialException::create();
            }

            $hostedDomain = $claims->get('hd');

            return new GoogleIdentity(
                $sub,
                $email,
                true === $verified || 'true' === $verified,
                is_string($hostedDomain) && '' !== $hostedDomain ? $hostedDomain : null,
            );
        } catch (InvalidGoogleCredentialException $exception) {
            throw $exception;
        } catch (\Throwable) {
            throw InvalidGoogleCredentialException::create();
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function jwks(): array
    {
        return $this->cache->get(self::CACHE_KEY, function (ItemInterface $item): array {
            $response = $this->httpClient->request('GET', self::JWKS_URL);

            if ($response->getStatusCode() >= 400) {
                throw InvalidGoogleCredentialException::create();
            }

            $headers = $response->getHeaders();
            $cacheControl = $headers['cache-control'][0] ?? '';
            $lifetime = preg_match('/max-age=(\d+)/', $cacheControl, $matches) ? (int) $matches[1] : 3600;
            $item->expiresAfter(max(60, $lifetime));
            $payload = $response->toArray(false);

            return is_array($payload['keys'] ?? null) ? $payload : [];
        });
    }

    private function certificateFor(string $kid): string
    {
        foreach ($this->jwks()['keys'] ?? [] as $key) {
            if (!is_array($key) || ($key['kid'] ?? null) !== $kid || 'RSA' !== ($key['kty'] ?? null)) {
                continue;
            }

            $certificate = $key['x5c'][0] ?? null;

            if (!is_string($certificate) || '' === $certificate) {
                continue;
            }

            return "-----BEGIN CERTIFICATE-----\n" . chunk_split($certificate, 64, "\n") . "-----END CERTIFICATE-----\n";
        }

        throw InvalidGoogleCredentialException::create();
    }
}
