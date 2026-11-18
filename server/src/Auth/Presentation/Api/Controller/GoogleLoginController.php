<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Application\GoogleLogin\GoogleLoginCommand;
use App\Auth\Application\GoogleLogin\GoogleLoginHandler;
use App\Auth\Presentation\Api\Request\GoogleLoginRequest;
use App\Auth\Presentation\Api\Response\AuthResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final readonly class GoogleLoginController
{
    #[Route('/api/auth/google', name: 'api_auth_google', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function __invoke(
        #[MapRequestPayload] GoogleLoginRequest $request,
        GoogleLoginHandler $handler,
    ): JsonResponse {
        return new JsonResponse(AuthResponse::fromResult(
            $handler(new GoogleLoginCommand($request->credential)),
        ));
    }
}
