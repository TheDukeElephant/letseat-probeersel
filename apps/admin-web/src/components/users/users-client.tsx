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

const mockUsers: User[] = [
  { id: "U001", name: "Alice Johnson", email: "alice@example.com", phone: "+1 555 0101", role: "customer", createdAt: "2024-06-01" },
  { id: "U002", name: "Bob Smith", email: "bob@example.com", phone: "+1 555 0102", role: "customer", createdAt: "2024-06-02" },
  { id: "U003", name: "Carla Gomez", email: "carla@example.com", phone: "+1 555 0103", role: "driver", createdAt: "2024-06-05" },
  { id: "U004", name: "Dan Lee", email: "dan@example.com", phone: "+1 555 0104", role: "restaurant", createdAt: "2024-06-07" },
  { id: "U005", name: "Eva Green", email: "eva@example.com", phone: "+1 555 0105", role: "admin", createdAt: "2024-06-10" },
]

export function UsersClient() {
  const [users, setUsers] = React.useState<User[]>(mockUsers)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [openEdit, setOpenEdit] = React.useState(false)
  const [openAdd, setOpenAdd] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const updated: User = {
      id: (formData.get("id") as string) || crypto.randomUUID().slice(0, 6),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as string,
      createdAt: (formData.get("createdAt") as string) || new Date().toISOString().slice(0, 10),
    }
    setUsers(prev => {
      const exists = prev.find(u => u.id === updated.id)
      if (exists) return prev.map(u => (u.id === updated.id ? updated : u))
      return [updated, ...prev]
    })
    toast.success(editingUser ? "User updated" : "User added")
    setEditingUser(null)
    setOpenEdit(false)
    setOpenAdd(false)
  }

  function handleDelete() {
    if (!editingUser) return
    setUsers(prev => prev.filter(u => u.id !== editingUser.id))
    toast.success("User deleted")
    setConfirmDelete(false)
    setOpenEdit(false)
    setEditingUser(null)
  }

  const roles = ["customer", "driver", "restaurant", "admin"]

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
                    <Select name="role" defaultValue="customer">
                      <SelectTrigger id="role"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SheetFooter>
                  <Button type="submit">Save</Button>
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
            {filtered.map(u => (
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
                            <Select name="role" defaultValue={editingUser?.role}>
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
                          <Button type="submit">Save Changes</Button>
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
            {!users.length && (
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
