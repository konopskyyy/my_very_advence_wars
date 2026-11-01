<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__) . '/vendor/autoload.php';

// Kontener PHP ustawia APP_ENV=dev również w $_ENV; KernelTestCase preferuje $_ENV nad phpunitowym $_SERVER.
$_SERVER['APP_ENV'] = $_ENV['APP_ENV'] = 'test';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__) . '/.env');
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}
