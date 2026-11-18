<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Application\Refresh\RefreshTokenManager;
use App\Auth\Presentation\Api\Request\RefreshRequest;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final readonly class LogoutController
{
    #[Route('/api/auth/logout', name: 'api_auth_logout', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function __invoke(
        #[MapRequestPayload] RefreshRequest $request,
        RefreshTokenManager $refreshTokens,
    ): JsonResponse {
        $refreshTokens->revoke($request->refreshToken);

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
