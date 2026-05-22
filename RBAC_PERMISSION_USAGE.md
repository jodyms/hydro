# RBAC Permission Usage

Sumber daftar permission: `hydromar_sales.sql` (table `permissions`).

## Ringkasan

- Total permission: 53
- Frontend yang discan: seluruh `web-poc/src/**/*.{js,jsx,ts,tsx}`
- Backend yang discan: seluruh `api/*.php`

## Matriks Permission

| Permission | Frontend Usage | Backend Usage |
|---|---|---|
| `user_create` | `web-poc/src/App.jsx:4078` | `api/auth.php:60`<br>`api/setup_permissions.php:12` |
| `user_read` | `web-poc/src/App.jsx:343`<br>`web-poc/src/App.jsx:4067`<br>`web-poc/src/App.jsx:4596` | `api/roles.php:62`<br>`api/setup_permissions.php:13`<br>`api/users.php:9` |
| `user_update` | `web-poc/src/App.jsx:4060` | `api/auth.php:106`<br>`api/setup_permissions.php:14`<br>`api/users.php:49` |
| `user_delete` | `web-poc/src/App.jsx:4061` | `api/setup_permissions.php:15`<br>`api/users.php:72` |
| `user_showall` | `web-poc/src/App.jsx:4012` | `api/setup_permissions.php:16`<br>`api/setup_teams.php:36`<br>`api/users.php:12` |
| `role_create` | `web-poc/src/App.jsx:4227` | `api/roles.php:107`<br>`api/setup_permissions.php:18` |
| `role_read` | `web-poc/src/App.jsx:344`<br>`web-poc/src/App.jsx:4216`<br>`web-poc/src/App.jsx:4597` | `api/permissions.php:6`<br>`api/roles.php:34`<br>`api/roles.php:62`<br>`api/setup_permissions.php:19` |
| `role_update` | `web-poc/src/App.jsx:4209` | `api/roles.php:128`<br>`api/setup_permissions.php:20` |
| `role_delete` | `web-poc/src/App.jsx:4210` | `api/roles.php:150`<br>`api/setup_permissions.php:21` |
| `role_set_authority` | `web-poc/src/App.jsx:4208` | `api/permissions.php:6`<br>`api/roles.php:12`<br>`api/roles.php:78`<br>`api/setup_permissions.php:22` |
| `dashboard_read` | `web-poc/src/App.jsx:332`<br>`web-poc/src/App.jsx:4587`<br>`web-poc/src/App.jsx:958` | `api/installations.php:129`<br>`api/setup_permissions.php:24` |
| `sales_create` | `web-poc/src/App.jsx:2140` | `api/installations.php:179`<br>`api/setup_permissions.php:26` |
| `sales_read` | `web-poc/src/App.jsx:1881`<br>`web-poc/src/App.jsx:334`<br>`web-poc/src/App.jsx:4591` | `api/installations.php:129`<br>`api/setup_permissions.php:27` |
| `sales_update` | `web-poc/src/App.jsx:2217`<br>`web-poc/src/App.jsx:2278`<br>`web-poc/src/App.jsx:2279` | `api/installations.php:235`<br>`api/installations.php:343`<br>`api/installations.php:643`<br>`api/setup_permissions.php:28` |
| `sales_delete` | `web-poc/src/App.jsx:2171`<br>`web-poc/src/App.jsx:2172`<br>`web-poc/src/App.jsx:2200`<br>`web-poc/src/App.jsx:2238`<br>`web-poc/src/App.jsx:2259`<br>`web-poc/src/App.jsx:2280` | `api/installations.php:306`<br>`api/installations.php:595`<br>`api/setup_permissions.php:29` |
| `sales_showall` | `web-poc/src/App.jsx:1897` | `api/installations.php:134`<br>`api/setup_permissions.php:30`<br>`api/setup_teams.php:38` |
| `prospecting_read` | `web-poc/src/App.jsx:3073`<br>`web-poc/src/App.jsx:336`<br>`web-poc/src/App.jsx:4593` | `api/installations.php:129`<br>`api/setup_permissions.php:33` |
| `workorder_create` | - | `api/installations.php:179`<br>`api/setup_permissions.php:35` |
| `workorder_read` | `web-poc/src/App.jsx:3354`<br>`web-poc/src/App.jsx:4594` | `api/installations.php:129`<br>`api/setup_permissions.php:36` |
| `workorder_update` | - | `api/installations.php:235`<br>`api/installations.php:343`<br>`api/installations.php:643`<br>`api/setup_permissions.php:37` |
| `company_create` | `web-poc/src/App.jsx:1598` | `api/companies.php:70`<br>`api/setup_permissions.php:42` |
| `company_read` | `web-poc/src/App.jsx:1563`<br>`web-poc/src/App.jsx:339`<br>`web-poc/src/App.jsx:4588` | `api/companies.php:52`<br>`api/companies.php:9`<br>`api/setup_permissions.php:43` |
| `company_update` | `web-poc/src/App.jsx:1550` | `api/companies.php:115`<br>`api/companies.php:172`<br>`api/setup_permissions.php:44` |
| `company_delete` | `web-poc/src/App.jsx:1551` | `api/companies.php:159`<br>`api/setup_permissions.php:45` |
| `company_showall` | `web-poc/src/App.jsx:1473`<br>`web-poc/src/App.jsx:1727`<br>`web-poc/src/App.jsx:4492` | `api/companies.php:12`<br>`api/setup_permissions.php:46`<br>`api/setup_teams.php:41` |
| `pic_create` | `web-poc/src/App.jsx:1835` | `api/pics.php:49`<br>`api/setup_permissions.php:48` |
| `pic_read` | `web-poc/src/App.jsx:1800`<br>`web-poc/src/App.jsx:340`<br>`web-poc/src/App.jsx:4589` | `api/pics.php:9`<br>`api/setup_permissions.php:49` |
| `pic_update` | `web-poc/src/App.jsx:1787` | `api/pics.php:77`<br>`api/setup_permissions.php:50` |
| `pic_delete` | `web-poc/src/App.jsx:1788` | `api/pics.php:104`<br>`api/setup_permissions.php:51` |
| `history_read` | `web-poc/src/App.jsx:337`<br>`web-poc/src/App.jsx:3925`<br>`web-poc/src/App.jsx:4595` | `api/activity_logs.php:9`<br>`api/installations.php:129`<br>`api/setup_permissions.php:53` |
| `team_read` | `web-poc/src/App.jsx:345`<br>`web-poc/src/App.jsx:4394`<br>`web-poc/src/App.jsx:4598` | `api/setup_teams.php:28`<br>`api/teams.php:11`<br>`api/teams.php:45` |
| `team_create` | `web-poc/src/App.jsx:4405` | `api/setup_teams.php:29`<br>`api/teams.php:67` |
| `team_update` | `web-poc/src/App.jsx:4387` | `api/setup_teams.php:30`<br>`api/teams.php:102` |
| `team_delete` | `web-poc/src/App.jsx:4388` | `api/setup_teams.php:31`<br>`api/teams.php:139` |
| `team_showall` | `web-poc/src/App.jsx:4320` | `api/setup_teams.php:32`<br>`api/teams.php:14` |
| `dashboard_showall` | - | `api/installations.php:138`<br>`api/setup_teams.php:35` |
| `role_showall` | `web-poc/src/App.jsx:4135` | `api/roles.php:37`<br>`api/setup_teams.php:37` |
| `prospecting_showall` | - | `api/installations.php:136`<br>`api/setup_teams.php:39` |
| `workorder_showall` | `web-poc/src/App.jsx:3370`<br>`web-poc/src/App.jsx:3544`<br>`web-poc/src/App.jsx:4491`<br>`web-poc/src/App.jsx:690` | `api/inject_permissions.php:9`<br>`api/installations.php:135`<br>`api/setup_permissions.php:39`<br>`api/setup_teams.php:40` |
| `pic_showall` | `web-poc/src/App.jsx:1726`<br>`web-poc/src/App.jsx:4493` | `api/pics.php:12`<br>`api/setup_teams.php:42` |
| `history_showall` | `web-poc/src/App.jsx:3705` | `api/activity_logs.php:12`<br>`api/installations.php:137`<br>`api/setup_teams.php:43` |
| `region_read` | `web-poc/src/App.jsx:1686`<br>`web-poc/src/App.jsx:341`<br>`web-poc/src/App.jsx:4590` | `api/regions.php:9` |
| `region_create` | `web-poc/src/App.jsx:1697` | `api/regions.php:22` |
| `region_update` | `web-poc/src/App.jsx:1679` | `api/regions.php:43` |
| `region_delete` | `web-poc/src/App.jsx:1680` | `api/regions.php:64` |
| `workorder_delete` | - | `api/inject_permissions.php:8`<br>`api/installations.php:306`<br>`api/installations.php:595`<br>`api/setup_permissions.php:38` |
| `installation_transfer` | `web-poc/src/App.jsx:2222`<br>`web-poc/src/App.jsx:2904`<br>`web-poc/src/App.jsx:3535` | `api/inject_permissions.php:10`<br>`api/installations.php:186`<br>`api/installations.php:444`<br>`api/setup_permissions.php:40` |
| `prospecting_assign` | `web-poc/src/App.jsx:3199`<br>`web-poc/src/App.jsx:3245`<br>`web-poc/src/App.jsx:3256`<br>`web-poc/src/App.jsx:3275` | `api/installations.php:502`<br>`api/installations.php:547` |
| `installation_read` | `web-poc/src/App.jsx:2779`<br>`web-poc/src/App.jsx:335`<br>`web-poc/src/App.jsx:4592` | `api/installations.php:129` |
| `installation_update` | `web-poc/src/App.jsx:2903`<br>`web-poc/src/App.jsx:2966` | `api/installations.php:235`<br>`api/installations.php:343`<br>`api/installations.php:643` |
| `installation_delete` | - | `api/installations.php:306`<br>`api/installations.php:595` |
| `installation_showall` | `web-poc/src/App.jsx:2628` | `api/installations.php:133` |
| `all_access` | `web-poc/src/App.jsx:351`<br>`web-poc/src/App.jsx:3705`<br>`web-poc/src/App.jsx:4491`<br>`web-poc/src/App.jsx:4492`<br>`web-poc/src/App.jsx:4493`<br>`web-poc/src/App.jsx:4549` | `api/authz.php:131` |

## Catatan

- Jika kolom Frontend berisi `-`, permission belum dipakai eksplisit di UI, namun tetap bisa dipakai sebagai guard backend.
- Daftar ini menunjukkan lokasi deklarasi/pengecekan permission literal (string match), bukan analisis runtime flow.
