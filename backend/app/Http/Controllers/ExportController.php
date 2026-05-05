<?php
namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Visitor;
use App\Models\Scan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    public function exportVisitors(Request $request, Event $event)
    {
        $type    = $request->query('type', 'all');
        $format  = $request->query('format', 'csv');
        $columns = $request->input('columns', []);

        $query = $event->visitors();

        switch ($type) {
            case 'online_attended':
                $query->where('visitor_source', 'online')->where('print_count', '>', 0);
                break;
            case 'online_all':
                $query->where('visitor_source', 'online');
                break;
            case 'onsite':
                $query->where('visitor_source', 'onsite');
                break;
            case 'self_service':
                $query->where('visitor_source', 'self-service');
                break;
            case 'all':
            default:
                // No extra filter
                break;
        }

        $data = $query->get();

        if ($format === 'json') {
            return response()->json($this->filterColumns($data, $columns));
        }

        if ($format === 'sql') {
            return $this->downloadSql($this->filterColumns($data, $columns), 'visitors', $columns);
        }

        return $this->downloadCsv($this->filterColumns($data, $columns), 'visitors_export_' . $type, $columns);
    }

    public function exportScans(Request $request, Event $event)
    {
        $format  = $request->query('format', 'csv');
        $columns = $request->input('columns', []);

        $data = $event->scans()->get();

        if ($format === 'json') {
            return response()->json($this->filterColumns($data, $columns));
        }

        if ($format === 'sql') {
            return $this->downloadSql($this->filterColumns($data, $columns), 'scans', $columns);
        }

        return $this->downloadCsv($this->filterColumns($data, $columns), 'scans_export', $columns);
    }

    private function filterColumns($collection, $columns)
    {
        if (empty($columns)) return $collection->toArray();

        return $collection->map(function($item) use ($columns) {
            $filtered = [];
            foreach ($columns as $col) {
                $val = $item->{$col};
                // Handle arrays (workfield, howexpo)
                if (is_array($val)) {
                    $val = implode(', ', $val);
                }
                $filtered[$col] = $val;
            }
            return $filtered;
        })->toArray();
    }

    private function downloadCsv($data, $filename, $columns = [])
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename={$filename}.csv",
        ];

        $callback = function() use ($data, $columns) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for Excel
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            if (!empty($data)) {
                // Header
                fputcsv($file, array_keys($data[0]));

                // Data
                foreach ($data as $row) {
                    fputcsv($file, $row);
                }
            } else if (!empty($columns)) {
                // Just write the selected columns as header
                fputcsv($file, $columns);
            }
            
            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    private function downloadSql($data, $table, $columns = [])
    {
        $filename = "{$table}_export_" . date('Y-m-d_H-i-s') . ".sql";
        
        $sql = "-- Exported at " . date('Y-m-d H:i:s') . "\n";
        
        if (empty($data)) {
            $sql .= "-- No data found for the selected criteria.\n";
            if (!empty($columns)) {
                $sql .= "-- Selected columns: " . implode(', ', $columns) . "\n";
            }
        } else {
            foreach ($data as $row) {
                $keys = array_keys($row);
                $values = array_map(function($val) {
                    if (is_null($val)) return 'NULL';
                    return "'" . addslashes((string)$val) . "'";
                }, array_values($row));
                
                $sql .= "INSERT INTO `{$table}` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
            }
        }

        return Response::make($sql, 200, [
            'Content-Type' => 'application/sql',
            'Content-Disposition' => "attachment; filename={$filename}",
        ]);
    }
}
