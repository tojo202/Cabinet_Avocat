<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Création des rôles et permissions du cabinet.
     */
    public function run(): void
    {
        // Réinitialiser le cache des permissions Spatie
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'clients.view', 'clients.create', 'clients.update', 'clients.delete', 'clients.export',
            'dossiers.view', 'dossiers.manage',
            'factures.view', 'factures.manage', 'paiements.manage',
            'documents.view', 'documents.manage',
            'evenements.view', 'evenements.manage',
            'avocats.view', 'avocats.manage',
            'dashboard.view',
            'parametres.manage',
            'utilisateurs.manage',
            'rapports.view',
        ];

        $createdPermissions = [];
        foreach ($permissions as $permissionName) {
            $createdPermissions[$permissionName] = Permission::findOrCreate($permissionName, 'web');
            Permission::findOrCreate($permissionName, 'sanctum');
        }

        $roles = [
            'admin' => $permissions,
            'avocat' => [
                'clients.view', 'clients.create', 'clients.update',
                'dossiers.view', 'dossiers.manage',
                'factures.view',
                'documents.view', 'documents.manage',
                'evenements.view', 'evenements.manage',
                'avocats.view',
                'dashboard.view',
                'rapports.view',
            ],
            'secretaire' => [
                'clients.view', 'clients.create', 'clients.update', 'clients.export',
                'dossiers.view', 'dossiers.manage',
                'documents.view', 'documents.manage',
                'evenements.view', 'evenements.manage',
                'avocats.view',
                'dashboard.view',
            ],
            'comptable' => [
                'clients.view',
                'dossiers.view',
                'factures.view', 'factures.manage', 'paiements.manage',
                'documents.view',
                'evenements.view',
                'avocats.view',
                'dashboard.view',
                'rapports.view',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $roleWeb = Role::findOrCreate($roleName, 'web');
            $rolePermissionsWeb = array_map(fn($p) => $createdPermissions[$p], $rolePermissions);
            $roleWeb->syncPermissions($rolePermissionsWeb);

            $roleSanctum = Role::findOrCreate($roleName, 'sanctum');
            $roleSanctum->syncPermissions($rolePermissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
