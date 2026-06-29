<?php

namespace App\Domain\Factory\Enums;

enum DirectTaskChecklistItemType: string
{
    case Checkbox = 'checkbox';
    case Text = 'text';
    case Number = 'number';
    case Image = 'image';
    case File = 'file';
    case Comment = 'comment';
    case Date = 'date';
    case Signature = 'signature';
}
