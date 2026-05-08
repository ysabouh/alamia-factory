<?php

namespace App\Domain\Factory\Models;

use Illuminate\Database\Eloquent\Model;

class MachineType extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'code',
        'name',
    ];
}
