<?php

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        apiPrefix: 'api/v1',
    )
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        $schedule->job(new \App\Jobs\MarkAbsentEmployeesJob)->dailyAt('01:00');
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\SetApiLocale::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $jsonError = static function (Request $request, string $message, int $status) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => $message], $status);
            }

            return null;
        };

        $exceptions->render(function (RoleDoesNotExist $e, Request $request) use ($jsonError) {
            return $jsonError($request, __('factory.role_not_found'), 422);
        });

        $exceptions->render(function (PermissionDoesNotExist $e, Request $request) use ($jsonError) {
            return $jsonError($request, __('factory.permission_not_found'), 422);
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($jsonError) {
            return $jsonError($request, __('factory.unauthorized'), 403);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) use ($jsonError) {
            return $jsonError($request, __('factory.forbidden'), 403);
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($jsonError) {
            if ($e->getStatusCode() >= 500) {
                return $jsonError($request, __('factory.server_error'), $e->getStatusCode());
            }

            return null;
        });
    })
    ->booted(function (): void {
        $url = config('app.url');
        if (is_string($url) && $url !== '') {
            \Illuminate\Support\Facades\URL::forceRootUrl(rtrim($url, '/'));
        }

        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user && method_exists($user, 'hasRole') && $user->hasRole('admin', 'web')) {
                return true;
            }

            return null;
        });
    })
    ->create();
