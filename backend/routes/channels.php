<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('factory.live-dashboard', fn ($user) => $user !== null);
Broadcast::channel('machines.{machineId}', fn ($user, int $machineId) => $user !== null);
