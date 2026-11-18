<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Application\Refresh\RefreshTokenManager;
use App\Auth\Presentation\Api\Request\RefreshRequest;
use App\Auth\Presentation\Api\Response\AuthResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final readonly class RefreshController
{
    #[Route('/api/auth/refresh', name: 'api_auth_refresh', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function __invoke(
        #[MapRequestPayload] RefreshRequest $request,
        RefreshTokenManager $refreshTokens,
    ): JsonResponse {
        return new JsonResponse(AuthResponse::fromResult($refreshTokens->rotate($request->refreshToken)));
    }
}
