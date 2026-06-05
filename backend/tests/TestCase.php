<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesTestingDatabase;

    protected function setUp(): void
    {
        $this->ensureTestingDatabaseExists();
        parent::setUp();
    }
}
