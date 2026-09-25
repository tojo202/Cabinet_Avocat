<?php

namespace App\Enums;

enum ModePaiement: string
{
    case Especes = 'especes';
    case Virement = 'virement';
    case MobileMoney = 'mobile_money';
    case Cheque = 'cheque';
}