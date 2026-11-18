<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require __DIR__ . '/config/db.php';
require __DIR__ . '/app/empleados.php';

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

try {
    manejarSolicitudesEmpleados(conexion());
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') {
        responder(409, ['ok' => false, 'mensaje' => 'El documento ya está registrado.']);
    }
    error_log($exception->getMessage());
    responder(500, ['ok' => false, 'mensaje' => 'Ocurrió un error con la base de datos.']);
} catch (Throwable $exception) {
    error_log($exception->getMessage());
    responder(500, ['ok' => false, 'mensaje' => 'Ocurrió un error inesperado.']);
}
