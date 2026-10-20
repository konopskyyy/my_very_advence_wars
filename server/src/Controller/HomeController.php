<?php

declare(strict_types=1);

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/')]
final class HomeController extends AbstractController
{
    #[Route('', name: 'home', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return $this->json([
            'service' => 'server',
            'status'  => 'ok',
            'framework' => 'Symfony ' . Kernel::VERSION,
        ]);
    }
}
