"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { IconEdit, IconPlus, IconTrash, IconSearch, IconArrowsSort, IconChevronUp, IconChevronDown } from "@tabler/icons-react"

export type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
  groups?: { id: string; name: string }[]
  adminRestaurants?: { id: string; name: string }[]
}

// GraphQL endpoint: default /graphql (Nest GraphQL route is not prefixed by global prefix in this setup)
// Allow override via NEXT_PUBLIC_API_URL; fallback tries /api/graphql only if /graphql returns 404/Network error.
const ENV_API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
const PRIMARY_API_URL = ENV_API || 'http://localhost:4000/graphql';
const ALT_API_URL = PRIMARY_API_URL.includes('/api/graphql')
  ? PRIMARY_API_URL.replace('/api/graphql','/graphql')
  : PRIMARY_API_URL.replace('/graphql','/api/graphql');

interface GqlResponse<T> { data: T; errors?: { message: string }[] }
async function postGraphQL<T = unknown>(body: Record<string, unknown>): Promise<GqlResponse<T>> {
  const attempt = async (url: string) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  try {
    return await attempt(PRIMARY_API_URL);
  } catch (err: unknown) {
    const message = (err as Error).message || ''
    if (/(HTTP 404)|Failed to fetch|ECONNREFUSED/i.test(message)) {
      return attempt(ALT_API_URL);
    }
    throw err;
  }
}

export function UsersClient() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [openEdit, setOpenEdit] = React.useState(false)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [groups, setGroups] = React.useState<{id:string; name:string}[]>([])
  const [groupsLoading, setGroupsLoading] = React.useState(false)
  const [groupSearch, setGroupSearch] = React.useState("")
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<Set<string>>(new Set())
  // Restaurant admin assignment state
  const [restaurants, setRestaurants] = React.useState<{id:string; name:string}[]>([])
  const [restaurantsLoading, setRestaurantsLoading] = React.useState(false)
  const [restaurantSearch, setRestaurantSearch] = React.useState("")
  const [selectedRestaurantIds, setSelectedRestaurantIds] = React.useState<Set<string>>(new Set())
  const PAGE_SIZE = 50
  const [page, setPage] = React.useState(1)
  type SortKey = 'id' | 'name' | 'email' | 'phone' | 'role' | 'registered'
  const [sortKey, setSortKey] = React.useState<SortKey>('registered')
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc')
  const [addRole, setAddRole] = React.useState('USER')
  const [editRole, setEditRole] = React.useState<string | null>(null)

  function onSortClick(k: SortKey) {
    setPage(1)
    setSortDir(d => (sortKey === k ? (d === 'asc' ? 'desc' : 'asc') : 'asc'))
    setSortKey(k)
  }
  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k
    return (
      <button type="button" title="Click to sort; click again to reverse" onClick={() => onSortClick(k)} className={`flex items-center gap-1 select-none ${active ? 'text-foreground' : 'text-foreground/80'} hover:text-foreground`}>
        <span>{label}</span>
        {active ? (sortDir === 'asc' ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />) : <IconArrowsSort className="size-3.5" />}
      </button>
    )
  }

  async function fetchUsers() {
    try {
      setLoading(true)
  const json = await postGraphQL<{ users: User[] }>({ query: `query Users { users { id name email phone role createdAt groups { id name } adminRestaurants { id name } } }` })
      if (json.errors) throw new Error(json.errors[0].message)
      setUsers(json.data.users.map((u) => ({ ...u, createdAt: u.createdAt })))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchUsers() }, [])
  async function fetchGroups() {
    try {
      setGroupsLoading(true)
  const data = await postGraphQL<{ groups: { id:string; name:string }[] }>({ query: `query { groups { id name } }` })
  setGroups(data.data.groups)
    } finally { setGroupsLoading(false) }
  }
  React.useEffect(() => { fetchUsers(); fetchGroups() }, [])
  async function fetchRestaurants() {
    try { setRestaurantsLoading(true); const data = await postGraphQL<{ restaurants: { id:string; name:string }[] }>({ query: `query { restaurants { id name } }` }); setRestaurants(data.data.restaurants) } finally { setRestaurantsLoading(false) }
  }
  React.useEffect(() => { fetchRestaurants() }, [])
  // Reset to first page when search query changes
  React.useEffect(() => { setPage(1) }, [query])
  // Reset selections when opening add dialog
  React.useEffect(() => { if (openAdd) { setSelectedRestaurantIds(new Set()); setRestaurantSearch(""); setSelectedGroupIds(new Set()); setGroupSearch(""); setAddRole('USER'); } }, [openAdd])
  // Initialize selected groups when opening edit dialog
  React.useEffect(() => {
    if (openEdit && editingUser) {
      setSelectedGroupIds(new Set(editingUser.groups?.map(g => g.id) || []))
  setGroupSearch("")
  setSelectedRestaurantIds(new Set(editingUser.adminRestaurants?.map(r => r.id) || []))
  setRestaurantSearch("")
  setEditRole(editingUser.role)
    }
  }, [openEdit, editingUser])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const isEdit = !!editingUser?.id
    const selection = `{ id name email phone role createdAt groups { id name } adminRestaurants { id name } }`
    const mutation = isEdit
      ? `mutation UpdateUser($data: UpdateUserInput!){ updateUser(data:$data) ${selection} }`
      : `mutation CreateUser($data: CreateUserInput!){ createUser(data:$data) ${selection} }`
    const rawRole = formData.get('role') as string | null
    const role = rawRole ? rawRole.toUpperCase() : undefined
    const phoneRaw = (formData.get('phone') as string | null) || undefined
    const phone = phoneRaw && phoneRaw.trim().length === 0 ? undefined : phoneRaw
  const isRestaurantRole = role === 'RESTAURANT'
  const selectedGroups = (isRestaurantRole || role === 'ADMIN') ? [] : (isEdit
      ? Array.from(selectedGroupIds)
      : Array.from(form.querySelectorAll('input[name="groupIds"]:checked')).map((el)=> (el as HTMLInputElement).value))
  const variables: { data: Record<string, unknown> } = { data: {
        id: editingUser?.id,
        name: formData.get('name'),
        email: formData.get('email'),
        phone,
        role,
        password: isEdit ? undefined : 'TempPass123!',
        groupIds: selectedGroups
      }}
    if (!isEdit) delete variables.data.id
    setSubmitting(true)
    try {
      const json = await postGraphQL<{ updateUser?: User; createUser?: User }>({ query: mutation, variables })
      if (json.errors?.length) throw new Error(json.errors.map(er=>er.message).join('; '))
      const savedUser = json.data.updateUser || json.data.createUser
      if (savedUser && isRestaurantRole) {
        // Determine desired restaurants from selectedRestaurantIds
        const desired = Array.from(selectedRestaurantIds)
        const existing = new Set(savedUser.adminRestaurants?.map(r=>r.id) || [])
        const toAdd = desired.filter(id => !existing.has(id))
        const toRemove = Array.from(existing).filter(id => !desired.includes(id))
        for (const rid of toAdd) {
          await postGraphQL({ query: `mutation($restaurantId:String!,$userId:String!){ addRestaurantAdmin(restaurantId:$restaurantId,userId:$userId) }`, variables: { restaurantId: rid, userId: savedUser.id } })
        }
        for (const rid of toRemove) {
          await postGraphQL({ query: `mutation($restaurantId:String!,$userId:String!){ removeRestaurantAdmin(restaurantId:$restaurantId,userId:$userId) }`, variables: { restaurantId: rid, userId: savedUser.id } })
        }
      }
      toast.success(isEdit ? 'User updated' : 'User added')
      await fetchUsers()
      // Only close on success
      setEditingUser(null)
      setOpenEdit(false)
      setOpenAdd(false)
    } catch (err) {
      toast.error((err as Error).message)
      // Keep sheet open for correction
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!editingUser) return
    try {
  const json = await postGraphQL<{ deleteUser: boolean }>({ query: `mutation DeleteUser($id:String!){ deleteUser(id:$id) }`, variables: { id: editingUser.id } })
  if (json.errors?.length) throw new Error(json.errors[0].message)
      toast.success('User deleted')
      await fetchUsers()
    } catch(e) {
      toast.error((e as Error).message)
    }
    setConfirmDelete(false)
    setOpenEdit(false)
    setEditingUser(null)
  }

  // Must match backend enum Role
  const roles = ["USER", "RESTAURANT", "ADMIN"]

  const filtered = React.useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    )
  }, [users, query])

  const sorted = React.useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''
      switch (sortKey) {
        case 'id': va = a.id; vb = b.id; break
        case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break
        case 'email': va = a.email.toLowerCase(); vb = b.email.toLowerCase(); break
        case 'phone': va = (a.phone || '').toLowerCase(); vb = (b.phone || '').toLowerCase(); break
  case 'role': va = a.role.toLowerCase(); vb = b.role.toLowerCase(); break
  case 'registered': va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); break
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filtered, sortKey, sortDir])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, total)
  const paged = total > PAGE_SIZE ? sorted.slice(startIdx, endIdx) : sorted

  function handleExportCsv() {
    // Export currently filtered (not just current page) for flexibility
    const headers = ['#','ID','Name','Email','Phone','Role','CreatedAt']
    const rows = filtered.map((u, i) => [
      (i+1).toString(),
      u.id,
      u.name,
      u.email,
      u.phone || '',
      u.role,
      new Date(u.createdAt).toISOString()
    ])
    const csv = [headers, ...rows].map(r => r.map(field => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return '"' + field.replace(/"/g,'""') + '"'
      }
      return field
    }).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users-export.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative max-w-xs w-full">
            <IconSearch className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <IconPlus className="size-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSave} className="flex flex-col h-full">
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                </DialogHeader>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue={addRole} onValueChange={v=>setAddRole(v)}>
                      <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {addRole === 'USER' && (
                    <div className="grid gap-2">
                      <Label>Groups</Label>
                      <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                        {groupsLoading && <div className="text-xs text-muted-foreground">Loading groups...</div>}
                        {!groupsLoading && groups.map(g => (
                          <label key={g.id} className="flex items-center gap-2">
                            <input type="checkbox" name="groupIds" value={g.id} />
                            <span>{g.name}</span>
                          </label>
                        ))}
                        {!groupsLoading && !groups.length && <div className="text-xs text-muted-foreground">No groups</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">Assign groups to USER role only.</div>
                    </div>
                  )}
                  {addRole === 'RESTAURANT' && (
                    <div className="grid gap-2">
                      <Label>Restaurants (admin access)</Label>
                      <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                        {selectedRestaurantIds.size === 0 && <div className="text-xs text-muted-foreground">No restaurants selected.</div>}
                        {Array.from(selectedRestaurantIds).map(id => {
                          const r = restaurants.find(rr => rr.id === id); if(!r) return null; return (
                            <div key={id} className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1 rounded">
                              <div className="truncate">{r.name}</div>
                              <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setSelectedRestaurantIds(s => { const n = new Set(s); n.delete(id); return n })}>Remove</Button>
                            </div>
                          )
                        })}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Add restaurant</Label>
                        <Input placeholder="Search restaurants..." value={restaurantSearch} onChange={e=>setRestaurantSearch(e.target.value)} className="h-8 text-xs" />
                        {restaurantSearch && (
                          <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                            {restaurantsLoading && <div className="text-xs text-muted-foreground">Loading restaurants...</div>}
                            {!restaurantsLoading && restaurants.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) && !selectedRestaurantIds.has(r.id)).map(r => (
                              <div key={r.id} className="flex items-center justify-between gap-2">
                                <div className="truncate">{r.name}</div>
                                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedRestaurantIds(s => { const n = new Set(s); n.add(r.id); return n })}>Add</Button>
                              </div>
                            ))}
                            {!restaurantsLoading && restaurants.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) && !selectedRestaurantIds.has(r.id)).length === 0 && (
                              <div className="text-xs text-muted-foreground">No matches</div>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">Restaurant admins can manage only their assigned restaurants.</div>
                      </div>
                    </div>
                  )}
                  {addRole === 'ADMIN' && (
                    <div className="text-xs text-muted-foreground">Admins cannot be assigned to groups or restaurants.</div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>Export CSV</Button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead className="w-[70px]"><SortHeader label="ID" k="id" /></TableHead>
              <TableHead><SortHeader label="Name" k="name" /></TableHead>
              <TableHead><SortHeader label="Email" k="email" /></TableHead>
              <TableHead><SortHeader label="Phone" k="phone" /></TableHead>
              <TableHead><SortHeader label="Role" k="role" /></TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Restaurants</TableHead>
              <TableHead><SortHeader label="Registered" k="registered" /></TableHead>
              <TableHead className="text-right pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={10} className="py-6 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {error && !loading && (
              <TableRow><TableCell colSpan={10} className="py-6 text-center text-destructive">{error}</TableCell></TableRow>
            )}
      {!loading && !error && paged.map((u, i) => (
              <TableRow key={u.id} className="hover:bg-muted/30">
        <TableCell className="text-xs text-muted-foreground">{startIdx + i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{u.id}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone}</TableCell>
                <TableCell>
                  {u.role === 'ADMIN' ? (
                    <Badge className="capitalize bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300">{u.role}</Badge>
                  ) : u.role === 'RESTAURANT' ? (
                    <Badge className="capitalize bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300">{u.role}</Badge>
                  ) : (
                    <Badge className="capitalize bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300">{u.role}</Badge>
                  )}
                </TableCell>
                <TableCell className="space-x-1">
                  {u.groups?.slice(0,3).map(g => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
                  {u.groups && u.groups.length > 3 && <Badge variant="secondary">+{u.groups.length - 3}</Badge>}
                </TableCell>
                <TableCell className="space-x-1">
                  {u.adminRestaurants?.slice(0,3).map(r => <Badge key={r.id} variant="outline">{r.name}</Badge>)}
                  {u.adminRestaurants && u.adminRestaurants.length > 3 && <Badge variant="secondary">+{u.adminRestaurants.length - 3}</Badge>}
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Dialog open={openEdit && editingUser?.id === u.id} onOpenChange={(o) => { setOpenEdit(o); if(!o){ setEditingUser(null); setConfirmDelete(false);} }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditingUser(u); }}>
                        <IconEdit className="size-4" /> Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <form onSubmit={handleSave} className="flex flex-col h-full">
                        <DialogHeader>
                          <DialogTitle>Edit User</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
                          <input type="hidden" name="id" value={editingUser?.id} />
                          <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" defaultValue={editingUser?.name} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={editingUser?.phone} required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select name="role" defaultValue={editingUser?.role || 'USER'} onValueChange={v=>{ setEditRole(v); }}>
                              <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                              <SelectContent>
                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          {(editRole || editingUser?.role) === 'RESTAURANT' ? (
                            <div className="grid gap-2">
                              <Label>Restaurants (admin access)</Label>
                              <div className="rounded border p-2 space-y-2 max-h-40 overflow-auto text-sm">
                                {selectedRestaurantIds.size === 0 && <div className="text-xs text-muted-foreground">No restaurants selected.</div>}
                                {Array.from(selectedRestaurantIds).map(id => {
                                  const r = restaurants.find(rr => rr.id === id)
                                  if (!r) return null
                                  return (
                                    <div key={id} className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1 rounded">
                                      <div className="truncate">{r.name}</div>
                                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setSelectedRestaurantIds(s => { const n = new Set(s); n.delete(id); return n })}>Remove</Button>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Add restaurant</Label>
                                <Input placeholder="Search restaurants..." value={restaurantSearch} onChange={e=>setRestaurantSearch(e.target.value)} className="h-8 text-xs" />
                                {restaurantSearch && (
                                  <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                                    {restaurantsLoading && <div className="text-xs text-muted-foreground">Loading restaurants...</div>}
                                    {!restaurantsLoading && restaurants.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) && !selectedRestaurantIds.has(r.id)).map(r => (
                                      <div key={r.id} className="flex items-center justify-between gap-2">
                                        <div className="truncate">{r.name}</div>
                                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedRestaurantIds(s => { const n = new Set(s); n.add(r.id); return n })}>Add</Button>
                                      </div>
                                    ))}
                                    {!restaurantsLoading && restaurants.filter(r => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()) && !selectedRestaurantIds.has(r.id)).length === 0 && (
                                      <div className="text-xs text-muted-foreground">No matches</div>
                                    )}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">Restaurant admins can manage only their assigned restaurants.</div>
                              </div>
                            </div>
                          ) : (editRole || editingUser?.role) === 'USER' ? (
                            <div className="grid gap-2">
                              <Label>Groups</Label>
                              <div className="rounded border p-2 space-y-2 max-h-40 overflow-auto text-sm">
                                {selectedGroupIds.size === 0 && <div className="text-xs text-muted-foreground">This user is not in any groups.</div>}
                                {Array.from(selectedGroupIds).map(id => {
                                  const g = groups.find(gr => gr.id === id)
                                  if (!g) return null
                                  return (
                                    <div key={id} className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1 rounded">
                                      <div className="truncate">{g.name}</div>
                                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setSelectedGroupIds(s => { const n = new Set(s); n.delete(id); return n })}>Remove</Button>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Add to group</Label>
                                <Input placeholder="Search groups..." value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} className="h-8 text-xs" />
                                {groupSearch && (
                                  <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                                    {groupsLoading && <div className="text-xs text-muted-foreground">Loading groups...</div>}
                                    {!groupsLoading && groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) && !selectedGroupIds.has(g.id)).map(g => (
                                      <div key={g.id} className="flex items-center justify-between gap-2">
                                        <div className="truncate">{g.name}</div>
                                        <Button type="button" size="sm" variant="outline" onClick={() => setSelectedGroupIds(s => { const n = new Set(s); n.add(g.id); return n })}>Add</Button>
                                      </div>
                                    ))}
                                    {!groupsLoading && groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) && !selectedGroupIds.has(g.id)).length === 0 && (
                                      <div className="text-xs text-muted-foreground">No matches</div>
                                    )}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">Groups apply to USER role only.</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Admins cannot be assigned to groups or restaurants.</div>
                          )}
                          <Separator />
                          <div className="space-y-2">
                            <Button type="button" variant="destructive" className="w-full gap-2" onClick={() => setConfirmDelete(true)}>
                              <IconTrash className="size-4" /> Delete User
                            </Button>
                            {confirmDelete && (
                              <div className="rounded-md border p-3 text-sm space-y-3">
                                <p className="font-medium">Are you sure?</p>
                                <div className="flex gap-2">
                                  <Button type="button" size="sm" variant="destructive" onClick={() => { handleDelete() }}>Yes, delete</Button>
                                  <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Close</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
      {!loading && !error && !sorted.length && (
              <TableRow>
  <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="pt-2 flex flex-col gap-2 text-sm text-muted-foreground">
        <div>Showing {total === 0 ? 0 : startIdx + 1}-{endIdx} of {total} user{total === 1 ? '' : 's'}</div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p-1))}>Prev</Button>
            {Array.from({ length: totalPages }).slice(0, 10).map((_, idx) => {
              const p = idx + 1
              return (
                <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                  {p}
                </Button>
              )
            })}
            {totalPages > 10 && <span className="px-2">…</span>}
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
          </div>
        )}
      </div>
    </div>
  )
}
