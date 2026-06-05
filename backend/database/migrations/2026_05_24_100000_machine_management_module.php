<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('machine_types')) {
            Schema::table('machine_types', function (Blueprint $table): void {
                if (! Schema::hasColumn('machine_types', 'description')) {
                    $table->text('description')->nullable()->after('name');
                }
                if (! Schema::hasColumn('machine_types', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('description');
                }
            });

            DB::table('machine_types')->where('code', 'blow_molding')->update(['code' => 'blow']);
        }

        if (Schema::hasTable('machines')) {
            if (Schema::hasColumn('machines', 'location') && ! Schema::hasColumn('machines', 'factory_section')) {
                Schema::table('machines', function (Blueprint $table): void {
                    $table->string('factory_section')->nullable()->after('name');
                });
                DB::table('machines')->whereNotNull('location')->update([
                    'factory_section' => DB::raw('location'),
                ]);
            }

            Schema::table('machines', function (Blueprint $table): void {
                if (! Schema::hasColumn('machines', 'brand')) {
                    $table->string('brand')->nullable()->after('name');
                }
                if (! Schema::hasColumn('machines', 'model')) {
                    $table->string('model')->nullable()->after('brand');
                }
                if (! Schema::hasColumn('machines', 'serial_number')) {
                    $table->string('serial_number')->nullable()->after('model');
                }
                if (! Schema::hasColumn('machines', 'factory_section')) {
                    $table->string('factory_section')->nullable()->after('serial_number');
                }
                if (! Schema::hasColumn('machines', 'production_line')) {
                    $table->string('production_line')->nullable()->after('factory_section');
                }
                if (! Schema::hasColumn('machines', 'power_kw')) {
                    $table->decimal('power_kw', 10, 2)->nullable()->after('production_line');
                }
                if (! Schema::hasColumn('machines', 'hourly_energy_consumption')) {
                    $table->decimal('hourly_energy_consumption', 10, 2)->nullable()->after('power_kw');
                }
                if (! Schema::hasColumn('machines', 'installation_date')) {
                    $table->date('installation_date')->nullable()->after('hourly_energy_consumption');
                }
                if (! Schema::hasColumn('machines', 'notes')) {
                    $table->text('notes')->nullable()->after('installation_date');
                }
                if (! Schema::hasColumn('machines', 'is_active')) {
                    $table->boolean('is_active')->default(true)->after('notes');
                }
            });

            if (Schema::hasColumn('machines', 'location')) {
                Schema::table('machines', function (Blueprint $table): void {
                    $table->dropColumn('location');
                });
            }
            if (Schema::hasColumn('machines', 'capacity')) {
                Schema::table('machines', function (Blueprint $table): void {
                    $table->dropColumn('capacity');
                });
            }

            if (! Schema::hasColumn('machines', 'deleted_at')) {
                Schema::table('machines', function (Blueprint $table): void {
                    $table->softDeletes();
                });
            }

            DB::table('machines')->where('status', 'idle')->update(['status' => 'stopped']);
            DB::table('machines')->where('status', 'down')->update(['status' => 'breakdown']);
        }

        if (! Schema::hasTable('injection_machine_specs')) {
            Schema::create('injection_machine_specs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('machine_id')->unique()->constrained('machines')->cascadeOnDelete();
                $table->decimal('clamping_force_ton', 10, 2)->nullable();
                $table->decimal('shot_weight_gram', 10, 2)->nullable();
                $table->decimal('screw_diameter_mm', 10, 2)->nullable();
                $table->decimal('injection_pressure_bar', 10, 2)->nullable();
                $table->unsignedSmallInteger('heating_zones_count')->nullable();
                $table->decimal('max_cycle_time_sec', 10, 2)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('blow_machine_specs')) {
            Schema::create('blow_machine_specs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('machine_id')->unique()->constrained('machines')->cascadeOnDelete();
                $table->unsignedInteger('bottle_volume_min_ml')->nullable();
                $table->unsignedInteger('bottle_volume_max_ml')->nullable();
                $table->unsignedSmallInteger('cavities_count')->nullable();
                $table->decimal('air_pressure_bar', 10, 2)->nullable();
                $table->unsignedInteger('production_capacity_bph')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('machine_counters')) {
            Schema::create('machine_counters', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('machine_id')->constrained('machines')->cascadeOnDelete();
                $table->date('counter_date');
                $table->unsignedInteger('produced_units')->default(0);
                $table->unsignedInteger('rejected_units')->default(0);
                $table->decimal('running_hours', 8, 2)->default(0);
                $table->timestamps();

                $table->unique(['machine_id', 'counter_date'], 'machine_counters_machine_date_unique');
            });
        }

        if (Schema::hasTable('maintenance_tickets')) {
            Schema::table('maintenance_tickets', function (Blueprint $table): void {
                if (! Schema::hasColumn('maintenance_tickets', 'ticket_kind')) {
                    $table->string('ticket_kind', 20)->default('breakdown')->after('machine_id');
                }
                if (! Schema::hasColumn('maintenance_tickets', 'failure_date')) {
                    $table->date('failure_date')->nullable()->after('description');
                }
                if (! Schema::hasColumn('maintenance_tickets', 'resolved_at')) {
                    $table->timestamp('resolved_at')->nullable()->after('downtime_ended_at');
                }
                if (! Schema::hasColumn('maintenance_tickets', 'downtime_minutes')) {
                    $table->unsignedInteger('downtime_minutes')->nullable()->after('resolved_at');
                }
            });
        }

        if (Schema::hasTable('maintenance_actions')) {
            Schema::table('maintenance_actions', function (Blueprint $table): void {
                if (! Schema::hasColumn('maintenance_actions', 'maintenance_type')) {
                    $table->string('maintenance_type', 20)->default('corrective')->after('maintenance_ticket_id');
                }
                if (! Schema::hasColumn('maintenance_actions', 'maintenance_date')) {
                    $table->date('maintenance_date')->nullable()->after('maintenance_type');
                }
                if (! Schema::hasColumn('maintenance_actions', 'cost')) {
                    $table->decimal('cost', 14, 2)->nullable()->after('time_spent_minutes');
                }
                if (! Schema::hasColumn('maintenance_actions', 'notes')) {
                    $table->text('notes')->nullable()->after('cost');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('machine_counters');
        Schema::dropIfExists('blow_machine_specs');
        Schema::dropIfExists('injection_machine_specs');

        if (Schema::hasTable('maintenance_actions')) {
            Schema::table('maintenance_actions', function (Blueprint $table): void {
                foreach (['maintenance_type', 'maintenance_date', 'cost', 'notes'] as $col) {
                    if (Schema::hasColumn('maintenance_actions', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('maintenance_tickets')) {
            Schema::table('maintenance_tickets', function (Blueprint $table): void {
                foreach (['ticket_kind', 'failure_date', 'resolved_at', 'downtime_minutes'] as $col) {
                    if (Schema::hasColumn('maintenance_tickets', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('machines')) {
            DB::table('machines')->where('status', 'stopped')->update(['status' => 'idle']);
            DB::table('machines')->where('status', 'breakdown')->update(['status' => 'down']);

            Schema::table('machines', function (Blueprint $table): void {
                if (Schema::hasColumn('machines', 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
                if (! Schema::hasColumn('machines', 'location')) {
                    $table->string('location')->nullable();
                }
                if (! Schema::hasColumn('machines', 'capacity')) {
                    $table->string('capacity')->nullable();
                }
            });
        }

        if (Schema::hasTable('machine_types')) {
            DB::table('machine_types')->where('code', 'blow')->update(['code' => 'blow_molding']);
            Schema::table('machine_types', function (Blueprint $table): void {
                if (Schema::hasColumn('machine_types', 'description')) {
                    $table->dropColumn('description');
                }
                if (Schema::hasColumn('machine_types', 'is_active')) {
                    $table->dropColumn('is_active');
                }
            });
        }
    }
};
