<?php

namespace App\Enums;

enum StatutDossier: string
{
    case EnCours = 'en_cours';
    case EnRevision = 'en_revision';
    case EnAttente = 'en_attente';
    case Cloture = 'cloture';
}