<?php

namespace App\Enums;

enum PrioriteDossier: string
{
    case Normale = 'normale';
    case Haute = 'haute';
    case Urgente = 'urgente';
}