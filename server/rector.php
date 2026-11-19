<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;

// rector/rector-symfony nie wspiera jeszcze Rectora 2.x, więc reguły Symfony
// dołączymy, gdy pojawi się zgodna wersja pakietu.
return RectorConfig::configure()
    ->withPaths([__DIR__ . '/src', __DIR__ . '/tests'])
    ->withSkip([__DIR__ . '/vendor', __DIR__ . '/var', __DIR__ . '/config'])
    ->withSets([LevelSetList::UP_TO_PHP_84]);
