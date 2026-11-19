<?php

declare(strict_types=1);

use ComposerUnused\ComposerUnused\Configuration\Configuration;
use ComposerUnused\ComposerUnused\Configuration\ConfigurationSet\SymfonyConfigurationSet;
use ComposerUnused\ComposerUnused\Configuration\NamedFilter;

$composerJson = json_decode(file_get_contents(__DIR__ . '/composer.json'), true);
$rootPackageName = $composerJson['name'] ?? 'root';

// Pakiety używane przez konfigurację Symfony, pluginy Composera i kontrakty, więc skaner
// przestrzeni nazw ich nie widzi. Lista jest zamknięta: nowy wpis wymaga uzasadnienia.
$frameworkPackages = [
    'ext-iconv',
    'doctrine/doctrine-bundle',
    'doctrine/doctrine-migrations-bundle',
    'nelmio/cors-bundle',
    'phpdocumentor/reflection-docblock',
    'phpstan/phpdoc-parser',
    'sonata-project/doctrine-orm-admin-bundle',
    'symfony/dotenv',
    'symfony/flex',
    'symfony/http-client',
    'symfony/runtime',
    'symfony/yaml',
];

return static function (Configuration $config) use ($rootPackageName, $frameworkPackages): Configuration {
    $config->applyConfigurationSet(new SymfonyConfigurationSet($rootPackageName));

    foreach ($frameworkPackages as $package) {
        $config->addNamedFilter(NamedFilter::fromString($package));
    }

    return $config;
};
