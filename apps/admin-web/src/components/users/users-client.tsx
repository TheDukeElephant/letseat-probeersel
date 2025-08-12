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
import { IconEdit, IconPlus, IconTrash, IconSearch } from "@tabler/icons-react"

export type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  createdAt: string
  groups?: { id: string; name: string }[]
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
  const PAGE_SIZE = 50
  const [page, setPage] = React.useState(1)

  async function fetchUsers() {
    try {
      setLoading(true)
      const json = await postGraphQL<{ users: User[] }>({ query: `query Users { users { id name email phone role createdAt groups { id name } } }` })
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
  // Reset to first page when search query changes
  React.useEffect(() => { setPage(1) }, [query])
  // Initialize selected groups when opening edit dialog
  React.useEffect(() => {
    if (openEdit && editingUser) {
      setSelectedGroupIds(new Set(editingUser.groups?.map(g => g.id) || []))
      setGroupSearch("")
    }
  }, [openEdit, editingUser])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const isEdit = !!editingUser?.id
    const mutation = isEdit
      ? `mutation UpdateUser($data: UpdateUserInput!){ updateUser(data:$data){ id name email phone role createdAt groups { id name } } }`
      : `mutation CreateUser($data: CreateUserInput!){ createUser(data:$data){ id name email phone role createdAt groups { id name } } }`
    const rawRole = formData.get('role') as string | null
    const role = rawRole ? rawRole.toUpperCase() : undefined
    const phoneRaw = (formData.get('phone') as string | null) || undefined
    const phone = phoneRaw && phoneRaw.trim().length === 0 ? undefined : phoneRaw
  const selectedGroups = isEdit
      ? Array.from(selectedGroupIds)
      : Array.from(form.querySelectorAll('input[name="groupIds"]:checked')).map((el)=> (el as HTMLInputElement).value)
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

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIdx = (currentPage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, total)
  const paged = total > PAGE_SIZE ? filtered.slice(startIdx, endIdx) : filtered

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
                    <Select name="role" defaultValue="USER">
                      <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Groups</Label>
                    <div className="rounded border p-2 space-y-1 max-h-40 overflow-auto text-sm">
                      {groupsLoading && <div className="text-xs text-muted-foreground">Loading groups...</div>}
                      {!groupsLoading && groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase())).map(g => (
                        <label key={g.id} className="flex items-center gap-2">
                          <input type="checkbox" name="groupIds" value={g.id} />
                          <span>{g.name}</span>
                        </label>
                      ))}
                      {!groupsLoading && !groups.length && <div className="text-xs text-muted-foreground">No groups</div>}
                    </div>
                    <Input placeholder="Search groups..." value={groupSearch} onChange={e=>setGroupSearch(e.target.value)} className="h-8 text-xs" />
                    <div className="text-xs text-muted-foreground">To create a new group, go to the Groups page.</div>
                  </div>
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
              <TableHead className="w-[70px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={8} className="py-6 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {error && !loading && (
              <TableRow><TableCell colSpan={8} className="py-6 text-center text-destructive">{error}</TableCell></TableRow>
            )}
      {!loading && !error && paged.map((u, i) => (
              <TableRow key={u.id} className="hover:bg-muted/30">
        <TableCell className="text-xs text-muted-foreground">{startIdx + i + 1}</TableCell>
                <TableCell className="font-mono text-xs">{u.id}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                <TableCell className="space-x-1">
                  {u.groups?.slice(0,3).map(g => <Badge key={g.id} variant="outline">{g.name}</Badge>)}
                  {u.groups && u.groups.length > 3 && <Badge variant="secondary">+{u.groups.length - 3}</Badge>}
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
                            <Select name="role" defaultValue={editingUser?.role || 'USER'}>
                              <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                              <SelectContent>
                                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
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
                                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setSelectedGroupIds(s => { const n = new Set(s); n.delete(id); return n })}>
                                      Remove
                                    </Button>
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
                              <div className="text-xs text-muted-foreground">To create a new group, go to the Groups page.</div>
                            </div>
                          </div>
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
            {!loading && !error && !users.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No users found.</TableCell>
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
