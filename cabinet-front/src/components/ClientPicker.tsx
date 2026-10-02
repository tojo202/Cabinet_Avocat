import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useClients } from '@/hooks/use-clients'
import type { Client } from '@/types'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ClientPickerProps {
  value: number | null
  label?: string
  onChange: (client: Client | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
}

export function ClientPicker({
  value,
  label,
  onChange,
  placeholder = 'Sélectionner un client',
  disabled = false,
  invalid = false,
}: ClientPickerProps) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading } = useClients({ search, per_page: 50, page: 1 })
  const clients = data?.data ?? []

  const items = clients.map((client) => ({ value: client.id, label: client.nom_complet }))
  if (
    value != null &&
    label &&
    !items.some((item) => item.value === value)
  ) {
    items.unshift({ value, label })
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Rechercher un client…"
          value={searchInput}
          disabled={disabled}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>
      <Select
        items={items}
        value={value}
        disabled={disabled}
        onValueChange={(next) => {
          onChange(clients.find((client) => client.id === next) ?? null)
        }}
      >
        <SelectTrigger
          className="w-full"
          aria-invalid={invalid ? true : undefined}
        >
          <SelectValue placeholder={isLoading ? 'Chargement…' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {clients.length === 0 && items.length === 0 ? (
            <div className="px-2 py-3 text-sm text-muted-foreground">Aucun client trouvé.</div>
          ) : (
            items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
