<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $facture->numero }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 13px; color: #1f2937; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
        h1 { font-size: 20px; margin: 0 0 5px; }
        .meta { text-align: right; }
        .meta p { margin: 3px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #1e3a8a; color: #fff; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .right { text-align: right; }
        .totals { width: 40%; margin-left: auto; margin-top: 15px; }
        .totals td { border: none; padding: 4px 8px; }
        .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #1e3a8a; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 10px; background: #e5e7eb; }
        .mentions { margin-top: 40px; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="logo">CabinetPro Management</div>
            <p>Cabinet d'avocats<br>Antananarivo, Madagascar<br>Tél : +261 20 22 33 44</p>
        </div>
        <div class="meta">
            <h1>FACTURE</h1>
            <p><strong>Numéro :</strong> {{ $facture->numero }}</p>
            <p><strong>Date :</strong> {{ $facture->date_facture->format('d/m/Y') }}</p>
            <p><strong>Échéance :</strong> {{ $facture->date_echeance->format('d/m/Y') }}</p>
            <p><span class="badge">{{ strtoupper($facture->statut->value) }}</span></p>
        </div>
    </div>

    <div>
        <strong>Facturé à :</strong><br>
        {{ $facture->client->nomComplet }}<br>
        @if($facture->client->email){{ $facture->client->email }}<br>@endif
        @if($facture->client->adresse){{ $facture->client->adresse }}<br>@endif
        @if($facture->dossier)<br><strong>Dossier :</strong> {{ $facture->dossier->reference }} — {{ $facture->dossier->titre }}@endif
    </div>

    <table>
        <thead>
            <tr>
                <th>Désignation</th>
                <th class="right">Qté</th>
                <th class="right">P.U. (Ar)</th>
                <th class="right">Montant (Ar)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($facture->lignes as $ligne)
            <tr>
                <td>{{ $ligne->designation }}</td>
                <td class="right">{{ $ligne->quantite }}</td>
                <td class="right">{{ number_format($ligne->prix_unitaire, 0, ',', ' ') }}</td>
                <td class="right">{{ number_format($ligne->montant, 0, ',', ' ') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td>Total :</td>
            <td class="right">{{ number_format($facture->montant_total, 0, ',', ' ') }} Ar</td>
        </tr>
        <tr class="total-row">
            <td>Net à payer :</td>
            <td class="right">{{ number_format($facture->solde, 0, ',', ' ') }} Ar</td>
        </tr>
    </table>

    <div class="mentions">
        Mentions légales : en cas de retard de paiement, une pénalité de 2% par mois de retard sera appliquée
        (art. 102 de la loi malgache sur les effets de commerce). Escompte pour paiement anticipé : aucun.
        TVA non applicable, art. 293 B du CGI.
    </div>
</body>
</html>
