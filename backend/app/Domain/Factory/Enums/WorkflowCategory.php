<?php

namespace App\Domain\Factory\Enums;

enum WorkflowCategory: string
{
    case Production = 'production';
    case Maintenance = 'maintenance';
    case Quality = 'quality';
    case Purchasing = 'purchasing';
    case Warehouse = 'warehouse';
    case Hr = 'hr';
    case Administration = 'administration';
    case Custom = 'custom';
}
