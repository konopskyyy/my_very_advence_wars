<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api\Controller;

use App\Auth\Domain\User\User;
use App\Auth\Presentation\Api\Response\UserResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Security\Http\Attribute\IsGranted;

final readonly class MeController
{
    #[Route('/api/auth/me', name: 'api_auth_me', methods: ['GET'], defaults: ['_format' => 'json'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function __invoke(#[CurrentUser] User $user): JsonResponse
    {
        return new JsonResponse(UserResponse::fromUser($user));
    }
}
