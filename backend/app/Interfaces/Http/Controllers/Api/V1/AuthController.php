<?php

namespace App\Interfaces\Http\Controllers\Api\V1;

use App\Domain\Factory\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $email = strtolower(trim($credentials['email']));

        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('factory.invalid_credentials')],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => [__('factory.account_inactive')],
            ]);
        }

        return response()->json([
            'token' => $user->createToken($credentials['device_name'] ?? 'factory-dashboard')->plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employeeId' => $user->employee_id ? (string) $user->employee_id : null,
                'roles' => $user->roleNamesForApi(),
                'permissions' => $user->permissionNamesForApi(),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'employeeId' => $user->employee_id ? (string) $user->employee_id : null,
            'roles' => $user->roleNamesForApi(),
            'permissions' => $user->permissionNamesForApi(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => __('factory.logged_out')]);
    }
}
