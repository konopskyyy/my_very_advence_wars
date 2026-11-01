<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Application\LoginUser\LoginUserCommand;
use App\Auth\Application\LoginUser\LoginUserHandler;
use App\Auth\Presentation\Api\Request\LoginRequest;
use App\Auth\Presentation\Api\Response\AuthResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final readonly class LoginController
{
    #[Route('/api/auth/login', name: 'api_auth_login', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function __invoke(
        #[MapRequestPayload] LoginRequest $request,
        LoginUserHandler $handler,
    ): JsonResponse {
        $result = $handler(new LoginUserCommand($request->email, $request->password));

        return new JsonResponse(AuthResponse::fromResult($result));
    }
}
