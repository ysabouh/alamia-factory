<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\IsWorkflowRequestSubject;
use Illuminate\Database\Eloquent\Model;

class CustomerComplaint extends Model
{
    use IsWorkflowRequestSubject;

    protected $fillable = [
        'request_number',
        'title',
        'description',
        'status',
        'department_id',
        'requested_by_employee_id',
        'workflow_instance_id',
    ];
}
