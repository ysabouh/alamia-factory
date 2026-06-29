<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('workflow_stage_transitions')) {
            return;
        }

        Schema::create('workflow_stage_transitions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('template_version_id')->constrained('workflow_template_versions')->cascadeOnDelete();
            $table->foreignId('from_stage_id')->nullable()->constrained('workflow_stages')->cascadeOnDelete();
            $table->foreignId('to_stage_id')->constrained('workflow_stages')->cascadeOnDelete();
            $table->string('from_gateway_node_id', 80)->nullable();
            $table->string('condition_type', 30)->default('default');
            $table->string('label', 80)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['template_version_id', 'from_stage_id'], 'wf_trans_version_from_idx');
            $table->index(['template_version_id', 'from_gateway_node_id'], 'wf_trans_version_gateway_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_stage_transitions');
    }
};
