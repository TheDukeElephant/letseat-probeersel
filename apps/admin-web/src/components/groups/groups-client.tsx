"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { IconEdit, IconPlus, IconTrash, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Group { id: string; name: string; createdAt: string; userCount: number; users?: { id: string; name: string; email: string }[] }
interface User { id: string; name: string; email: string }

const API = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/graphql';

async function gql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), cache: 'no-store' });
  const json: { data: T; errors?: { message: string }[] } = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export function GroupsClient() {
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [editing, setEditing] = React.useState<Group | null>(null);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [userSearch, setUserSearch] = React.useState('');
  const [userResults, setUserResults] = React.useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = React.useState(false);
  const PAGE_SIZE = 50;
  const [page, setPage] = React.useState(1);

  async function load() {
    setLoading(true);
    try {
  const data = await gql<{ groups: Group[] }>('query { groups { id name createdAt userCount } }');
      setGroups(data.groups);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }
  React.useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await gql('mutation($n:String!){ createGroup(name:$n){ id } }', { n: newName.trim() });
      toast.success('Group created');
      setNewName('');
      load();
  } catch (e) { toast.error((e as Error).message); } finally { setAdding(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this group?')) return;
    try {
      await gql('mutation($id:String!){ deleteGroup(id:$id) }', { id });
      toast.success('Deleted');
      setGroups(g => g.filter(x => x.id !== id));
  } catch (e) { toast.error((e as Error).message); }
  }

  const filtered = groups.filter(g => g.name.toLowerCase().includes(filter.toLowerCase()));
  React.useEffect(() => { setPage(1); }, [filter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const paged = total > PAGE_SIZE ? filtered.slice(startIdx, endIdx) : filtered;

  async function openGroup(g: Group) {
    try {
      const data = await gql<{ group: Group }>('query($id:String!){ group(id:$id){ id name createdAt userCount users { id name email } } }', { id: g.id });
      setEditing(data.group);
      setOpenEdit(true);
      setUserSearch('');
      setUserResults([]);
    } catch (e) { toast.error((e as Error).message); }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      const data = await gql<{ updateGroup: Group }>('mutation($id:String!,$n:String!){ updateGroup(id:$id,name:$n){ id name userCount } }', { id: editing.id, n: editing.name });
      toast.success('Group updated');
      setGroups(gs => gs.map(g => g.id === data.updateGroup.id ? { ...g, name: data.updateGroup.name } : g));
  // Update local editing state then close sheet
  setEditing(ed => ed ? { ...ed, name: data.updateGroup.name, userCount: data.updateGroup.userCount } : ed);
  setOpenEdit(false);
  // Optionally refresh full list to ensure counts remain accurate
  load();
    } catch(e){ toast.error((e as Error).message); } finally { setSavingEdit(false); }
  }

  async function searchUsers(q: string) {
    setUserSearch(q);
    if (!q.trim()) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
      const data = await gql<{ users: User[] }>('query { users { id name email } }');
      const list = data.users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
      // Exclude already members
      setUserResults(list.filter(u => !editing?.users?.some(m => m.id === u.id)).slice(0,20));
    } catch(e){ toast.error((e as Error).message);} finally { setSearchingUsers(false); }
  }

  async function addUserToGroup(userId: string) {
    if (!editing) return;
    try {
      const data = await gql<{ addUserToGroup: Group }>('mutation($g:String!,$u:String!){ addUserToGroup(groupId:$g,userId:$u){ id users { id name email } userCount name createdAt } }', { g: editing.id, u: userId });
      setEditing(data.addUserToGroup);
      setGroups(gs => gs.map(g => g.id === editing.id ? { ...g, userCount: data.addUserToGroup.userCount } : g));
      toast.success('User added');
      setUserResults(r => r.filter(u => u.id !== userId));
    } catch(e){ toast.error((e as Error).message); }
  }

  async function removeUserFromGroup(userId: string) {
    if (!editing) return;
    if (!confirm('Remove this user from group?')) return;
    try {
      const data = await gql<{ removeUserFromGroup: Group }>('mutation($g:String!,$u:String!){ removeUserFromGroup(groupId:$g,userId:$u){ id users { id name email } userCount name createdAt } }', { g: editing.id, u: userId });
      setEditing(data.removeUserFromGroup);
      setGroups(gs => gs.map(g => g.id === editing.id ? { ...g, userCount: data.removeUserFromGroup.userCount } : g));
      toast.success('User removed');
    } catch(e){ toast.error((e as Error).message); }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex gap-2 flex-1">
          <Input placeholder="Filter" value={filter} onChange={e=>setFilter(e.target.value)} />
          <Input placeholder="New group name" value={newName} onChange={e=>setNewName(e.target.value)} />
          <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add'}</Button>
        </div>
      </form>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && paged.map((g, i) => (
              <TableRow key={g.id}>
                <TableCell className="text-xs text-muted-foreground">{startIdx + i + 1}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[160px]" title={g.id}>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell><Badge variant="outline">{g.userCount}</Badge></TableCell>
                <TableCell>{new Date(g.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openGroup(g)}><IconEdit className="size-4" />Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(g.id)}><IconTrash className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !filtered.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No groups</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <div className="pt-2 flex flex-col gap-2 text-sm text-muted-foreground">
        <div>Showing {total === 0 ? 0 : startIdx + 1}-{endIdx} of {total} group{total === 1 ? '' : 's'}</div>
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
      <Sheet open={openEdit} onOpenChange={(o)=>{ setOpenEdit(o); if(!o) setEditing(null); }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col">
          <form onSubmit={handleRename} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle>Edit Group</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
              <div className="space-y-2 px-1">
                <label className="text-sm font-medium">Group Name</label>
                <Input value={editing?.name || ''} onChange={(e)=> setEditing(ed => ed ? { ...ed, name: e.target.value } : ed)} />
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Members ({editing?.userCount ?? 0})</h4>
                </div>
                <div className="rounded border p-2 max-h-60 overflow-auto space-y-2 text-sm">
                  {editing?.users?.length ? editing.users.map(u => (
                    <div key={u.id} className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1 rounded">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={()=>removeUserFromGroup(u.id)}>
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  )) : <div className="text-xs text-muted-foreground">No members</div> }
                </div>
              </div>
              <Separator />
              <div className="space-y-3 px-1">
                <h4 className="font-medium flex items-center gap-2">Add Members</h4>
                <div className="relative">
                  <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-7" value={userSearch} onChange={(e)=> searchUsers(e.target.value)} />
                </div>
                {userSearch && (
                  <div className="rounded border p-2 max-h-48 overflow-auto space-y-2 text-sm">
                    {searchingUsers && <div className="text-xs text-muted-foreground">Searching...</div>}
                    {!searchingUsers && userResults.length === 0 && <div className="text-xs text-muted-foreground">No matches</div>}
                    {!searchingUsers && userResults.map(u => (
                      <div key={u.id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{u.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={()=> addUserToGroup(u.id)}>
                          <IconPlus className="size-4" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <SheetFooter className="gap-2">
              <Button type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</Button>
              <SheetClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </SheetClose>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
