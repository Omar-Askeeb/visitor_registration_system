<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    /**
     * Export the database as a SQL dump.
     */
    public function export()
    {
        \App\Models\ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'database_backup',
            'description' => 'User exported a full database backup (.sql)',
            'ip_address'  => request()->ip(),
        ]);

        return new StreamedResponse(function () {
            $tables = DB::select('SHOW TABLES');
            $dbName = config('database.connections.mysql.database');
            $tableNameKey = "Tables_in_{$dbName}";

            echo "-- EventX Database Backup\n";
            echo "-- Date: " . now()->toDateTimeString() . "\n\n";
            echo "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $tableName = $table->$tableNameKey;

                // 1. Get Create Table syntax
                $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`")[0]->{'Create Table'};
                echo "DROP TABLE IF EXISTS `{$tableName}`;\n";
                echo $createTable . ";\n\n";

                // 2. Get Table Data
                $rows = DB::connection()->getPdo()->query("SELECT * FROM `{$tableName}`")->fetchAll(\PDO::FETCH_ASSOC);
                if (count($rows) > 0) {
                    echo "INSERT INTO `{$tableName}` VALUES \n";
                    $rowCount = count($rows);
                    foreach ($rows as $index => $row) {
                        $values = array_values($row);
                        $escapedValues = array_map(function ($value) {
                            if (is_null($value)) return 'NULL';
                            return DB::getPdo()->quote($value);
                        }, $values);

                        echo "(" . implode(',', $escapedValues) . ")";
                        echo ($index < $rowCount - 1) ? ",\n" : ";\n\n";
                    }
                }
            }

            echo "SET FOREIGN_KEY_CHECKS=1;\n";
        }, 200, [
            'Content-Type' => 'text/sql',
            'Content-Disposition' => 'attachment; filename="backup_' . now()->format('Y-m-d_H-i-s') . '.sql"',
        ]);
    }

    /**
     * Restore the database from a SQL dump.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
        ]);

        $sql = file_get_contents($request->file('file')->getRealPath());

        try {
            DB::beginTransaction();
            
            // Disable foreign key checks for the session
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Execute the raw SQL
            DB::unprepared($sql);

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            
            DB::commit();

            \App\Models\ActivityLog::create([
                'user_id'     => auth()->id(),
                'action'      => 'database_restore',
                'description' => 'System reconstruction: Database restored from external SQL backup.',
                'ip_address'  => request()->ip(),
            ]);

            return response()->json(['message' => 'Database restored successfully!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to restore database: ' . $e->getMessage()], 500);
        }
    }
}
