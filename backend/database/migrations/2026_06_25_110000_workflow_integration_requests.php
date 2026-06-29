<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function createRequestTable(string $tableName): void
    {
        if (Schema::hasTable($tableName)) {
            return;
        }

        Schema::create($tableName, function (Blueprint $table): void {
            $table->id();
            $table->string('request_number', 40)->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 30)->default('draft');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('requested_by_employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->foreignId('workflow_instance_id')->nullable()->constrained('workflow_instances')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function up(): void
    {
        $this->createRequestTable('purchase_requests');
        $this->createRequestTable('inventory_transfers');
        $this->createRequestTable('hr_requests');
        $this->createRequestTable('supplier_requests');
        $this->createRequestTable('customer_complaints');
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_complaints');
        Schema::dropIfExists('supplier_requests');
        Schema::dropIfExists('hr_requests');
        Schema::dropIfExists('inventory_transfers');
        Schema::dropIfExists('purchase_requests');
    }
};
