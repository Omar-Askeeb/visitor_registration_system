<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\UserController;

// --- Public Auth ---
use App\Http\Controllers\PrePrintHistoryController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\TrainingRecordController;

Route::post('/login', [AuthController::class, 'login']);

// --- Protected Routes ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Admin Only
    Route::middleware('role:admin')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::apiResource('users', UserController::class)->except(['index', 'show']);
        Route::apiResource('events', EventController::class)->except(['index', 'show']);
        Route::get('/logs', [UserController::class, 'logs']);
        Route::get('/users/{user}/performance', [UserController::class, 'performance']);
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
    Route::get('/users', [UserController::class, 'index']);

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
});
