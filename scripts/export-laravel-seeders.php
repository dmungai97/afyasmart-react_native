<?php

declare(strict_types=1);

$apiRoot = $argv[1] ?? 'D:\\Project\\AfyaSmart-API';
$outDir = __DIR__ . '/../seed-data';

$seeders = [
    'doctors' => [
        'file' => $apiRoot . '/database/seeders/DoctorSeeder.php',
        'variable' => 'doctors',
    ],
    'drugs' => [
        'file' => $apiRoot . '/database/seeders/DrugSeeder.php',
        'variable' => 'drugs',
    ],
    'pharmacies' => [
        'file' => $apiRoot . '/database/seeders/PharmacySeeder.php',
        'variable' => 'pharmacies',
    ],
];

if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}

foreach ($seeders as $collection => $config) {
    $source = file_get_contents($config['file']);

    if ($source === false) {
        throw new RuntimeException("Could not read {$config['file']}");
    }

    $pattern = '/\\$' . preg_quote($config['variable'], '/') . '\\s*=\\s*(\\[.*?\\]);/s';

    if (!preg_match($pattern, $source, $matches)) {
        throw new RuntimeException("Could not find \${$config['variable']} in {$config['file']}");
    }

    $items = eval('return ' . $matches[1] . ';');
    $target = $outDir . '/' . $collection . '.json';

    file_put_contents(
        $target,
        json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    );

    echo "Exported " . count($items) . " {$collection} to {$target}\n";
}
