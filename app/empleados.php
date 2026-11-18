<?php
declare(strict_types=1);

function responder(int $estado, array $respuesta): never
{
    http_response_code($estado);
    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE);
    exit;
}

function obtenerJson(): array
{
    $datos = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($datos)) {
        responder(400, ['ok' => false, 'mensaje' => 'El cuerpo de la solicitud debe ser JSON válido.']);
    }
    return $datos;
}

function validarEmpleado(array $datos): array
{
    $limpiar = static fn (string $campo): string => trim((string) ($datos[$campo] ?? ''));
    $empleado = [
        'nombre' => preg_replace('/\s+/', ' ', $limpiar('nombre')) ?? '',
        'tipo_documento' => $limpiar('tipo_documento'),
        'numero_documento' => strtoupper($limpiar('numero_documento')),
        'edad' => filter_var($datos['edad'] ?? null, FILTER_VALIDATE_INT),
        'sexo' => $limpiar('sexo'),
        'telefono' => $limpiar('telefono'),
        'cargo' => preg_replace('/\s+/', ' ', $limpiar('cargo')) ?? '',
    ];
    $errores = [];

    if ($empleado['nombre'] === '' || mb_strlen($empleado['nombre']) > 100) {
        $errores['nombre'] = 'Escribe un nombre de 1 a 100 caracteres.';
    }
    if (!in_array($empleado['tipo_documento'], ['DNI', 'CE'], true)) {
        $errores['tipo_documento'] = 'Selecciona DNI o carné de extranjería.';
    }
    $documentoValido = $empleado['tipo_documento'] === 'DNI'
        ? preg_match('/^[0-9]{8}$/', $empleado['numero_documento'])
        : preg_match('/^[A-Z0-9-]{6,20}$/', $empleado['numero_documento']);
    if (!$documentoValido) {
        $errores['numero_documento'] = $empleado['tipo_documento'] === 'DNI'
            ? 'El DNI debe tener exactamente 8 números.'
            : 'Ingresa un carné de extranjería válido (6 a 20 letras o números).';
    }
    if ($empleado['edad'] === false || $empleado['edad'] < 18 || $empleado['edad'] > 100) {
        $errores['edad'] = 'La edad debe estar entre 18 y 100 años.';
    }
    if (!in_array($empleado['sexo'], ['Masculino', 'Femenino'], true)) {
        $errores['sexo'] = 'Selecciona el sexo.';
    }
    if (!preg_match('/^[0-9]{9}$/', $empleado['telefono'])) {
        $errores['telefono'] = 'El teléfono peruano debe tener exactamente 9 dígitos, sin letras ni espacios.';
    }
    if ($empleado['cargo'] === '' || mb_strlen($empleado['cargo']) > 100) {
        $errores['cargo'] = 'Escribe un cargo de 1 a 100 caracteres.';
    }
    if ($errores) {
        responder(422, ['ok' => false, 'mensaje' => 'Corrige los campos indicados.', 'errores' => $errores]);
    }
    return $empleado;
}

function idSolicitado(): int
{
    $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) {
        responder(400, ['ok' => false, 'mensaje' => 'El identificador no es válido.']);
    }
    return $id;
}

function verificarCsrf(): void
{
    $token = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals((string) $_SESSION['csrf_token'], $token)) {
        responder(419, ['ok' => false, 'mensaje' => 'La sesión expiró. Recarga la página e inténtalo otra vez.']);
    }
}

function manejarSolicitudesEmpleados(PDO $pdo): never
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($metodo === 'GET') {
        $buscar = trim((string) ($_GET['buscar'] ?? ''));
        $pagina = max(1, (int) ($_GET['pagina'] ?? 1));
        $porPagina = min(50, max(5, (int) ($_GET['por_pagina'] ?? 10)));
        $offset = ($pagina - 1) * $porPagina;
        $where = '';
        $parametros = [];
        if ($buscar !== '') {
            $where = ' WHERE nombre LIKE :buscar_nombre OR numero_documento LIKE :buscar_documento OR cargo LIKE :buscar_cargo ';
            $valor = "%{$buscar}%";
            $parametros = [':buscar_nombre' => $valor, ':buscar_documento' => $valor, ':buscar_cargo' => $valor];
        }

        $total = $pdo->prepare("SELECT COUNT(*) FROM empleados {$where}");
        $total->execute($parametros);
        $consulta = $pdo->prepare("SELECT id, nombre, tipo_documento, numero_documento, edad, sexo, telefono, cargo FROM empleados {$where} ORDER BY id ASC LIMIT :limite OFFSET :offset");
        foreach ($parametros as $clave => $valor) {
            $consulta->bindValue($clave, $valor, PDO::PARAM_STR);
        }
        $consulta->bindValue(':limite', $porPagina, PDO::PARAM_INT);
        $consulta->bindValue(':offset', $offset, PDO::PARAM_INT);
        $consulta->execute();
        responder(200, [
            'ok' => true,
            'empleados' => $consulta->fetchAll(),
            'total' => (int) $total->fetchColumn(),
            'pagina' => $pagina,
            'por_pagina' => $porPagina,
            'csrf_token' => $_SESSION['csrf_token'],
        ]);
    }

    if ($metodo === 'POST') {
        verificarCsrf();
        $empleado = validarEmpleado(obtenerJson());
        $sql = 'INSERT INTO empleados (nombre, tipo_documento, numero_documento, edad, sexo, telefono, cargo) VALUES (:nombre, :tipo_documento, :numero_documento, :edad, :sexo, :telefono, :cargo)';
        $pdo->prepare($sql)->execute($empleado);
        responder(201, ['ok' => true, 'mensaje' => 'Empleado registrado correctamente.', 'id' => (int) $pdo->lastInsertId()]);
    }

    if ($metodo === 'PUT') {
        verificarCsrf();
        $id = idSolicitado();
        $existe = $pdo->prepare('SELECT 1 FROM empleados WHERE id = ?');
        $existe->execute([$id]);
        if (!$existe->fetchColumn()) {
            responder(404, ['ok' => false, 'mensaje' => 'Empleado no encontrado.']);
        }
        $empleado = validarEmpleado(obtenerJson());
        $empleado['id'] = $id;
        $sql = 'UPDATE empleados SET nombre = :nombre, tipo_documento = :tipo_documento, numero_documento = :numero_documento, edad = :edad, sexo = :sexo, telefono = :telefono, cargo = :cargo WHERE id = :id';
        $pdo->prepare($sql)->execute($empleado);
        responder(200, ['ok' => true, 'mensaje' => 'Empleado actualizado correctamente.']);
    }

    if ($metodo === 'DELETE') {
        verificarCsrf();
        $eliminar = $pdo->prepare('DELETE FROM empleados WHERE id = ?');
        $eliminar->execute([idSolicitado()]);
        if ($eliminar->rowCount() === 0) {
            responder(404, ['ok' => false, 'mensaje' => 'Empleado no encontrado.']);
        }
        responder(200, ['ok' => true, 'mensaje' => 'Empleado eliminado correctamente.']);
    }

    header('Allow: GET, POST, PUT, DELETE');
    responder(405, ['ok' => false, 'mensaje' => 'Método no permitido.']);
}
