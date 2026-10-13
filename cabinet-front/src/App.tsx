import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Providers } from './providers'
import { RequireAuth, RequirePermission } from './app/guards'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ClientsPage } from './features/clients/ClientsPage'
import { DossiersPage } from './features/dossiers/DossiersPage'
import { DossierFormPage } from './features/dossiers/DossierFormPage'
import { FacturationPage } from './features/facturation/FacturationPage'
import { PaiementsPage } from './features/paiements/PaiementsPage'
import { PaiementFormPage } from './features/paiements/PaiementFormPage'
import { DocumentsPage } from './features/documents/DocumentsPage'
import { CalendrierPage } from './features/calendrier/CalendrierPage'
import { AvocatsPage } from './features/avocats/AvocatsPage'
import { AdministrationPage } from './features/administration/AdministrationPage'
import { ParametresPage } from './features/parametres/ParametresPage'
import { ProfilPage } from './features/profil/ProfilPage'
import { RapportsPage } from './features/rapports/RapportsPage'

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<LoginPage />} />

          {/* Routes authentifiées avec Layout (Sidebar + Topbar) */}
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/dossiers" element={<DossiersPage />} />
            <Route
              path="/dossiers/nouveau"
              element={
                <RequirePermission permission="dossiers.manage">
                  <DossierFormPage />
                </RequirePermission>
              }
            />
            <Route
              path="/dossiers/:id/modifier"
              element={
                <RequirePermission permission="dossiers.manage">
                  <DossierFormPage />
                </RequirePermission>
              }
            />
            <Route path="/facturation" element={<FacturationPage />} />
            <Route path="/paiements" element={<PaiementsPage />} />
            <Route
              path="/paiements/nouveau"
              element={
                <RequirePermission permission="paiements.manage">
                  <PaiementFormPage />
                </RequirePermission>
              }
            />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/calendrier" element={<CalendrierPage />} />
            <Route path="/avocats" element={<AvocatsPage />} />
            <Route path="/rapports" element={<RapportsPage />} />
            <Route path="/parametres" element={<ParametresPage />} />
            <Route path="/administration" element={<AdministrationPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}
