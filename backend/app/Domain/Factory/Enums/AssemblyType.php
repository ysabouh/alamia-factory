<?php

namespace App\Domain\Factory\Enums;

enum AssemblyType: string
{
    case Single = 'single';
    case Component = 'component';
    case Subassembly = 'subassembly';
    case Assembly = 'assembly';
}
