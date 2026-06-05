<?php

namespace App\Domain\Factory\Enums;

enum MoldImageType: string
{
    case Photo = 'photo';
    case TechnicalDrawing = 'technical_drawing';
    case ExplodedDiagram = 'exploded_diagram';
    case MaintenancePhoto = 'maintenance_photo';
}
