<?php

namespace App\Enums;

enum StatutFacture: string
{
    case Brouillon = 'brouillon';
    case EnAttente = 'en_attente';
    case Payee = 'payee';
    case Annulee = 'annulee';
}