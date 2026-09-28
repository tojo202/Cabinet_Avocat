<?php

namespace App\Notifications;

use App\Enums\TypeEvenement;
use App\Models\Evenement;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RappelRdvNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Evenement $evenement) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $type = match ($this->evenement->type) {
            TypeEvenement::Audience => 'Audience',
            TypeEvenement::RendezVous => 'Rendez-vous',
            TypeEvenement::Echeance => 'Échéance',
        };

        $message = (new MailMessage)
            ->subject("Rappel : {$type} demain — {$this->evenement->titre}")
            ->line("Bonjour {$notifiable->name},")
            ->line("Rappel : {$type} prévu demain.")
            ->line("Titre : {$this->evenement->titre}")
            ->line('Date : '.$this->evenement->debut->format('d/m/Y à H:i'));

        if ($this->evenement->lieu) {
            $message->line("Lieu : {$this->evenement->lieu}");
        }

        if ($this->evenement->dossier) {
            $message->line("Dossier : {$this->evenement->dossier->reference} — {$this->evenement->dossier->titre}");
        }

        return $message->action('Voir le calendrier', url('/calendrier'));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'evenement_id' => $this->evenement->id,
            'titre' => $this->evenement->titre,
            'debut' => $this->evenement->debut->toIso8601String(),
        ];
    }
}
