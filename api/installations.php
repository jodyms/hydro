<?php
require 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

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
        error_log("Activity log error: " . $e->getMessage());
    }
}

if ($action === 'list') {
    $user_id = $_GET['user_id'] ?? null;
    $show_all = isset($_GET['show_all']) ? $_GET['show_all'] === 'true' : true;

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

        if ($show_all || !$user_id) {
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
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $company_id = $data['companyId'] ?? null;
    $products = $data['products'] ?? [];
    $user_id = $data['user_id'] ?? null;
    
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
                $user_id  // assigned_to = user yang membuat
            ]);
            $newId = $pdo->lastInsertId();
            logActivity($pdo, $newId, $company_id, 'CREATE', 
                'Produk baru ditambahkan: ' . $prod['productName'], 
                $user_id, null, 
                ['product_name' => $prod['productName'], 'replacement_date' => $prod['replacementDate'], 'cycle' => ($prod['recurringValue'] ?? '') . ' ' . ($prod['recurringUnit'] ?? '')]
            );
        }
        
        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Work Order berhasil disimpan.']);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $user_id = $data['user_id'] ?? null;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'ID wajib diisi.']);
        exit;
    }
    
    try {
        // Get old values first
        $stmtOld = $pdo->prepare("SELECT * FROM installations WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldRecord = $stmtOld->fetch();
        
        $fields = [];
        $params = [];
        
        if (isset($data['productName'])) { $fields[] = "product_name = ?"; $params[] = $data['productName']; }
        if (isset($data['installationDate'])) { $fields[] = "installation_date = ?"; $params[] = $data['installationDate']; }
        if (isset($data['recurringValue'])) { $fields[] = "maintenance_cycle_value = ?"; $params[] = $data['recurringValue']; }
        if (isset($data['recurringUnit'])) { $fields[] = "maintenance_cycle_unit = ?"; $params[] = $data['recurringUnit']; }
        if (isset($data['status'])) { $fields[] = "status = ?"; $params[] = $data['status']; }
        if (isset($data['notes'])) { $fields[] = "notes = ?"; $params[] = $data['notes']; }
        if (isset($data['replacementDate'])) { $fields[] = "replacement_date = ?"; $params[] = $data['replacementDate']; }
        if (isset($data['visit_schedule_date'])) { $fields[] = "visit_schedule_date = ?"; $params[] = $data['visit_schedule_date']; }
        if (isset($data['is_history'])) { $fields[] = "is_history = ?"; $params[] = $data['is_history']; }
        if (isset($data['assigned_to'])) { $fields[] = "assigned_to = ?"; $params[] = $data['assigned_to']; }
        
        $fields[] = "updated_by = ?";
        $params[] = $user_id;
        
        $params[] = $id;
        
        $sql = "UPDATE installations SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Log the edit
        if ($oldRecord) {
            logActivity($pdo, $id, $oldRecord['company_id'], 'EDIT',
                'Data diperbarui: ' . ($oldRecord['product_name'] ?? ''),
                $user_id,
                ['product_name' => $oldRecord['product_name'], 'status' => $oldRecord['status'], 'replacement_date' => $oldRecord['replacement_date']],
                $data
            );
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Data berhasil diperbarui.']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $user_id = $data['user_id'] ?? null;
    
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
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'renew' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    $next_date = $data['nextDate'] ?? null;
    $user_id = $data['user_id'] ?? null;
    
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
        
        // 3. Insert new record — keep assigned_to from old record (ownership stays the same)
        $final_product = $new_product_name ?: $current['product_name'];
        $final_install_date = $new_install_date ?: date('Y-m-d');
        $final_cycle_value = $new_cycle_value ?: $current['maintenance_cycle_value'];
        $final_cycle_unit = $new_cycle_unit ?: $current['maintenance_cycle_unit'];
        $keep_assigned_to = $current['assigned_to'] ?: $user_id;
        
        $stmtNew = $pdo->prepare("INSERT INTO installations (company_id, product_name, installation_date, replacement_date, maintenance_cycle_value, maintenance_cycle_unit, status, notes, created_by, assigned_to) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
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
            $keep_assigned_to  // Keep same assigned_to from old record
        ]);
        $newRecordId = $pdo->lastInsertId();
        
        // Log both: archive of old + creation of new
        logActivity($pdo, $id, $current['company_id'], 'RENEW',
            'Produk diperpanjang: ' . $current['product_name'] . ' → ' . $final_product,
            $user_id,
            ['product_name' => $current['product_name'], 'replacement_date' => $current['replacement_date'], 'status' => $current['status']],
            ['product_name' => $final_product, 'replacement_date' => $next_date, 'new_id' => $newRecordId, 'notes' => $renew_notes]
        );
        
        $pdo->commit();
        echo json_encode(['status' => 'success', 'message' => 'Siklus baru berhasil dibuat.']);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'transfer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $company_id = $data['company_id'] ?? null;
    $from_user_id = $data['from_user_id'] ?? null;
    $to_user_id = $data['to_user_id'] ?? null;
    $reason = $data['reason'] ?? '';
    $assigned_by = $data['user_id'] ?? null; // Who did the transfer
    
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
        
        // 1. Update all installations for this company from old user to new user
        if ($from_user_id) {
            $stmt = $pdo->prepare("UPDATE installations SET assigned_to = ?, updated_by = ? WHERE company_id = ? AND assigned_to = ?");
            $stmt->execute([$to_user_id, $assigned_by, $company_id, $from_user_id]);
        } else {
            // If from_user_id is null, transfer ALL unassigned + all for this company
            $stmt = $pdo->prepare("UPDATE installations SET assigned_to = ?, updated_by = ? WHERE company_id = ?");
            $stmt->execute([$to_user_id, $assigned_by, $company_id]);
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
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'bulk_assign' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $installation_ids = $data['installation_ids'] ?? [];
    $to_user_id = $data['to_user_id'] ?? null;
    $visit_date = $data['visit_date'] ?? null;
    $assigned_by = $data['user_id'] ?? null;
    
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
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'bulk_toggle_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $ids = $data['ids'] ?? [];
    $user_id = $data['user_id'] ?? null;
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
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'bulk_update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $items = $data['items'] ?? [];
    $user_id = $data['user_id'] ?? null;

    if (empty($items)) {
        echo json_encode(['status' => 'error', 'message' => 'Tidak ada data untuk diperbarui.']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("UPDATE installations SET product_name = ?, installation_date = ?, replacement_date = ?, maintenance_cycle_value = ?, maintenance_cycle_unit = ?, status = ?, notes = ?, updated_by = ? WHERE id = ?");
        
        $updated = 0;
        foreach ($items as $item) {
            $stmtOld = $pdo->prepare("SELECT * FROM installations WHERE id = ?");
            $stmtOld->execute([$item['id']]);
            $old = $stmtOld->fetch(PDO::FETCH_ASSOC);

            $stmt->execute([
                $item['product_name'],
                $item['installation_date'] ?: null,
                $item['replacement_date'],
                $item['maintenance_cycle_value'] ?? null,
                $item['maintenance_cycle_unit'] ?? 'months',
                $item['status'] ?? 'Scheduled',
                $item['notes'] ?? null,
                $user_id,
                $item['id']
            ]);
            $updated++;

            if ($old) {
                logActivity($pdo, $item['id'], $old['company_id'], 'EDIT',
                    'Data diperbarui (Bulk): ' . $item['product_name'],
                    $user_id,
                    ['product_name' => $old['product_name'], 'status' => $old['status'], 'replacement_date' => $old['replacement_date']],
                    $item
                );
            }
        }
        
        $pdo->commit();
        echo json_encode([
            'status' => 'success', 
            'message' => "{$updated} produk berhasil diperbarui.",
            'updated' => $updated
        ]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Aksi tidak valid.']);
?>
