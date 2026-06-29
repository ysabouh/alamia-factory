<?php

namespace App\Domain\Factory\Enums;

enum WorkflowTemplateVersionStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
