export type Role = 'admin' | 'avocat' | 'secretaire' | 'comptable'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  user: AuthUser
  role: Role
}

export interface PaginatedMetaLink {
  url: string | null
  label: string
  active: boolean
}

export interface Paginated<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: {
    current_page: number
    from: number | null
    last_page: number
    links: PaginatedMetaLink[]
    path: string
    per_page: number
    to: number | null
    total: number
  }
}

export type TypeClient = 'particulier' | 'societe'

export interface Client {
  id: number
  type_client: TypeClient
  nom: string
  prenom: string | null
  raison_sociale: string | null
  nom_complet: string
  initiales: string
  email: string | null
  telephone: string | null
  adresse: string | null
  nif: string | null
  stat: string | null
  actif: boolean
  dossiers_count: number | null
  created_at: string
  updated_at: string
}

export type StatutDossier = 'en_cours' | 'en_revision' | 'en_attente' | 'cloture'
export type PrioriteDossier = 'normale' | 'haute' | 'urgente'

export interface AvocatRef {
  id: number
  nom: string
  prenom: string
  nom_complet: string
  initiales: string
  specialite: string | null
  telephone: string | null
  barreau: string | null
  actif: boolean
  user_id: number | null
  user?: { id: number; name: string; email: string } | null
  dossiers_count?: number | null
  created_at?: string
}

export interface Dossier {
  id: number
  reference: string
  client_id: number
  client?: Client
  titre: string
  description: string | null
  type_droit: string
  statut: StatutDossier
  priorite: PrioriteDossier
  avancement: number
  montant: number | null
  is_en_retard: boolean
  date_ouverture: string
  date_cloture: string | null
  avocats?: AvocatRef[]
  created_at: string
  updated_at: string
}

export type TypeEvenement = 'rendez_vous' | 'audience' | 'echeance'

export interface Evenement {
  id: number
  dossier_id: number | null
  client_id: number | null
  titre: string
  type: TypeEvenement
  debut: string
  fin: string | null
  lieu: string | null
  description: string | null
  dossier?: Dossier
  client?: Client
  created_at: string
  updated_at: string
}

export type StatutFacture = 'brouillon' | 'en_attente' | 'payee' | 'annulee'
export type ModePaiement = 'especes' | 'virement' | 'mobile_money' | 'cheque'

export interface FactureLigne {
  id: number
  facture_id?: number
  designation: string
  quantite: number
  prix_unitaire: number
  montant: number
}

export interface Paiement {
  id: number
  facture_id: number
  montant: number
  mode: ModePaiement
  date_paiement: string
  reference: string | null
  notes: string | null
  created_at: string
}

export interface Facture {
  id: number
  numero: string
  client_id: number
  client?: Client
  dossier_id: number | null
  dossier?: Dossier
  date_facture: string
  date_echeance: string
  statut: StatutFacture
  montant_total: number
  montant_paye: number
  solde: number
  is_en_retard: boolean
  notes: string | null
  lignes?: FactureLigne[]
  paiements?: Paiement[]
  created_at: string
  updated_at: string
}

export interface CategorieDocument {
  id: number
  nom: string
  description: string | null
  documents_count: number | null
}

export interface Document {
  id: number
  dossier_id: number | null
  dossier?: Dossier
  categorie_document_id: number | null
  categorie?: CategorieDocument
  nom: string
  mime_type: string | null
  taille: number | null
  user_id: number | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  clients_actifs: number
  clients_nouveaux_pct: number
  dossiers_en_cours: number
  dossiers_urgents: number
  total_documents: number
}

export interface ActiviteJour {
  date: string
  dossiers_ouverts: number
  rendez_vous: number
  audiences: number
}

export interface FacturesStats {
  paye: number
  en_attente: number
  en_retard: number
  total_factures: number
  total_toutes: number
}

export interface FacturesEnRetard {
  total: number
  factures: { id: number; numero: string; montant_total: number }[]
}

export interface ActivityEntry {
  id: number
  log_name: string
  description: string
  event: string | null
  properties: Record<string, unknown> | unknown[]
  causer: { id: number | null; name: string | null }
  created_at: string
}

export interface ClientsStats {
  total: number
  particuliers: number
  societes: number
  nouveaux_ce_mois: number
}

export interface DossiersStats {
  total: number
  en_cours: number
  urgents: number
  en_revision: number
  en_attente: number
  clotures: number
}

export interface DocumentsStats {
  total_documents: number
  espace_utilise: number
  quota: number
  dossiers_lies: number
  categories: CategorieDocument[]
}

export interface ModePaiementStat {
  nombre: number
  total: number
}

export interface PaiementsStats {
  total_encaisse: number
  total_mois: number
  nombre: number
  par_mode: Partial<Record<ModePaiement, ModePaiementStat>>
  restant_a_encaisser: number
}

export interface PaiementAvecFacture extends Paiement {
  facture?: Facture
}

export interface Utilisateur {
  id: number
  name: string
  email: string
  role: Role | null
  created_at: string
  updated_at: string
}

export interface UtilisateurPayload {
  name: string
  email: string
  role: Role
  password?: string
}

export interface ParametresCabinet {
  nom_cabinet: string
  raison_sociale: string
  adresse: string
  telephone: string
  email: string
  devise: string
  fuseau: string
  en_tete_facture: string
}

export interface RapportPeriode {
  debut: string
  fin: string
}

export interface RapportStatut {
  statut: StatutDossier
  total: number
}

export interface RapportMode {
  mode: ModePaiement
  nombre: number
  total: number
}

export interface RapportTopClient {
  id: number
  nom: string
  nombre_factures: number
  montant: number
}

export interface RapportAvocat {
  id: number
  nom_complet: string
  dossiers: number
}

export interface RapportSynthese {
  periode: RapportPeriode
  nouveaux_clients: number
  dossiers_ouverts: number
  dossiers_clotures: number
  dossiers_par_statut: RapportStatut[]
  facturation: {
    nb_factures: number
    facture: number
    encaisse: number
    impaye: number
  }
  paiements: {
    nombre: number
    total: number
    par_mode: RapportMode[]
  }
  top_clients: RapportTopClient[]
  par_avocat: RapportAvocat[]
}

export interface RapportEvolutionPoint {
  periode: string
  factures: number
  encaisse: number
  dossiers: number
}

export interface RapportEvolution {
  granularite: 'mois' | 'an'
  periode: RapportPeriode
  data: RapportEvolutionPoint[]
}
