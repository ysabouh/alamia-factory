<?php



namespace App\Domain\Factory\Models;



use App\Domain\Factory\Enums\WorkOrderWorkerRole;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Database\Eloquent\SoftDeletes;



class WorkOrderWorker extends Model

{

    use SoftDeletes;



    protected $fillable = [

        'work_order_id',

        'employee_id',

        'role',

        'effective_from',

        'created_by',

        'removed_by',

    ];



    protected function casts(): array

    {

        return [

            'role' => WorkOrderWorkerRole::class,

            'effective_from' => 'datetime',

        ];

    }



    public function workOrder(): BelongsTo

    {

        return $this->belongsTo(WorkOrder::class);

    }



    public function employee(): BelongsTo

    {

        return $this->belongsTo(Employee::class);

    }



    public function createdBy(): BelongsTo

    {

        return $this->belongsTo(User::class, 'created_by');

    }



    public function removedBy(): BelongsTo

    {

        return $this->belongsTo(User::class, 'removed_by');

    }

}

