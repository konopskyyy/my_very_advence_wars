<?php

declare(strict_types=1);

namespace App\Auth\Infrastructure\Google;

use App\Auth\Domain\User\Exception\InvalidGoogleCredentialException;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final readonly class GoogleJwksProvider
{
    private const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
    private const CACHE_KEY = 'google_jwks';

    /**
     * @psalm-suppress PossiblyUnusedMethod — instancjowany przez kontener Symfony.
     */
    public function __construct(
        private HttpClientInterface $httpClient,
        private CacheInterface $cache,
    ) {
    }

    /**
     * @return non-empty-string
     */
    public function certificate(string $kid): string
    {
        foreach ($this->keys()['keys'] ?? [] as $key) {
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

    /**
     * @return array<string, mixed>
     */
    private function keys(): array
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
}
