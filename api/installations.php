<?php
require 'db.php';
require_once 'authz.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$auth = authz_require_auth($pdo);

// Helper: log activity for installation changes
function logActivity($pdo, $installationId, $companyId, $actionType, $description, $userId, $oldValues = null, $newValues = null) {
    try {
        $stmt = $pdo->prepare("INSERT INTO installation_activity_logs (installation_id, company_id, action_type, description, old_values, new_values, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $installationId,
            $companyId,
            $actionType,
            $description,
            $oldValues ? json_encode($oldValues) : null,
            $newValues ? json_encode($newValues) : null,
            $userId
        ]);
    } catch (PDOException $e) {
        // Silently fail - don't break main flow for logging
    }
}

function getInstallationAuditSnapshot($pdo, $installationId) {
    $stmt = $pdo->prepare("SELECT i.*, c.name as company_name, u.username as assigned_to_name
                           FROM installations i
                           LEFT JOIN companies c ON i.company_id = c.id
                           LEFT JOIN users u ON i.assigned_to = u.id
                           WHERE i.id = ?");
    $stmt->execute([$installationId]);
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function formatInstallationCycleUnit($unit) {
    $u = strtolower(trim((string) $unit));
    if ($u === 'days' || $u === 'day' || $u === 'hari') return 'Hari';
    if ($u === 'months' || $u === 'month' || $u === 'bulan') return 'Bulan';
    if ($u === 'years' || $u === 'year' || $u === 'tahun') return 'Tahun';
    return trim((string) $unit);
}

function formatAuditValue($value) {
    return ($value === null || $value === '') ? '-' : $value;
}

function normalizeInstallationAuditValues($record) {
    if (!$record) return [];

    $values = [];

    if (array_key_exists('company_name', $record)) $values['company_name'] = formatAuditValue($record['company_name']);
    if (array_key_exists('product_name', $record)) $values['product_name'] = formatAuditValue($record['product_name']);
    if (array_key_exists('installation_date', $record)) $values['installation_date'] = formatAuditValue($record['installation_date']);
    if (array_key_exists('replacement_date', $record)) $values['replacement_date'] = formatAuditValue($record['replacement_date']);
    if (array_key_exists('visit_schedule_date', $record)) $values['visit_schedule_date'] = formatAuditValue($record['visit_schedule_date']);
    if (array_key_exists('followup_date', $record)) $values['followup_date'] = formatAuditValue($record['followup_date']);
    if (array_key_exists('status', $record)) $values['status'] = formatAuditValue($record['status']);
    if (array_key_exists('notes', $record)) $values['notes'] = formatAuditValue($record['notes']);
    if (array_key_exists('assigned_to_name', $record)) $values['assigned_to_name'] = formatAuditValue($record['assigned_to_name']);
    if (array_key_exists('status_active', $record)) $values['status_active'] = (string) ($record['status_active'] ?? '1');

    if (array_key_exists('maintenance_cycle_value', $record) || array_key_exists('maintenance_cycle_unit', $record)) {
        $cycleValue = $record['maintenance_cycle_value'] ?? null;
        $cycleUnit = formatInstallationCycleUnit($record['maintenance_cycle_unit'] ?? '');
        $cycle = trim(($cycleValue ? $cycleValue . ' ' : '') . $cycleUnit);
        if ($cycle !== '') $values['maintenance_cycle'] = $cycle;
    }

    return $values;
}

function filterInstallationAuditValues($values, $keys) {
    return array_intersect_key($values, array_flip($keys));
}

function diffInstallationAuditValues($oldRecord, $newRecord, $keys = null) {
    $oldValues = normalizeInstallationAuditValues($oldRecord);
    $newValues = normalizeInstallationAuditValues($newRecord);

    if (is_array($keys) && !empty($keys)) {
        $oldValues = filterInstallationAuditValues($oldValues, $keys);
        $newValues = filterInstallationAuditValues($newValues, $keys);
    }

    $allKeys = array_unique(array_merge(array_keys($oldValues), array_keys($newValues)));
    $changedOld = [];
    $changedNew = [];

    foreach ($allKeys as $key) {
        $oldValue = $oldValues[$key] ?? '-';
        $newValue = $newValues[$key] ?? '-';

        if ((string) $oldValue !== (string) $newValue) {
            $changedOld[$key] = $oldValue;
            $changedNew[$key] = $newValue;
        }
    }

    return [$changedOld, $changedNew];
}

function buildStatusChangeAuditValues($oldRecord, $newRecord) {
    $oldValues = filterInstallationAuditValues(normalizeInstallationAuditValues($oldRecord), ['status', 'notes']);
    $newValues = filterInstallationAuditValues(normalizeInstallationAuditValues($newRecord), ['status', 'notes']);

    $oldStatus = $oldValues['status'] ?? '-';
    $newStatus = $newValues['status'] ?? '-';

    if ((string) $oldStatus === (string) $newStatus) {
        return [[], []];
    }

    $payloadOld = ['status' => $oldStatus];
    $payloadNew = ['status' => $newStatus];

    $oldNotes = $oldValues['notes'] ?? '-';
    $newNotes = $newValues['notes'] ?? '-';
    if ($oldNotes !== '-' || $newNotes !== '-') {
        $payloadOld['notes'] = $oldNotes;
        $payloadNew['notes'] = $newNotes;
    }

    return [$payloadOld, $payloadNew];
}

if ($action === 'list') {
    authz_require_any_permission($auth, ['installation_read', 'sales_read', 'workorder_read', 'prospecting_read', 'history_read', 'dashboard_read']);
    $user_id = $auth['user_id'];
    $requestedShowAll = authz_get_bool($_GET['show_all'] ?? null, false);
    $show_all = authz_allow_show_all($auth, $requestedShowAll, [
        'installation_showall',
        'sales_showall',
        'workorder_showall',
        'prospecting_showall',
        'history_showall',
        'dashboard_showall',
    ]);

    try {
        $base_query = "SELECT i.*, c.name as company_name, ct.type_name as company_type, r.region_name as region,
                       u.username as creator_name, u2.username as last_editor_name,
                       u3.username as assigned_to_name
                       FROM installations i
                       LEFT JOIN companies c ON i.company_id = c.id
                       LEFT JOIN company_types ct ON c.type_id = ct.id
                       LEFT JOIN regions r ON c.region_id = r.id
                       LEFT JOIN users u ON i.created_by = u.id
                       LEFT JOIN users u2 ON i.updated_by = u2.id
                       LEFT JOIN users u3 ON i.assigned_to = u3.id";

        if ($show_all) {
            // No filter: return all
            $stmt = $pdo->prepare($base_query . " ORDER BY i.replacement_date ASC");
            $stmt->execute();
        } else {
            // Filter: only show installations assigned to user OR their teammates
            $stmt = $pdo->prepare($base_query . "
                       WHERE i.assigned_to = ?
                          OR i.assigned_to IN (
                              SELECT DISTINCT tm2.user_id FROM team_members tm1
                              JOIN team_members tm2 ON tm1.team_id = tm2.team_id
                              WHERE tm1.user_id = ?
                          )
                       ORDER BY i.replacement_date ASC");
            $stmt->execute([$user_id, $user_id]);
        }

        $data = $stmt->fetchAll();
        echo json_encode(['status' => 'success', 'data' => $data]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengambil data instalasi.']);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_create', 'installation_create', 'workorder_create']);
    $data = json_decode(file_get_contents("php://input"), true);
    
    $company_id = $data['companyId'] ?? null;
    $products = $data['products'] ?? [];
    $user_id = $auth['user_id'];
    $override_assigned_to = $data['assigned_to'] ?? null;
    if (!authz_has_permission($auth, 'installation_transfer')) {
        $override_assigned_to = $user_id;
    }
    
    if (!$company_id || empty($products)) {
        echo json_encode(['status' => 'error', 'message' => 'Company dan Produk wajib diisi.']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("INSERT INTO installations (company_id, product_name, installation_date, replacement_date, maintenance_cycle_value, maintenance_cycle_unit, status, created_by, assigned_to) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        foreach ($products as $prod) {
            $stmt->execute([
                $company_id,
                $prod['productName'],
                $prod['installationDate'] ?: null,
                $prod['replacementDate'],
                $prod['recurringValue'] ?? null,
                $prod['recurringUnit'] ?? 'months',
                $prod['status'] ?? 'Scheduled',
                $user_id,
                $override_assigned_to ?? $user_id
            ]);
            $newId = $pdo->lastInsertId();
            $newSnapshot = getInstallationAuditSnapshot($pdo, $newId);
            logActivity($pdo, $newId, $company_id, 'CREATE',
                'Produk baru ditambahkan: ' . $prod['productName'],
                $user_id, null,
                filterInstallationAuditValues(
                    normalizeInstallationAuditValues($newSnapshot),
                    ['company_name', 'product_name', 'installation_date', 'replacement_date', 'maintenance_cycle', 'status', 'assigned_to_name']
                )
            );
        }
        
        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Work Order berhasil disimpan.']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan work order.']);
    }
    exit;
}

if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_update', 'installation_update', 'workorder_update']);
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $user_id = $auth['user_id'];
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']);
        exit;
    }
    
    try {
        $oldRecord = getInstallationAuditSnapshot($pdo, $id);
        
        $fields = [];
        $params = [];
        
        if (isset($data['productName'])) { $fields[] = "product_name = ?"; $params[] = $data['productName']; }
        if (isset($data['installationDate'])) { $fields[] = "installation_date = ?"; $params[] = $data['installationDate']; }
        if (isset($data['recurringValue'])) { $fields[] = "maintenance_cycle_value = ?"; $params[] = $data['recurringValue']; }
        if (isset($data['recurringUnit'])) { $fields[] = "maintenance_cycle_unit = ?"; $params[] = $data['recurringUnit']; }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        if (isset($data['notes'])) { $fields[] = "notes = ?"; $params[] = $data['notes']; }
        if (isset($data['replacementDate'])) { $fields[] = "replacement_date = ?"; $params[] = $data['replacementDate']; }
        if (isset($data['followup_date'])) { $fields[] = "followup_date = ?"; $params[] = $data['followup_date']; }
        if (isset($data['visit_schedule_date'])) { $fields[] = "visit_schedule_date = ?"; $params[] = $data['visit_schedule_date']; }
        if (isset($data['is_history'])) { $fields[] = "is_history = ?"; $params[] = $data['is_history']; }
        if (isset($data['assigned_to'])) { $fields[] = "assigned_to = ?"; $params[] = $data['assigned_to']; }
        
        $fields[] = "updated_by = ?";
        $params[] = $user_id;
        
        $params[] = $id;
        
        $sql = "UPDATE installations SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $newRecord = getInstallationAuditSnapshot($pdo, $id);

        if ($oldRecord && $newRecord) {
            [$statusOld, $statusNew] = buildStatusChangeAuditValues($oldRecord, $newRecord);
            if (!empty($statusNew)) {
                logActivity($pdo, $id, $newRecord['company_id'], 'STATUS_CHANGE',
                    'Status diperbarui: ' . ($newRecord['product_name'] ?? $oldRecord['product_name'] ?? ''),
                    $user_id,
                    $statusOld,
                    $statusNew
                );
            }

            [$editOld, $editNew] = diffInstallationAuditValues($oldRecord, $newRecord);
            unset($editOld['status'], $editNew['status']);

            if (!empty($editNew)) {
                logActivity($pdo, $id, $newRecord['company_id'], 'EDIT',
                    'Data diperbarui: ' . ($newRecord['product_name'] ?? $oldRecord['product_name'] ?? ''),
                    $user_id,
                    $editOld,
                    $editNew
                );
            }
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Data berhasil diperbarui.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui data instalasi.']);
    }
    exit;
}

if ($action === 'toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_delete', 'installation_delete', 'workorder_delete']);
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $user_id = $auth['user_id'];
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']);
        exit;
    }
    
    try {
        $stmtOld = $pdo->prepare("SELECT * FROM installations WHERE id = ?");
        $stmtOld->execute([$id]);
        $old = $stmtOld->fetch();
        
        $stmt = $pdo->prepare("UPDATE installations SET status_active = NOT IFNULL(status_active, 1), updated_by = ? WHERE id = ?");
        $stmt->execute([$user_id, $id]);
        
        if ($old) {
            $wasActive = $old['status_active'] ?? 1;
            $newActive = $wasActive ? 0 : 1;
            logActivity($pdo, $id, $old['company_id'], 'TOGGLE',
                ($newActive ? 'Diaktifkan' : 'Dinonaktifkan') . ': ' . $old['product_name'],
                $user_id,
                ['status_active' => $wasActive],
                ['status_active' => $newActive]
            );
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Status berhasil diubah.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah status instalasi.']);
    }
    exit;
}

if ($action === 'renew' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_update', 'installation_update', 'workorder_update']);
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $next_date = $data['nextDate'] ?? null;
    $user_id = $auth['user_id'];
    
    // New form fields (optional, falls back to current values)
    $new_product_name = $data['newProductName'] ?? null;
    $new_install_date = $data['newInstallDate'] ?? null;
    $new_cycle_value = $data['newCycleValue'] ?? null;
    $new_cycle_unit = $data['newCycleUnit'] ?? null;
    $renew_notes = $data['renewNotes'] ?? '';
    
    if (!$id || !$next_date) {
        echo json_encode(['status' => 'error', 'message' => 'ID dan Next Date wajib diisi.']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        // 1. Get current record
        $stmt = $pdo->prepare("SELECT * FROM installations WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch();
        $currentSnapshot = getInstallationAuditSnapshot($pdo, $id);
        
        if (!$current) {
            throw new Exception("Record not found.");
        }
        
        // 2. Archive current record with notes
        $archive_notes = 'Lengkap & Diperpanjang ke siklus baru';
        if ($renew_notes) {
            $archive_notes .= ' | Catatan: ' . $renew_notes;
        }
        $stmtDone = $pdo->prepare("UPDATE installations SET status = 'Done', is_history = 1, notes = ?, updated_by = ? WHERE id = ?");
        $stmtDone->execute([$archive_notes, $user_id, $id]);
        $doneSnapshot = getInstallationAuditSnapshot($pdo, $id);
        
        // 3. Insert new record — keep assigned_to from old record (ownership stays the same)
        $final_product = $new_product_name ?: $current['product_name'];
        $final_install_date = $new_install_date ?: date('Y-m-d');
        $final_cycle_value = $new_cycle_value ?: $current['maintenance_cycle_value'];
        $final_cycle_unit = $new_cycle_unit ?: $current['maintenance_cycle_unit'];
        $keep_assigned_to = $current['assigned_to'] ?: $user_id;
        
        $stmtNew = $pdo->prepare("INSERT INTO installations (company_id, product_name, installation_date, replacement_date, maintenance_cycle_value, maintenance_cycle_unit, status, notes, created_by, assigned_to, renew_count)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmtNew->execute([
            $current['company_id'],
            $final_product,
            $final_install_date,
            $next_date,
            $final_cycle_value,
            $final_cycle_unit,
            'Scheduled',
            $renew_notes ? 'Perpanjangan: ' . $renew_notes : null,
            $user_id,
            $keep_assigned_to,  // Keep same assigned_to from old record
            ($current['renew_count'] ?? 0) + 1
        ]);
        $newRecordId = $pdo->lastInsertId();
        $newSnapshot = getInstallationAuditSnapshot($pdo, $newRecordId);

        if ($currentSnapshot && $doneSnapshot) {
            [$statusOld, $statusNew] = buildStatusChangeAuditValues($currentSnapshot, $doneSnapshot);
            if (!empty($statusNew)) {
                logActivity($pdo, $id, $current['company_id'], 'STATUS_CHANGE',
                    'Status diperbarui: ' . ($current['product_name'] ?? ''),
                    $user_id,
                    $statusOld,
                    $statusNew
                );
            }
        }
        
        // Log both: archive of old + creation of new
        logActivity($pdo, $id, $current['company_id'], 'RENEW',
            'Produk diperpanjang: ' . $current['product_name'] . ' → ' . $final_product,
            $user_id,
            filterInstallationAuditValues(
                normalizeInstallationAuditValues($currentSnapshot),
                ['product_name', 'replacement_date', 'maintenance_cycle', 'status']
            ),
            filterInstallationAuditValues(
                normalizeInstallationAuditValues($newSnapshot),
                ['product_name', 'installation_date', 'replacement_date', 'maintenance_cycle', 'status', 'notes', 'assigned_to_name']
            )
        );
        
        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Siklus baru berhasil dibuat.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal memproses perpanjangan siklus.']);
    }
    exit;
}

if ($action === 'transfer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_permission($auth, 'installation_transfer');
    $data = json_decode(file_get_contents("php://input"), true);
    $company_id = $data['company_id'] ?? null;
    $from_user_id = $data['from_user_id'] ?? null;
    $to_user_id = $data['to_user_id'] ?? null;
    $reason = $data['reason'] ?? '';
    $assigned_by = $auth['user_id']; // Who did the transfer
    
    if (!$company_id || !$to_user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Company ID dan User tujuan wajib diisi.']);
        exit;
    }
    
    if ($from_user_id == $to_user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User asal dan tujuan tidak boleh sama.']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $installation_id = $data['installation_id'] ?? null;
        
        if ($installation_id) {
            // 1. Transfer only ONE specific installation
            $stmt = $pdo->prepare("UPDATE installations SET assigned_to = ?, updated_by = ? WHERE id = ?");
            $stmt->execute([$to_user_id, $assigned_by, $installation_id]);
        } else {
            // 2. Original behavior: Update all installations for this company from old user to new user
            if ($from_user_id) {
                $stmt = $pdo->prepare("UPDATE installations SET assigned_to = ?, updated_by = ? WHERE company_id = ? AND assigned_to = ?");
                $stmt->execute([$to_user_id, $assigned_by, $company_id, $from_user_id]);
            } else {
                // If from_user_id is null, transfer ALL for this company
                $stmt = $pdo->prepare("UPDATE installations SET assigned_to = ?, updated_by = ? WHERE company_id = ?");
                $stmt->execute([$to_user_id, $assigned_by, $company_id]);
            }
        }
        $affected = $stmt->rowCount();
        
        // 2. Log the handover
        $logStmt = $pdo->prepare("INSERT INTO handover_logs (company_id, from_sales_id, to_sales_id, assigned_by, handover_reason) VALUES (?, ?, ?, ?, ?)");
        $logStmt->execute([$company_id, $from_user_id, $to_user_id, $assigned_by, $reason ?: 'Transfer via sistem']);
        
        $pdo->commit();
        echo json_encode([
            'status' => 'success', 
            'message' => "Berhasil transfer {$affected} instalasi ke user baru.",
            'affected' => $affected
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal memproses transfer instalasi.']);
    }
    exit;
}

if ($action === 'bulk_assign' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_permission($auth, 'prospecting_assign');
    $data = json_decode(file_get_contents("php://input"), true);
    $installation_ids = $data['installation_ids'] ?? [];
    $to_user_id = $data['to_user_id'] ?? null;
    $visit_date = $data['visit_date'] ?? null;
    $assigned_by = $auth['user_id'];
    
    if (empty($installation_ids) || !$to_user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Data instalasi dan User tujuan wajib diisi.']);
        exit;
    }
    
    try {
        $pdo->beginTransaction();
        
        $placeholders = implode(',', array_fill(0, count($installation_ids), '?'));
        $sql = "UPDATE installations SET assigned_to = ?, updated_by = ?";
        $params = [$to_user_id, $assigned_by];
        
        if ($visit_date) {
            $sql .= ", visit_schedule_date = ?";
            $params[] = $visit_date;
        }
        
        $sql .= " WHERE id IN ($placeholders)";
        $params = array_merge($params, $installation_ids);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $affected = $stmt->rowCount();
        
        $pdo->commit();
        echo json_encode([
            'status' => 'success', 
            'message' => "Berhasil menjadwalkan {$affected} tugas ke agent.",
            'affected' => $affected
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal memproses penugasan bulk.']);
    }
    exit;
}

if ($action === 'bulk_schedule_visit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_permission($auth, 'prospecting_assign');
    $data = json_decode(file_get_contents("php://input"), true);
    $installation_ids = $data['installation_ids'] ?? [];
    $visit_date = $data['visit_date'] ?? null;
    $user_id = $auth['user_id'];

    if (empty($installation_ids) || !$visit_date) {
        echo json_encode(['status' => 'error', 'message' => 'Data instalasi dan tanggal kunjungan wajib diisi.']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $placeholders = implode(',', array_fill(0, count($installation_ids), '?'));

        $stmtOld = $pdo->prepare("SELECT * FROM installations WHERE id IN ($placeholders)");
        $stmtOld->execute($installation_ids);
        $oldRecords = $stmtOld->fetchAll(PDO::FETCH_ASSOC);

        $params = array_merge([$visit_date, $user_id], $installation_ids);
        $stmt = $pdo->prepare("UPDATE installations SET visit_schedule_date = ?, updated_by = ? WHERE id IN ($placeholders)");
        $stmt->execute($params);
        $affected = $stmt->rowCount();

        foreach ($oldRecords as $old) {
            logActivity($pdo, $old['id'], $old['company_id'], 'SCHEDULE_VISIT',
                'Jadwal kunjungan diperbarui: ' . ($old['product_name'] ?? ''),
                $user_id,
                ['visit_schedule_date' => $old['visit_schedule_date'] ?? null],
                ['visit_schedule_date' => $visit_date]
            );
        }

        $pdo->commit();
        echo json_encode([
            'status' => 'success',
            'message' => "Berhasil menjadwalkan kunjungan untuk {$affected} item.",
            'affected' => $affected
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal menyimpan jadwal kunjungan.']);
    }
    exit;
}

if ($action === 'bulk_toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_delete', 'installation_delete', 'workorder_delete']);
    $data = json_decode(file_get_contents("php://input"), true);
    $ids = $data['ids'] ?? [];
    $user_id = $auth['user_id'];
    $activate = $data['activate'] ?? false; // true = activate, false = deactivate

    if (empty($ids)) {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada item yang dipilih.']);
        exit;
    }

    try {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        $stmtOld = $pdo->prepare("SELECT * FROM installations WHERE id IN ($placeholders)");
        $stmtOld->execute($ids);
        $oldRecords = $stmtOld->fetchAll(PDO::FETCH_ASSOC);

        $new_status = $activate ? 1 : 0;
        $sql = "UPDATE installations SET status_active = ?, updated_by = ? WHERE id IN ($placeholders)";
        $params = array_merge([$new_status, $user_id], $ids);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $affected = $stmt->rowCount();
        
        foreach ($oldRecords as $old) {
            logActivity($pdo, $old['id'], $old['company_id'], 'TOGGLE',
                ($activate ? 'Diaktifkan (Bulk)' : 'Dinonaktifkan (Bulk)') . ': ' . $old['product_name'],
                $user_id,
                ['status_active' => $old['status_active']],
                ['status_active' => $new_status]
            );
        }
        
        $action_label = $activate ? 'diaktifkan' : 'dinonaktifkan';
        echo json_encode([
            'status' => 'success', 
            'message' => "{$affected} item berhasil {$action_label}.",
            'affected' => $affected
        ]);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => 'Gagal mengubah status data secara bulk.']);
    }
    exit;
}

if ($action === 'bulk_update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    authz_require_any_permission($auth, ['sales_update', 'installation_update', 'workorder_update']);
    $data = json_decode(file_get_contents("php://input"), true);
    $items = $data['items'] ?? [];
    $user_id = $auth['user_id'];

    if (empty($items)) {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada data untuk diperbarui.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        $updateStmt = $pdo->prepare("UPDATE installations SET product_name = ?, installation_date = ?, replacement_date = ?, followup_date = ?, maintenance_cycle_value = ?, maintenance_cycle_unit = ?, status = ?, notes = ?, updated_by = ? WHERE id = ?");
        
        $insertStmt = $pdo->prepare("INSERT INTO installations 
            (company_id, product_name, installation_date, replacement_date, followup_date, maintenance_cycle_value, maintenance_cycle_unit, status, notes, assigned_to, created_by, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $updated = 0;
        $created = 0;
        
        foreach ($items as $item) {
            if (empty($item['id'])) {
                // INSERT new item
                $company_id = $item['company_id'] ?? null;
                if (!$company_id) {
                    throw new PDOException('company_id wajib diisi untuk produk baru.');
                }
                
                $insertStmt->execute([
                    $company_id,
                    $item['product_name'] ?? '',
                    $item['installation_date'] ?: null,
                    $item['replacement_date'] ?? null,
                    $item['followup_date'] ?: null,
                    $item['maintenance_cycle_value'] ?? null,
                    $item['maintenance_cycle_unit'] ?? 'months',
                    $item['status'] ?? 'Scheduled',
                    $item['notes'] ?? null,
                    $item['assigned_to'] ?? null,
                    $user_id,
                    $user_id
                ]);
                $created++;
                
                $newId = $pdo->lastInsertId();
                $newSnapshot = getInstallationAuditSnapshot($pdo, $newId);
                if ($newSnapshot) {
                    logActivity($pdo, $newId, $company_id, 'CREATE',
                        'Produk baru ditambahkan (dari bulk edit): ' . ($item['product_name'] ?? ''),
                        $user_id, null,
                        filterInstallationAuditValues(
                            normalizeInstallationAuditValues($newSnapshot),
                            ['company_name', 'product_name', 'installation_date', 'replacement_date', 'maintenance_cycle', 'status', 'assigned_to_name']
                        )
                    );
                }
            } else {
                // UPDATE existing item
                $old = getInstallationAuditSnapshot($pdo, $item['id']);

                $updateStmt->execute([
                    $item['product_name'],
                    $item['installation_date'] ?: null,
                    $item['replacement_date'],
                    $item['followup_date'] ?: null,
                    $item['maintenance_cycle_value'] ?? null,
                    $item['maintenance_cycle_unit'] ?? 'months',
                    $item['status'] ?? 'Scheduled',
                    $item['notes'] ?? null,
                    $user_id,
                    $item['id']
                ]);
                $updated++;

                $new = getInstallationAuditSnapshot($pdo, $item['id']);

                if ($old && $new) {
                    [$statusOld, $statusNew] = buildStatusChangeAuditValues($old, $new);
                    if (!empty($statusNew)) {
                        logActivity($pdo, $item['id'], $new['company_id'], 'STATUS_CHANGE',
                            'Status diperbarui (Bulk): ' . ($new['product_name'] ?? $old['product_name'] ?? ''),
                            $user_id,
                            $statusOld,
                            $statusNew
                        );
                    }

                    [$editOld, $editNew] = diffInstallationAuditValues($old, $new);
                    unset($editOld['status'], $editNew['status']);

                    if (!empty($editNew)) {
                        logActivity($pdo, $item['id'], $new['company_id'], 'EDIT',
                            'Data diperbarui (Bulk): ' . ($new['product_name'] ?? $old['product_name'] ?? ''),
                            $user_id,
                            $editOld,
                            $editNew
                        );
                    }
                }
            }
        }
        
        $pdo->commit();
        echo json_encode([
            'status' => 'success', 
            'message' => "{$updated} produk diperbarui, {$created} produk ditambahkan.",
            'updated' => $updated,
            'created' => $created
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => 'Gagal memperbarui data produk secara bulk.']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
