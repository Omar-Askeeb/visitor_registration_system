<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\MediaAgentController;
use App\Http\Controllers\BackupController;


// --- Public Auth ---
use App\Http\Controllers\PrePrintHistoryController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\TrainingRecordController;
use App\Http\Controllers\CountryController;

Route::post('/login', [AuthController::class, 'login']);

// --- Protected Routes ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::apiResource('users', UserController::class)->except(['index', 'show']);
        Route::post('/users/bulk', [UserController::class, 'bulkImport']);
        Route::get('/roles/permissions', [\App\Http\Controllers\RoleController::class, 'permissions']);
        Route::apiResource('roles', \App\Http\Controllers\RoleController::class)->except(['show']);
        Route::apiResource('events', EventController::class)->except(['index', 'show']);
        Route::post('/events/{event}/clean-scans-day', [EventController::class, 'cleanScansForDay']);
        Route::get('/logs', [UserController::class, 'logs']);
        Route::get('/users/{user}/performance', [UserController::class, 'performance']);

        // Exhibitor management (admin only)
        Route::get('/exhibitors',                                     [\App\Http\Controllers\ExhibitorController::class, 'index']);
        Route::post('/exhibitors',                                    [\App\Http\Controllers\ExhibitorController::class, 'store']);
        Route::put('/exhibitors/{exhibitor}',                         [\App\Http\Controllers\ExhibitorController::class, 'update']);
        Route::delete('/exhibitors/{exhibitor}',                      [\App\Http\Controllers\ExhibitorController::class, 'destroy']);
        Route::post('/exhibitors/bulk',                               [\App\Http\Controllers\ExhibitorController::class, 'bulkImport']);
        Route::post('/exhibitors/mark-printed',                       [\App\Http\Controllers\ExhibitorController::class, 'markPrinted']);
        Route::post('/exhibitors/{exhibitor}/mark-received',          [\App\Http\Controllers\ExhibitorController::class, 'markReceived']);
        Route::post('/exhibitors/{exhibitor}/toggle-vip-received',   [\App\Http\Controllers\ExhibitorController::class, 'toggleVIPReceived']);

        // Backup & Restore
        Route::get('/backup/export', [BackupController::class, 'export']);
        Route::post('/backup/import', [BackupController::class, 'import']);
    });

    // Everyone can view events and users list
    Route::apiResource('scans', ScanController::class)->only(['index', 'store', 'show', 'destroy']);
    
    Route::get('/pre-print-history', [PrePrintHistoryController::class, 'index']);
    Route::post('/pre-print-history', [PrePrintHistoryController::class, 'store']);
    Route::apiResource('events', EventController::class)->only(['index', 'show']);
    Route::post('/sync/pulse', [SyncController::class, 'pulse']);
    Route::post('/events/{event}/sync', [SyncController::class, 'sync']);
    Route::get('/events/{event}/sync-logs', [SyncController::class, 'index']);
    Route::get('/events/{event}/sync-status', [SyncController::class, 'status']);
    Route::post('/events/{event}/send-test-email', [EventController::class, 'sendTestEmail']);
    Route::post('/events/{event}/publish-structure', [EventController::class, 'publishStructure']);
    Route::post('/events/{event}/push-data', [EventController::class, 'pushData']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/countries', [CountryController::class, 'index']);

    // --- Visitor routes ---
    Route::prefix('events/{event}/visitors')->group(function () {
        
        // Admin & Auditor
        Route::middleware('role:admin,auditor')->group(function () {
            Route::get('/', [VisitorController::class, 'index']);
            Route::post('/batch-verify', [VisitorController::class, 'batchVerify']);
            Route::post('/{visitor}/verify', [VisitorController::class, 'verify']);
        });

        // Admin & Data Entry
        Route::middleware('role:admin,data_entry')->group(function () {
            Route::post('/', [VisitorController::class, 'store']);
            Route::post('/training-records', [TrainingRecordController::class, 'store']);
            Route::get('/next-badge-id', [VisitorController::class, 'nextBadgeId']);
            Route::get('/unsynced-count', [VisitorController::class, 'unsyncedCount']);
            Route::post('/resync-external', [VisitorController::class, 'resyncExternal']);
        });

        // Admin, Data Entry, Auditor
        Route::middleware('role:admin,data_entry,auditor')->group(function () {
            Route::get('/check-form-id', [VisitorController::class, 'checkFormId']);
            Route::get('/search', [VisitorController::class, 'search']);
            Route::get('/{visitor}', [VisitorController::class, 'show']);
            Route::put('/{visitor}', [VisitorController::class, 'update']);
            Route::post('/{visitor}/increment-print', [VisitorController::class, 'incrementPrintCount']);
        });
    });

    // --- Media Agent routes ---
    Route::prefix('events/{event}/media-agents')->group(function () {
        Route::middleware('role:admin,data_entry')->group(function () {
            Route::post('/', [MediaAgentController::class, 'store']);
            Route::get('/search', [MediaAgentController::class, 'search']);
            Route::put('/{media_agent}', [MediaAgentController::class, 'update']);
            Route::post('/{media_agent}/increment-print', [MediaAgentController::class, 'incrementPrintCount']);

        });
    });
});


