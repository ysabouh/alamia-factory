<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskCategory: string
{
    case ElectricalMaintenance = 'electrical_maintenance';
    case MechanicalMaintenance = 'mechanical_maintenance';
    case Production = 'production';
    case Quality = 'quality';
    case Safety = 'safety';
    case Warehouse = 'warehouse';
    case Hr = 'hr';
    case Administration = 'administration';
    case Custom = 'custom';
}
