# Cahier des Charges - CabinetPro

## 1. Informations Générales

- **Nom du projet**: CabinetPro
- **Description**: Application de gestion pour cabinet d'avocats / professionnels du droit
- **Stack Technologique**:
  - **Backend**: Laravel 13 (PHP 8.3+)
  - **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
  - **Base de données**: MySQL / PostgreSQL
  - **Authentification**: Laravel Sanctum (API tokens)
  - **Autorisations**: Spatie Laravel Permission

---

## 2. Architecture Système

### 2.1 Rôles et Permissions
4 rôles définis avec permissions granulaires :

| Rôle | Permissions clés |
|------|------------------|
| **admin** | Toutes les permissions (29) - gestion complète |
| **avocat** | clients.view/create/update, dossiers.view/manage, factures.view, documents.view/manage, evenements.view/manage, avocats.view, dashboard.view, rapports.view |
| **secretaire** | clients.view/create/update/export, dossiers.view/manage, documents.view/manage, evenements.view/manage, avocats.view, dashboard.view |
| **comptable** | clients.view, dossiers.view, factures.view/manage/paiements.manage, documents.view, evenements.view, avocats.view, dashboard.view, rapports.view |

### 2.2 Structure des Routes API (v1)
Préfixe: `/api/v1`

**Authentification**:
- `POST /auth/login` - Connexion
- `POST /auth/logout` - Déconnexion (middleware auth:sanctum)
- `GET /auth/me` - Profil utilisateur (middleware auth:sanctum)

**Tableau de Bord** (middleware auth:sanctum):
- `GET /dashboard/stats` - Statistiques générales
- `GET /dashboard/activite` - Activité récente
- `GET /dashboard/dossiers-recents` - Dossiers récents

**Clients**:
- `GET/POST/PUT/DELETE /clients` - Gestion complète
- `GET /clients/export` - Export clients
- `GET /clients/stats` - Statistiques clients

**Dossiers**:
- `GET/POST/PUT/DELETE /dossiers` - Gestion complète
- `PATCH /dossiers/{dossier}/statut` - Changement de statut
- `GET /dossiers/{dossier}/activites` - Activités d'un dossier
- `POST /dossiers/{dossier}/avocats` - Synchronisation avocats
- `GET /dossiers/stats` - Statistiques dossiers

**Factures**:
- `GET/POST/PUT/DELETE /factures` - Gestion complète
- `POST /factures/{facture}/paiements` - Ajouter un paiement
- `GET /factures/{facture}/pdf` - Génération PDF
- `GET /factures/stats` - Statistiques factures

**Paiements**:
- `GET /paiements` - Liste des paiements
- `GET /paiements/stats` - Statistiques paiements

**Documents**:
- `GET/POST/DELETE /documents` - Gestion documents
- `GET /documents/{document}/download` - Téléchargement
- `GET /documents/stats` - Statistiques documents

**Événements**:
- `GET/POST/PUT/DELETE /evenements` - Gestion événements

**Avocats**:
- `GET/POST/PUT/DELETE /avocats` - Gestion avocats

**Notifications**:
- `GET /notifications` - Liste notifications

**Paramètres**:
- `GET /settings` - Afficher paramètres
- `PUT /settings` - Mettre à jour paramètres

**Users**:
- `GET/POST/PUT/DELETE /users` - Gestion utilisateurs

---

## 3. Modèles de Données Principaux

### 3.1 Clients
- Champs: nom, email (unique), téléphone, type_client (particulier/société), adresses
- Index: email unique, index sur type_client

### 3.2 Dossiers
- Champs: référence (unique), type_droit, statut (en_cours/en_revision/en_attente/cloture), dates
- Relations: belongsTo Client, many Avocats (pivot dossier_avocat)

### 3.3 Factures
- Champs: statut (brouillon/en_attente/payee/annulee), date_echeance
- Relations: belongsTo Client, belongsTo Dossier
- Sous-entités: FactureLigne, Paiement

### 3.4 Paiements
- Médias: espèces, virement, mobile_money, cheque
- Relations: belongsTo Facture

### 3.5 Documents
- Stockage fichiers uploadés
- Relations: belongsTo Dossier, belongsTo CategorieDocument

### 3.6 Événements
- Types: rendez_vous, audience, échéance
- Relations: belongsTo Dossier, optionally Client/Avocat

### 3.7 Avocats
- Relations: hasOne User (profil associé)
- Champs: specialisation, numero_ordre, etc.

### 3.8 Settings (Paramètres du Cabinet)
- Format clé-valeur
- Valeurs par défaut: nom_cabinet, raison_sociale, adresse, téléphone, email, devise (MGA), fuseau (Indian/Antananarivo), en_tête_facture

---

## 4. Enums du Système

| Enum | Valeurs |
|------|---------|
| **ModePaiement** | espèces, virement, mobile_money, cheque |
| **PrioriteDossier** | normale, haute, urgente |
| **StatutDossier** | en_cours, en_revision, en_attente, cloture |
| **StatutFacture** | brouillon, en_attente, payee, annulee |
| **TypeClient** | particulier, société |
| **TypeEvenement** | rendez_vous, audience, echeance |

---

## 5. Interface Utilisateur (Frontend)

### 5.1 Technologies
- React 19 avec TypeScript
- Vite pour le dev/build
- Tailwind CSS v4 pour le styling
- Shadcn/UI composants
- FullCalendar pour les emplois du temps
- Recharts pour les graphiques
- TanStack Query pour la gestion d'état
- React Hook Form + Zod pour les formulaires
- Zustand pour l'état global

### 5.2 Bibliothèques Clés
- @tanstack/react-query
- @tanstack/react-table
- react-hook-form + zod
- lucide-react (icônes)
- class-variance-authority (animations CSS)
- sonner (notifications)
- lottie-react (animations)

### 5.3 Pages Principales
- Tableau de bord avec statistiques
- Liste et gestion des clients
- Liste et gestion des dossiers
- Création/édition des factures
- Gestion des paiements
- Galerie/documents
- Planning/calendrier des événements
- Paramètres du cabinet

---

## 6. Fonctionnalités Spécifiques

### 6.1 Génération PDF
- Factures au format PDF via barryvdh/laravel-dompdf
- Template personnalisable avec paramètres du cabinet (en_tête_facture)

### 6.2 Exportation
- Export clients (format CSV/Excel)
- Export rapports divers

### 6.3 Recherche et Filtres
- Filtres trigramme sur nom/email des clients (PostgreSQL)
- Filtres par statut, type, date sur tous les modules
- Recherche globale

### 6.4 Tableau de Bord
- Statistiques en temps réel
- Activité récente
- Dossiers en attente/retard

### 6.5 Notification de Rappels
- Système de rappels de RDV/audiences
- Commande artisan: `rappels:dispatcher` (déclenche les jobs 24h à l'avance)
- Notification RappelRdvNotification

---

## 7. Sécurité

### 7.1 Authentification
- Tokens Sanctum avec expiration
- Middleware auth:sanctum sur toutes les routes API protégées
- Route de login public, toutes les autres protégées

### 7.2 Autorisations
- Vérification des rôles via Spatie Permission
- Politiques par modèle (UserPolicy, AvocatPolicy, ClientPolicy, DocumentPolicy, DossierPolicy, FacturePolicy, EvenementPolicy)
- Permissions granulaires: view, create, update, delete, manage, export

### 7.3 Protection des données
- Mots de passe hashés (Bcrypt/Argon2)
- Émails uniques sur clients
- Rate limiting implicite via Laravel

---

## 8. Configuration Environnementale

Variables d'environnement clés (.env) :
- `CACHE_STORE=database`
- `SESSION_DRIVER=database`
- `QUEUE_CONNECTION=database` (ou redis)
- `SANCTUM_STATEFUL_DOMAINS` (domains pour cookies)
- `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, etc. (envoi emails)

---

## 9. Points d'Extension

### 9.1 Modules Additionnels Possibles
- Intégration calendrier Google/Outlook
- Signature électronique des documents
- Relance automatique par email/SMS
- Interface de facturation clients externes
- Module de temps facturable
- Tableau de bord financier avancé

### 9.2 API Externe
- Points d'entrée documentés pour intégrations tierces
- Versionning API v1

---

## 10. Bonnes Pratiques Appliquées

- Code following Laravel conventions
- PHP 8 constructor property promotion
- Type hints and return type declarations
- Curly braces for all control structures
- Pest tests for feature testing
- Laravel Pint for code formatting
- Full coverage of models with factories and seeders
- OpenAPI schemas for API documentation
- Vite-driven frontend build process

---
*Cahier des charges généré à partir de l'analyse du codebase existante.*