<?php

namespace App\Domain\Factory\Models;

use App\Domain\Factory\Models\Concerns\TracksAuditorColumns;
use Illuminate\Database\Eloquent\Model;

class MachineType extends Model
{
    use TracksAuditorColumns;

    public $timestamps = false;

    protected $fillable = [
        'code',
        'name',
    ];

    protected function casts(): array
    {
        return self::auditorDateCasts();
    }
}
