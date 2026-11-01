<?php

declare(strict_types=1);

namespace App\Auth\Presentation\Api;

use App\Auth\Domain\User\Exception\EmailAlreadyTakenException;
use App\Auth\Domain\User\Exception\InvalidCredentialsException;
use App\Auth\Domain\User\Exception\InvalidEmailException;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::EXCEPTION)]
final class ApiExceptionListener
{
    public function __invoke(ExceptionEvent $event): void
    {
        if (!str_starts_with($event->getRequest()->getPathInfo(), '/api/')) {
            return;
        }

        $exception = $event->getThrowable();

        if ($exception instanceof EmailAlreadyTakenException) {
            $event->setResponse(new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_CONFLICT));

            return;
        }

        if ($exception instanceof InvalidCredentialsException) {
            $event->setResponse(new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_UNAUTHORIZED));

            return;
        }

        if ($exception instanceof InvalidEmailException) {
            $event->setResponse(new JsonResponse(['error' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY));
        }
    }
}
