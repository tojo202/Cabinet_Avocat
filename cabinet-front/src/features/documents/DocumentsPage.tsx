import {
  Archive,
  CircleAlert,
  Download,
  Eye,
  File,
  FileText,
  FolderOpen,
  ImageIcon,
  Plus,
  Search,
  Table2,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api, apiErrorMessageAsync } from '@/lib/axios'
import { triggerDownload } from '@/lib/download'
import { formatDateTime, formatTaille } from '@/lib/format'
import { useDossiers } from '@/hooks/use-dossiers'
import {
  useDeleteDocument,
  useDocuments,
  useDocumentsStats,
  useDownloadDocument,
  useUploadDocument,
} from '@/hooks/use-documents'
import { useAuth } from '@/store/auth'
import type { Document } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ListPagination } from '@/components/ListPagination'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const MAX_SIZE = 20 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip']

function fileIcon(mime: string | null) {
  if (!mime) return File
  if (mime.startsWith('image/')) return ImageIcon
  if (mime.includes('pdf') || mime.includes('word')) return FileText
  if (mime.includes('sheet') || mime.includes('excel')) return Table2
  if (mime.includes('zip')) return Archive
  return File
}

function extensionOf(name: string): string {
  const parts = name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export function DocumentsPage() {
  const can = useAuth((s) => s.can)
  const canManage = can('documents.manage')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categorieId, setCategorieId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadDossier, setUploadDossier] = useState<number | null>(null)
  const [uploadCategorie, setUploadCategorie] = useState<number | null>(null)

  const [deleting, setDeleting] = useState<Document | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const listQuery = useDocuments({ search, categorie_document_id: categorieId, page })
  const statsQuery = useDocumentsStats()
  const dossiersQuery = useDossiers({ per_page: 100 })
  const uploadMutation = useUploadDocument()
  const deleteMutation = useDeleteDocument()
  const downloadMutation = useDownloadDocument()

  const documents = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data
  const dossiers = dossiersQuery.data?.data ?? []
  const categories = stats?.categories ?? []
  const quotaProgress = stats && stats.quota > 0 ? Math.min(100, (stats.espace_utilise / stats.quota) * 100) : 0

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function selectFile(next: File | null | undefined) {
    if (!next) return
    if (next.size > MAX_SIZE) {
      toast.error(`Le fichier dépasse la limite de ${formatTaille(MAX_SIZE)}.`)
      return
    }
    const extension = extensionOf(next.name)
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error('Format non autorisé (pdf, doc, xls, images ou zip).')
      return
    }
    setFile(next)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    selectFile(event.dataTransfer.files?.[0])
  }

  function handleUpload(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      toast.error('Sélectionnez un fichier à téléverser.')
      return
    }
    uploadMutation.mutate(
      { file, dossier_id: uploadDossier, categorie_document_id: uploadCategorie },
      {
        onSuccess: () => {
          setFile(null)
          if (inputRef.current) inputRef.current.value = ''
        },
      },
    )
  }

  async function handlePreview(document: Document) {
    setPreviewing(true)
    const previewWindow = window.open('', '_blank')
    try {
      const res = await api.get<Blob>(`/documents/${document.id}/download`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      if (previewWindow) {
        previewWindow.location.href = url
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
      } else {
        triggerDownload(res.data, document.nom)
      }
    } catch (error) {
      previewWindow?.close()
      toast.error(await apiErrorMessageAsync(error, 'Prévisualisation impossible.'))
    } finally {
      setPreviewing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Tableau de bord
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Documents</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Documents & GED</h1>
          <p className="text-sm text-muted-foreground">
            Pièces numérisées, actes et courriers classés par catégorie
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <Plus className="size-4 mr-1.5" />
            Téléverser
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents archivés
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.total_documents ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.dossiers_lies ?? 0} dossier(s) rattaché(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Espace de stockage
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <UploadCloud className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{formatTaille(stats?.espace_utilise)}</span>
                  <span className="text-xs text-muted-foreground">
                    sur {formatTaille(stats?.quota)}
                  </span>
                </div>
                <Progress value={quotaProgress} className="mt-2 h-2" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {quotaProgress.toFixed(1)}% du quota utilisé • 20 Mo maximum par fichier
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Catégories</CardTitle>
              <CardDescription>Classement de la GED</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setCategorieId(null)
                  setPage(1)
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  categorieId === null
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>Tous les documents</span>
                <Badge variant="secondary">{stats?.total_documents ?? 0}</Badge>
              </button>
              {statsQuery.isLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                categories.map((categorie) => (
                  <button
                    key={categorie.id}
                    type="button"
                    onClick={() => {
                      setCategorieId(categorie.id)
                      setPage(1)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      categorieId === categorie.id
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{categorie.nom}</span>
                    <Badge variant="secondary">{categorie.documents_count ?? 0}</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Téléversement</CardTitle>
                <CardDescription>Glissez-déposez ou parcourez vos fichiers</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-3">
                  <div
                    role="button"
                    tabIndex={0}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') inputRef.current?.click()
                    }}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                      dragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <UploadCloud className="size-8 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">
                      {file ? file.name : 'Glissez un fichier ici'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file ? formatTaille(file.size) : 'pdf, doc, xls, images, zip'}
                    </p>
                  </div>

                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                    onChange={(event) => selectFile(event.target.files?.[0])}
                  />

                  <div className="space-y-1.5">
                    <Label>Dossier rattaché</Label>
                    <Select
                      items={dossiers.map((dossier) => ({
                        value: dossier.id,
                        label: `${dossier.reference} — ${dossier.titre}`,
                      }))}
                      value={uploadDossier}
                      onValueChange={(value) => setUploadDossier(value ?? null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aucun dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        {dossiers.map((dossier) => (
                          <SelectItem key={dossier.id} value={dossier.id}>
                            {dossier.reference} — {dossier.titre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Catégorie</Label>
                    <Select
                      items={categories.map((categorie) => ({
                        value: categorie.id,
                        label: categorie.nom,
                      }))}
                      value={uploadCategorie}
                      onValueChange={(value) => setUploadCategorie(value ?? null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sans catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((categorie) => (
                          <SelectItem key={categorie.id} value={categorie.id}>
                            {categorie.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    disabled={uploadMutation.isPending || !file}
                  >
                    {uploadMutation.isPending ? 'Téléversement…' : 'Téléverser'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Explorateur de fichiers</CardTitle>
              <CardDescription>
                {categorieId
                  ? `Catégorie : ${categories.find((item) => item.id === categorieId)?.nom ?? ''}`
                  : 'Tous les documents du cabinet'}
              </CardDescription>
            </div>
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-56 pl-8"
                  placeholder="Nom du fichier…"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm">
                <Search className="size-4 mr-1.5" />
                Rechercher
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : listQuery.isError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <CircleAlert className="size-10 text-destructive" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  Impossible de charger les documents.
                </p>
                <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                  Réessayer
                </Button>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <UploadCloud className="size-12 stroke-[1.5] text-muted-foreground/60" />
                <p className="text-base font-medium text-foreground">Aucun document</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {search || categorieId
                    ? 'Aucun résultat pour ces filtres.'
                    : 'Téléversez vos premières pièces pour constituer la GED du cabinet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fichier</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead>Taille</TableHead>
                      <TableHead>Ajouté le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => {
                      const Icon = fileIcon(document.mime_type)
                      return (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                <Icon className="size-4" />
                              </div>
                              <span className="max-w-56 truncate font-medium text-foreground">
                                {document.nom}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {document.categorie ? (
                              <Badge variant="secondary">{document.categorie.nom}</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {document.dossier
                              ? `${document.dossier.reference} — ${document.dossier.titre}`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTaille(document.taille)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDateTime(document.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Prévisualiser"
                                disabled={previewing}
                                onClick={() => void handlePreview(document)}
                              >
                                <Eye />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Télécharger"
                                onClick={() => downloadMutation.mutate(document)}
                              >
                                <Download />
                              </Button>
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Supprimer"
                                  onClick={() => setDeleting(document)}
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="document" />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer le document"
        description={`« ${deleting?.nom ?? ''} » sera définitivement supprimé du stockage.`}
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
      />
    </div>
  )
}
