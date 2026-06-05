<?php

namespace App\Domain\Factory\Enums;

enum ProductDocumentType: string
{
    case Pdf = 'pdf';
    case Drawing = 'drawing';
    case Datasheet = 'datasheet';
    case QcSheet = 'qc_sheet';
    case SetupSheet = 'setup_sheet';
    case Other = 'other';
}
