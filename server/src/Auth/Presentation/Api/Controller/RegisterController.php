<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Application\RegisterUser\RegisterUserCommand;
use App\Auth\Application\RegisterUser\RegisterUserHandler;
use App\Auth\Presentation\Api\Request\RegisterRequest;
use App\Auth\Presentation\Api\Response\AuthResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

final readonly class RegisterController
{
    #[Route('/api/auth/register', name: 'api_auth_register', methods: ['POST'], defaults: ['_format' => 'json'])]
    public function __invoke(
        #[MapRequestPayload] RegisterRequest $request,
        RegisterUserHandler $handler,
    ): JsonResponse {
        $result = $handler(new RegisterUserCommand($request->email, $request->password));

        return new JsonResponse(AuthResponse::fromResult($result), Response::HTTP_CREATED);
    }
}
