<?php

namespace Tests\Feature;

use App\Application\Production\AssignMoldToMachine;
use App\Application\Production\RecordProductionEntry;
use App\Application\Production\RecordWasteEntry;
use App\Domain\Factory\Models\Machine;
use App\Domain\Factory\Models\MachineType;
use App\Domain\Factory\Models\Mold;
use App\Domain\Factory\Models\Product;
use App\Domain\Factory\Models\Shift;
use App\Domain\Factory\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_supervisor_can_assign_mold_and_record_production_and_waste(): void
    {
        $user = User::factory()->create();
        $machineType = MachineType::create(['code' => 'injection', 'name' => 'حقن']);
        $machine = Machine::create([
            'machine_type_id' => $machineType->id,
            'code' => 'INJ-01',
            'name' => 'حقن 350 طن',
            'status' => 'stopped',
        ]);
        $product = Product::create(['code' => 'P-001', 'name' => 'غطاء', 'unit' => 'piece']);
        $mold = Mold::create(['product_id' => $product->id, 'code' => 'M-001', 'name' => 'قالب غطاء']);
        $shift = Shift::create(['name' => 'صباحي', 'starts_at' => '08:00', 'ends_at' => '16:00']);

        $assignment = app(AssignMoldToMachine::class)->handle([
            'machine_id' => $machine->id,
            'mold_id' => $mold->id,
        ]);

        $production = app(RecordProductionEntry::class)->handle([
            'machine_id' => $machine->id,
            'mold_id' => $mold->id,
            'shift_id' => $shift->id,
            'entry_date' => now()->toDateString(),
            'produced_pieces' => 1200,
            'produced_weight_kg' => 48,
        ], $user->id);

        $waste = app(RecordWasteEntry::class)->handle([
            'machine_id' => $machine->id,
            'mold_id' => $mold->id,
            'shift_id' => $shift->id,
            'entry_date' => now()->toDateString(),
            'weight_kg' => 2,
            'reason' => 'startup',
        ], $user->id);

        $this->assertSame($machine->id, $assignment->machine_id);
        $this->assertSame(1200, $production->produced_pieces);
        $this->assertSame('startup', $waste->reason);
    }
}
