<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /**
     * List all events with visitor counts.
     */
    public function index(): JsonResponse
    {
        $events = Event::withCount('visitors')->orderBy('start_date', 'desc')->get();
        return response()->json($events);
    }

    /**
     * Store a new event.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'location'           => 'nullable|string|max:255',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'duration'           => 'nullable|integer|min:1',
            'badge_id_prefix'    => 'required|string|max:20',
            'form_id_prefix'     => 'required|string|max:20',
            'online_reg_prefix'  => 'required|string|max:20',
            'target_visitors'    => 'nullable|integer|min:0',
            'status'             => 'nullable|in:upcoming,active,completed',
            'notes'              => 'nullable|string',
            'online_slug'        => 'nullable|string|max:255',
            'sync_enabled'       => 'nullable|boolean',
            'sync_url'           => 'nullable|string',
            'sync_interval'      => 'nullable|integer|min:1',
            'sync_countdown'     => 'nullable|integer|min:1',
            'workfield_options'  => 'nullable|array',
            'howexpo_options'    => 'nullable|array',
            'is_training'        => 'nullable|boolean',
            'badge_layout'       => 'nullable|array',
            'email_enabled'      => 'nullable|boolean',
            'email_subject'      => 'nullable|string|max:255',
            'email_body'         => 'nullable|string',
            'email_from_name'    => 'nullable|string|max:255',
        ]);

        $event = Event::create($validated);
        $event->loadCount('visitors');

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'create_event',
            'description' => 'إنشاء حدث جديد: ' . $event->name,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($event, 201);
    }

    /**
     * Show a single event.
     */
    public function show(Event $event): JsonResponse
    {
        $event->loadCount('visitors');
        return response()->json($event);
    }

    /**
     * Update an event.
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'sometimes|required|string|max:255',
            'location'           => 'nullable|string|max:255',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'duration'           => 'nullable|integer|min:1',
            'badge_id_prefix'    => 'sometimes|required|string|max:20',
            'form_id_prefix'     => 'sometimes|required|string|max:20',
            'online_reg_prefix'  => 'sometimes|required|string|max:20',
            'target_visitors'    => 'nullable|integer|min:0',
            'status'             => 'nullable|in:upcoming,active,completed',
            'notes'              => 'nullable|string',
            'online_slug'        => 'nullable|string|max:255',
            'sync_enabled'       => 'nullable|boolean',
            'sync_url'           => 'nullable|string',
            'sync_interval'      => 'nullable|integer|min:1',
            'sync_countdown'     => 'nullable|integer|min:1',
            'workfield_options'  => 'nullable|array',
            'howexpo_options'    => 'nullable|array',
            'is_training'        => 'nullable|boolean',
            'badge_layout'       => 'nullable|array',
            'email_enabled'      => 'nullable|boolean',
            'email_subject'      => 'nullable|string|max:255',
            'email_body'         => 'nullable|string',
            'email_from_name'    => 'nullable|string|max:255',
            'remote_db_host'     => 'nullable|string|max:255',
            'remote_db_name'     => 'nullable|string|max:255',
            'remote_db_user'     => 'nullable|string|max:255',
            'remote_db_pass'     => 'nullable|string|max:255',
        ]);

        $event->update($validated);
        $event->loadCount('visitors');

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'update_event',
            'description' => 'تعديل بيانات حدث: ' . $event->name,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($event);
    }

    /**
     * Delete an event (and cascade-delete its visitors).
     */
    public function destroy(Event $event): JsonResponse
    {
        $eventName = $event->name;
        $event->delete();

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'delete_event',
            'description' => 'حذف حدث: ' . $eventName,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json(['message' => 'Event deleted successfully.']);
    }

    /**
     * Send a test email for this event.
     */
    public function sendTestEmail(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $subject = $event->email_subject ?? 'Test Email from ' . $event->name;
        $body    = $event->email_body ?? 'This is a test email to verify your configuration.';
        $fromName = $event->email_from_name ?? config('app.name');

        // Sample replacements
        $replacements = [
            '{visitorName}'  => 'Test Visitor',
            '{middlename}'   => 'Middle',
            '{surname}'      => 'Name',
            '{formID}'       => 'TEST-0001',
            '{badgeID}'      => 'BADGE-TEST',
            '{phone1}'       => '+123456789',
            '{phone2}'       => '+987654321',
            '{organisation}' => 'Sample Org',
            '{eventName}'    => $event->name,
        ];

        foreach ($replacements as $key => $value) {
            $subject = str_replace($key, $value, $subject);
            $body    = str_replace($key, $value, $body);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($validated['email'])
                ->send(new \App\Mail\VisitorWelcomeMail($subject, $body, $fromName));
            
            return response()->json(['message' => 'Test email sent successfully to ' . $validated['email']]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Publish the local database structure to the remote database.
     */
    public function publishStructure(Event $event): JsonResponse
    {
        if (!$event->remote_db_host || !$event->remote_db_name || !$event->remote_db_user) {
            return response()->json(['message' => 'Remote database credentials are incomplete.'], 400);
        }

        try {
            // Configure a dynamic DB connection
            config([
                'database.connections.remote' => [
                    'driver' => 'mysql',
                    'host' => $event->remote_db_host,
                    'database' => $event->remote_db_name,
                    'username' => $event->remote_db_user,
                    'password' => $event->remote_db_pass,
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                ]
            ]);

            \Illuminate\Support\Facades\DB::purge('remote');

            $tables = ['users', 'events', 'visitors', 'scans', 'media_agents'];
            $prefix = config('database.connections.mysql.prefix', '');

            foreach ($tables as $table) {
                $localTable = $prefix . $table;
                // Get the CREATE TABLE syntax from the local database
                $result = \Illuminate\Support\Facades\DB::select("SHOW CREATE TABLE {$localTable}");
                if (!empty($result)) {
                    // Extract the raw SQL string
                    $createSql = $result[0]->{'Create Table'};
                    
                    // Strip the local prefix from the table names and foreign keys so the remote DB gets clean tables
                    if ($prefix) {
                        $createSql = str_replace("`{$prefix}", "`", $createSql);
                    }

                    // Change "CREATE TABLE" to "CREATE TABLE IF NOT EXISTS"
                    $createSql = str_replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', $createSql);

                    // Execute it on the remote DB
                    try {
                        \Illuminate\Support\Facades\DB::connection('remote')->statement($createSql);
                    } catch (\Exception $e) {
                         \Illuminate\Support\Facades\Log::error("Failed to create table {$table}: " . $e->getMessage());
                         throw $e;
                    }
                }
            }

            return response()->json(['message' => 'Database structure published successfully!']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Publish Structure failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to publish database structure: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Push all local data for this event to the remote database.
     */
    public function pushData(Event $event): JsonResponse
    {
        if (!$event->remote_db_host || !$event->remote_db_name || !$event->remote_db_user) {
            return response()->json(['message' => 'Remote database credentials are incomplete.'], 400);
        }

        try {
            config([
                'database.connections.remote' => [
                    'driver' => 'mysql',
                    'host' => $event->remote_db_host,
                    'database' => $event->remote_db_name,
                    'username' => $event->remote_db_user,
                    'password' => $event->remote_db_pass,
                    'charset' => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                ]
            ]);

            \Illuminate\Support\Facades\DB::purge('remote');
            
            // --- Clear remote tables before fresh push to avoid duplicate key errors ---
            $tablesToClear = ['scans', 'media_agents', 'visitors', 'events', 'users'];
            foreach ($tablesToClear as $table) {
                try {
                    \Illuminate\Support\Facades\DB::connection('remote')->table($table)->delete();
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning("Could not clear remote table {$table}: " . $e->getMessage());
                }
            }

            // 0. Push Users (needed for foreign key constraints)
            \App\Models\User::chunk(500, function ($users) {
                $data = $users->map(fn($u) => $u->getAttributes())->toArray();
                \Illuminate\Support\Facades\DB::connection('remote')->table('users')->upsert($data, ['id']);
            });

            // 1. Push Event Record
            $eventData = $event->getAttributes();
            \Illuminate\Support\Facades\DB::connection('remote')->table('events')->upsert(
                [$eventData],
                ['id']
            );

            // 2. Push Visitors (Chunked)
            \App\Models\Visitor::where('event_id', $event->id)->chunk(500, function ($visitors) {
                $data = $visitors->map(fn($v) => $v->getAttributes())->toArray();
                \Illuminate\Support\Facades\DB::connection('remote')->table('visitors')->upsert($data, ['id']);
            });

            // 3. Push Scans
            \App\Models\Scan::where('event_id', $event->id)->chunk(500, function ($scans) {
                $data = $scans->map(fn($s) => $s->getAttributes())->toArray();
                \Illuminate\Support\Facades\DB::connection('remote')->table('scans')->upsert($data, ['id']);
            });

            // 4. Push Media Agents
            \App\Models\MediaAgent::where('event_id', $event->id)->chunk(500, function ($agents) {
                $data = $agents->map(fn($a) => $a->getAttributes())->toArray();
                \Illuminate\Support\Facades\DB::connection('remote')->table('media_agents')->upsert($data, ['id']);
            });

            return response()->json(['message' => 'Data successfully pushed to remote dashboard!']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Push Data failed: " . $e->getMessage());
            return response()->json(['message' => 'Failed to push data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Clean duplicates keeping only the first scan of the day.
     */
    public function cleanScansForDay(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'scan_date' => 'required|date_format:Y-m-d'
        ]);

        $scanDate = $request->input('scan_date');
        $prefix = \Illuminate\Support\Facades\DB::getTablePrefix();
        $tableName = $prefix . $event->scans()->getModel()->getTable();

        \Illuminate\Support\Facades\DB::delete("
            DELETE t1 FROM {$tableName} t1
            INNER JOIN {$tableName} t2 
            WHERE t1.id > t2.id AND t1.barcode = t2.barcode 
              AND DATE(t1.timestamp) = ? AND DATE(t2.timestamp) = ? 
              AND t1.event_id = ?
        ", [$scanDate, $scanDate, $event->id]);

        return response()->json(['message' => 'Duplicates cleaned successfully for ' . $scanDate]);
    }
}
