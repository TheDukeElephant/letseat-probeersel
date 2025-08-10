"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
}

// GraphQL endpoint: default /graphql (Nest GraphQL route is not prefixed by global prefix in this setup)
// Allow override via NEXT_PUBLIC_API_URL; fallback tries /api/graphql only if /graphql returns 404/Network error.
const ENV_API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
const PRIMARY_API_URL = ENV_API || 'http://localhost:4000/graphql';
const ALT_API_URL = PRIMARY_API_URL.includes('/api/graphql')
  ? PRIMARY_API_URL.replace('/api/graphql','/graphql')
  : PRIMARY_API_URL.replace('/graphql','/api/graphql');

async function postGraphQL(body: any) {
  const attempt = async (url: string) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  try {
    return await attempt(PRIMARY_API_URL);
  } catch (err: any) {
    // Only fallback on connectivity or 404 issues
    if (/(HTTP 404)|Failed to fetch|ECONNREFUSED/i.test(err.message)) {
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

  async function fetchUsers() {
    try {
      setLoading(true)
  const json = await postGraphQL({ query: `query Users { users { id name email phone role createdAt } }` })
      if (json.errors) throw new Error(json.errors[0].message)
      setUsers(json.data.users.map((u: any) => ({ ...u, createdAt: u.createdAt })))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchUsers() }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const isEdit = !!editingUser?.id
    const mutation = isEdit ? `mutation UpdateUser($data: UpdateUserInput!){ updateUser(data:$data){ id name email phone role createdAt } }` : `mutation CreateUser($data: CreateUserInput!){ createUser(data:$data){ id name email phone role createdAt } }`
    const rawRole = formData.get('role') as string | null
    const role = rawRole ? rawRole.toUpperCase() : undefined
    const phoneRaw = (formData.get('phone') as string | null) || undefined
    const phone = phoneRaw && phoneRaw.trim().length === 0 ? undefined : phoneRaw
    const variables: any = { data: {
      id: editingUser?.id,
      name: formData.get('name'),
      email: formData.get('email'),
      phone,
      role,
      password: isEdit ? undefined : 'TempPass123!'
    }}
    if (!isEdit) delete variables.data.id
    setSubmitting(true)
    try {
  const json = await postGraphQL({ query: mutation, variables })
      if (json.errors) {
        // Combine multiple GraphQL errors if present
        const message = json.errors.map((e: any) => e.message).join('; ')
        throw new Error(message)
      }
      toast.success(isEdit ? 'User updated' : 'User added')
      await fetchUsers()
      // Only close on success
      setEditingUser(null)
      setOpenEdit(false)
      setOpenAdd(false)
    } catch (err:any) {
      toast.error(err.message)
      // Keep sheet open for correction
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!editingUser) return
    try {
  const json = await postGraphQL({ query: `mutation DeleteUser($id:String!){ deleteUser(id:$id) }`, variables: { id: editingUser.id } })
      if (json.errors) throw new Error(json.errors[0].message)
      toast.success('User deleted')
      await fetchUsers()
    } catch(e:any) {
      toast.error(e.message)
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
          <Sheet open={openAdd} onOpenChange={setOpenAdd}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <IconPlus className="size-4" /> Add User
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg" side="right">
              <form onSubmit={handleSave} className="flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle>Add User</SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
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
                </div>
                <SheetFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
                  <SheetClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </SheetClose>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[70px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            )}
            {error && !loading && (
              <TableRow><TableCell colSpan={7} className="py-6 text-center text-destructive">{error}</TableCell></TableRow>
            )}
            {!loading && !error && filtered.map(u => (
              <TableRow key={u.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{u.id}</TableCell>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Sheet open={openEdit && editingUser?.id === u.id} onOpenChange={(o) => { setOpenEdit(o); if(!o){ setEditingUser(null); setConfirmDelete(false);} }}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditingUser(u); }}>
                        <IconEdit className="size-4" /> Edit
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-lg" side="right">
                      <form onSubmit={handleSave} className="flex flex-col h-full">
                        <SheetHeader>
                          <SheetTitle>Edit User</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
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
                        <SheetFooter>
                          <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
                          <SheetClose asChild>
                            <Button type="button" variant="outline">Close</Button>
                          </SheetClose>
                        </SheetFooter>
                      </form>
                    </SheetContent>
                  </Sheet>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && !users.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No users found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
