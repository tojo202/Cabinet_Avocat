<?php

namespace App\Enums;

enum TypeClient: string
{
    case Particulier = 'particulier';
    case Societe = 'societe';
}