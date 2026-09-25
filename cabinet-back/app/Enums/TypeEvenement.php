<?php

namespace App\Enums;

enum TypeEvenement: string
{
    case RendezVous = 'rendez_vous';
    case Audience = 'audience';
    case Echeance = 'echeance';
}