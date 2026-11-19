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

#[AsAlias(GoogleTokenVerifier::class)]
final readonly class GoogleIdTokenVerifier implements GoogleTokenVerifier
{
    private const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    public function __construct(
        private GoogleJwksProvider $jwks,
        private string $clientIds,
    ) {
    }

    #[\Override]
    public function verify(string $credential): GoogleIdentity
    {
        try {
            $token = $this->parse($credential);
            [$sub, $email] = $this->assertClaims($token);

            return $this->identity($token, $sub, $email);
        } catch (InvalidGoogleCredentialException $exception) {
            throw $exception;
        } catch (\Throwable) {
            throw InvalidGoogleCredentialException::create();
        }
    }

    private function parse(string $credential): Plain
    {
        if ('' === $credential) {
            throw InvalidGoogleCredentialException::create();
        }

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

        $key = InMemory::plainText($this->jwks->certificate($kid));
        $verification = Configuration::forAsymmetricSigner(new Sha256(), $key, $key);
        $verification->validator()->assert(
            $token,
            new SignedWith(new Sha256(), $key),
            new LooseValidAt(new Clock(), new \DateInterval('PT1M')),
        );

        return $token;
    }

    /**
     * @return array{string, string}
     */
    private function assertClaims(Plain $token): array
    {
        $claims = $token->claims();
        $issuer = $claims->get('iss');
        $sub = $claims->get('sub');
        $email = $claims->get('email');

        if (!is_string($issuer) || !in_array($issuer, self::ISSUERS, true)) {
            throw InvalidGoogleCredentialException::create();
        }

        if (!is_string($sub) || '' === $sub || !is_string($email) || '' === $email) {
            throw InvalidGoogleCredentialException::create();
        }

        if (!$this->audienceAllowed($claims->get('aud'))) {
            throw InvalidGoogleCredentialException::create();
        }

        return [$sub, $email];
    }

    private function audienceAllowed(mixed $audience): bool
    {
        $audiences = is_array($audience) ? $audience : [$audience];
        $allowed = array_filter(array_map('trim', explode(',', $this->clientIds)));

        return [] !== $allowed && [] !== array_intersect($allowed, array_map('strval', $audiences));
    }

    private function identity(Plain $token, string $sub, string $email): GoogleIdentity
    {
        $claims = $token->claims();
        $verified = $claims->get('email_verified');
        $hostedDomain = $claims->get('hd');

        return new GoogleIdentity(
            $sub,
            $email,
            true === $verified || 'true' === $verified,
            is_string($hostedDomain) && '' !== $hostedDomain ? $hostedDomain : null,
        );
    }
}
