<?php

namespace App\Application\Users;

use App\Domain\Factory\Models\Employee;
use App\Domain\Factory\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;

final class LinkUserToEmployee
{
    public function assertEmployeeAvailable(int $employeeId, ?int $exceptUserId = null): Employee
    {
        /** @var Employee $employee */
        $employee = Employee::query()->findOrFail($employeeId);

        $other = $employee->user();
        if ($exceptUserId !== null) {
            $other->where('id', '!=', $exceptUserId);
        }

        if ($other->exists()) {
            throw new HttpResponseException(response()->json([
                'message' => __('factory.employee_already_has_account'),
            ], JsonResponse::HTTP_CONFLICT));
        }

        return $employee;
    }

    public function assertUserNotLinkedElsewhere(User $user, int $employeeId): void
    {
        if ($user->employee_id !== null && (int) $user->employee_id !== $employeeId) {
            throw new HttpResponseException(response()->json([
                'message' => __('factory.user_already_linked_employee'),
            ], JsonResponse::HTTP_CONFLICT));
        }
    }
}
