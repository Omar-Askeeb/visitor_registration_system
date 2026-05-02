<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\SyncEventVisitorsJob;
use App\Models\Event;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the sync jobs
Schedule::call(function () {
    $events = Event::where('sync_enabled', true)->get();
    foreach ($events as $event) {
        SyncEventVisitorsJob::dispatch($event);
    }
})->everyMinute();
