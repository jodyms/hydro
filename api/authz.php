<?php

function authz_json_error($statusCode, $message)
{
    http_response_code($statusCode);
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

function authz_get_header_value($name)
{
    $normalized = strtoupper(str_replace('-', '_', $name));
    $serverKey = 'HTTP_' . $normalized;

    if (!empty($_SERVER[$name])) {
        return $_SERVER[$name];
    }

    if (!empty($_SERVER[$normalized])) {
        return $_SERVER[$normalized];
    }

    if (!empty($_SERVER[$serverKey])) {
        return $_SERVER[$serverKey];
    }

    if (!empty($_SERVER['REDIRECT_' . $serverKey])) {
        return $_SERVER['REDIRECT_' . $serverKey];
    }

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === strtolower($name)) {
                return $value;
            }
        }
    }

    return null;
}

function authz_get_bearer_token()
{
    $header = authz_get_header_value('Authorization');
    if (!$header) {
        return null;
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return null;
}

function authz_load_context(PDO $pdo)
{
    static $cached = null;
    static $loaded = false;

    if ($loaded) {
        return $cached;
    }
    $loaded = true;

    $token = authz_get_bearer_token();
    if (!$token) {
        $cached = null;
        return null;
    }

    $stmt = $pdo->prepare(
        "SELECT u.id, u.username, u.email, u.role_id, u.status, r.role_name
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE us.id = ?
           AND (us.expires_at IS NULL OR us.expires_at > NOW())
         LIMIT 1"
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || ($user['status'] ?? '') !== 'active') {
        $cached = null;
        return null;
    }

    $permStmt = $pdo->prepare(
        "SELECT p.permission_name
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ?"
    );
    $permStmt->execute([$user['role_id']]);
    $permissions = $permStmt->fetchAll(PDO::FETCH_COLUMN);

    $cached = [
        'token' => $token,
        'user_id' => (int)$user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'role_id' => (int)$user['role_id'],
        'role_name' => $user['role_name'],
        'permissions' => $permissions ?: [],
    ];

    return $cached;
}

function authz_require_auth(PDO $pdo)
{
    $token = authz_get_bearer_token();
    if (!$token) {
        authz_json_error(401, 'Akses ditolak. Token otorisasi tidak ditemukan.');
    }

    $ctx = authz_load_context($pdo);
    if (!$ctx) {
        authz_json_error(401, 'Akses ditolak. Sesi tidak valid atau sudah berakhir.');
    }
    return $ctx;
}

function authz_has_permission($ctx, $permission)
{
    if (!$ctx || empty($ctx['permissions'])) {
        return false;
    }
    return in_array('all_access', $ctx['permissions'], true) || in_array($permission, $ctx['permissions'], true);
}

function authz_require_permission($ctx, $permission)
{
    if (!authz_has_permission($ctx, $permission)) {
        authz_json_error(403, 'Akses ditolak. Otoritas tidak mencukupi.');
    }
}

function authz_require_any_permission($ctx, array $permissions)
{
    foreach ($permissions as $perm) {
        if (authz_has_permission($ctx, $perm)) {
            return;
        }
    }
    authz_json_error(403, 'Akses ditolak. Otoritas tidak mencukupi.');
}

function authz_get_bool($value, $default = false)
{
    if ($value === null) {
        return $default;
    }
    if (is_bool($value)) {
        return $value;
    }
    $v = strtolower(trim((string)$value));
    return in_array($v, ['1', 'true', 'yes', 'on'], true);
}

function authz_allow_show_all($ctx, $requested, array $showAllPermissions)
{
    if (!$requested) {
        return false;
    }
    foreach ($showAllPermissions as $perm) {
        if (authz_has_permission($ctx, $perm)) {
            return true;
        }
    }
    return false;
}
