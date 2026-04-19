<?php

namespace App\Jobs;

use App\Models\Visitor;
use App\Models\EmailLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;


class SendVisitorEmailJob implements ShouldQueue
{
    use Queueable;

    protected Visitor $visitor;

    /**
     * Create a new job instance.
     */
    public function __construct(Visitor $visitor)
    {
        $this->visitor = $visitor;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $event = $this->visitor->event;
        
        if (!$event || !$event->email_enabled) {
            $status = 'skipped';
            $error = 'Email notifications are disabled for this event.';
            $this->logEmail($status, $error);
            $this->visitor->update(['email_send_status' => $status, 'email_send_error' => $error]);
            return;
        }

        if (!$this->visitor->email) {
            $status = 'skipped';
            $error = 'Visitor does not have an email address.';
            $this->logEmail($status, $error);
            $this->visitor->update(['email_send_status' => $status, 'email_send_error' => $error]);
            return;
        }



        $subject = $event->email_subject ?? 'Welcome to ' . $event->name;
        $body    = $event->email_body ?? '';
        $fromName = $event->email_from_name ?? config('app.name');

        // Variable replacement mapping
        $replacements = [
            '{visitorName}' => ($this->visitor->visitorName ?? '') . ' ' . ($this->visitor->middlename ?? '') . ' ' . ($this->visitor->surname ?? ''),
            '{middlename}'  => $this->visitor->middlename ?? '',
            '{surname}'     => $this->visitor->surname ?? '',
            '{formID}'      => $this->visitor->formID ?? '',
            '{badgeID}'     => $this->visitor->badgeID ?? '',
            '{phone1}'      => $this->visitor->phone1 ?? '',
            '{phone2}'      => $this->visitor->phone2 ?? '',
            '{organisation}' => $this->visitor->organisation ?? '',
            '{eventName}'   => $event->name,
        ];

        foreach ($replacements as $key => $value) {
            $subject = str_replace($key, $value, $subject);
            $body    = str_replace($key, $value, $body);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($this->visitor->email)
                ->send(new \App\Mail\VisitorWelcomeMail($subject, $body, $fromName));

            $this->logEmail('sent', null, $subject, $body);

            $this->visitor->update([
                'email_send_status' => 'sent',
                'email_sent_at'     => now(),
                'email_send_error'  => null,
            ]);
        } catch (\Exception $e) {
            $this->logEmail('failed', $e->getMessage(), $subject, $body);

            $this->visitor->update([
                'email_send_status' => 'failed',
                'email_send_error'  => $e->getMessage(),
            ]);
            throw $e; // Re-throw to allow queue retry if configured
        }
    }

    /**
     * Internal helper to log email attempts.
     */
    private function logEmail(string $status, ?string $error = null, ?string $subject = null, ?string $body = null): void
    {
        EmailLog::create([
            'visitor_id' => $this->visitor->id,
            'event_id'   => $this->visitor->event_id,
            'recipient'  => $this->visitor->email ?? 'N/A',
            'subject'    => $subject ?? ($this->visitor->event->email_subject ?? 'Welcome'),
            'body'       => $body ?? '',
            'status'     => $status,
            'error'      => $error,
            'metadata'   => [
                'ip' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ],
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        $this->logEmail('failed', $exception->getMessage());

        $this->visitor->update([
            'email_send_status' => 'failed',
            'email_send_error'  => $exception->getMessage(),
        ]);
    }
}


