"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { IconEdit, IconPlus, IconTrash, IconSearch, IconArrowsSort, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Group { id: string; name: string; createdAt: string; userCount: number; adminCount?: number; users?: { id: string; name: string; email: string }[]; admins?: { id: string }[];
  billingName?: string | null; billingEmail?: string | null; billingAddress?: string | null; billingPostalCode?: string | null; billingCity?: string | null; billingCountry?: string | null; vatNumber?: string | null; companyNumber?: string | null; iban?: string | null; bic?: string | null;
}
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
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  // Draft state for modal editing
  const [draftName, setDraftName] = React.useState('');
  const [draftMembers, setDraftMembers] = React.useState<User[]>([]);
  const [draftAdminIds, setDraftAdminIds] = React.useState<Set<string>>(new Set());
  const PAGE_SIZE = 50;
  const [page, setPage] = React.useState(1);
  type SortKey = 'id' | 'name' | 'members' | 'admins' | 'created' | 'status' | 'invoice';
  const [sortKey, setSortKey] = React.useState<SortKey>('created');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc');

  function adminCountOf(g: Group) { return g.adminCount ?? (g as any).admins?.length ?? 0 }
  function onSortClick(k: SortKey) {
    setPage(1);
    setSortDir(d => (sortKey === k ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(k);
  }
  function SortHeader({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <button type="button" title="Click to sort; click again to reverse" onClick={() => onSortClick(k)} className={`flex items-center gap-1 select-none ${active ? 'text-foreground' : 'text-foreground/80'} hover:text-foreground`}>
        <span>{label}</span>
        {active ? (sortDir === 'asc' ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />) : <IconArrowsSort className="size-3.5" />}
      </button>
    );
  }

  async function load() {
    setLoading(true);
    try {
  const data = await gql<{ groups: Group[] }>('query { groups { id name createdAt userCount adminCount billingName billingEmail billingAddress billingPostalCode billingCity billingCountry vatNumber companyNumber iban bic } }');
      setGroups(data.groups);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }
  React.useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
  await gql('mutation($input:CreateGroupInput!){ createGroup(input:$input){ id } }', { input: { name: newName.trim() } });
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

  const sorted = React.useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'id': va = a.id; vb = b.id; break;
        case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
        case 'members': va = a.userCount; vb = b.userCount; break;
        case 'admins': va = adminCountOf(a); vb = adminCountOf(b); break;
        case 'created': va = new Date(a.createdAt).getTime(); vb = new Date(b.createdAt).getTime(); break;
        case 'status': va = adminCountOf(a) > 0 ? 1 : 0; vb = adminCountOf(b) > 0 ? 1 : 0; break;
        case 'invoice': {
          const hasA = !!(a.billingName || a.billingEmail || a.vatNumber || a.companyNumber || a.iban);
          const hasB = !!(b.billingName || b.billingEmail || b.vatNumber || b.companyNumber || b.iban);
          va = hasA ? 1 : 0; vb = hasB ? 1 : 0; break;
        }
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const paged = total > PAGE_SIZE ? sorted.slice(startIdx, endIdx) : sorted;

  async function openGroup(g: Group) {
    try {
  const data = await gql<{ group: Group }>('query($id:String!){ group(id:$id){ id name createdAt userCount adminCount users { id name email } admins { id } billingName billingEmail billingAddress billingPostalCode billingCity billingCountry vatNumber companyNumber iban bic } }', { id: g.id });
      setEditing(data.group);
      // initialize draft from loaded group
      setDraftName(data.group.name);
      setDraftMembers(data.group.users || []);
      setDraftAdminIds(new Set((data.group.admins || []).map(a => a.id)));
      setOpenEdit(true);
      setUserSearch('');
      setUserResults([]);
    } catch (e) { toast.error((e as Error).message); }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    try {
      // Compute diffs
      const origMemberIds = new Set((editing.users || []).map(u => u.id));
      const draftMemberIds = new Set(draftMembers.map(u => u.id));
      const toAdd = Array.from(draftMemberIds).filter(id => !origMemberIds.has(id));
      const toRemove = Array.from(origMemberIds).filter(id => !draftMemberIds.has(id));

      const origAdminIds = new Set((editing.admins || []).map(a => a.id));
      const draftAdmins = draftAdminIds;
      const adminAdds = Array.from(draftAdmins).filter(id => !origAdminIds.has(id));
      const adminRemoves = Array.from(origAdminIds).filter(id => !draftAdmins.has(id));

      // 1) Update name if changed
      const invoiceDirty = (
        draftBillingName !== editing.billingName ||
        draftBillingEmail !== editing.billingEmail ||
        draftBillingAddress !== editing.billingAddress ||
        draftBillingPostalCode !== editing.billingPostalCode ||
        draftBillingCity !== editing.billingCity ||
        draftBillingCountry !== editing.billingCountry ||
        draftVatNumber !== editing.vatNumber ||
        draftCompanyNumber !== editing.companyNumber ||
        draftIban !== editing.iban ||
        draftBic !== editing.bic
      );
      if ((draftName.trim() && draftName.trim() !== editing.name) || invoiceDirty) {
        await gql<{ updateGroup: Group }>('mutation($id:String!,$input:UpdateGroupInput!){ updateGroup(id:$id,input:$input){ id name } }', {
          id: editing.id,
          input: {
            name: draftName.trim() !== editing.name ? draftName.trim() : undefined,
            billingName: draftBillingName || null,
            billingEmail: draftBillingEmail || null,
            billingAddress: draftBillingAddress || null,
            billingPostalCode: draftBillingPostalCode || null,
            billingCity: draftBillingCity || null,
            billingCountry: draftBillingCountry || null,
            vatNumber: draftVatNumber || null,
            companyNumber: draftCompanyNumber || null,
            iban: draftIban || null,
            bic: draftBic || null,
          }
        });
      }

      // 2) Add members first
      for (const userId of toAdd) {
        await gql('mutation($g:String!,$u:String!){ addUserToGroup(groupId:$g,userId:$u){ id } }', { g: editing.id, u: userId });
      }

      // 3) Add admins next (to satisfy last-admin guard)
      for (const userId of adminAdds) {
        await gql('mutation($g:String!,$u:String!){ addGroupAdmin(groupId:$g,userId:$u){ id } }', { g: editing.id, u: userId });
      }

      // 4) Remove admins
      for (const userId of adminRemoves) {
        await gql('mutation($g:String!,$u:String!){ removeGroupAdmin(groupId:$g,userId:$u){ id } }', { g: editing.id, u: userId });
      }

      // 5) Remove members last
      for (const userId of toRemove) {
        await gql('mutation($g:String!,$u:String!){ removeUserFromGroup(groupId:$g,userId:$u){ id } }', { g: editing.id, u: userId });
      }

      toast.success('Group saved');
      setOpenEdit(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function searchUsers(q: string) {
    setUserSearch(q);
    if (!q.trim()) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
  const data = await gql<{ users: User[] }>('query { users { id name email } }');
  const list = data.users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
  // Exclude already selected members in draft
  setUserResults(list.filter(u => !draftMembers.some(m => m.id === u.id)).slice(0,20));
    } catch(e){ toast.error((e as Error).message);} finally { setSearchingUsers(false); }
  }

  function addUserToDraft(user: User) {
    // no-op if already a member
    if (draftMembers.some(m => m.id === user.id)) return;
    setDraftMembers(m => [...m, user]);
    setUserResults(r => r.filter(u => u.id !== user.id));
  }

  function removeUserFromDraft(userId: string) {
    setDraftMembers(m => m.filter(u => u.id !== userId));
    setDraftAdminIds(ids => { const next = new Set(ids); next.delete(userId); return next; });
  }

  function isAdmin(userId: string): boolean {
    return draftAdminIds.has(userId)
  }

  function toggleAdmin(userId: string) {
    setDraftAdminIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  }

  async function handleDeleteGroup() {
    if (!editing) return;
    try {
      await gql('mutation($id:String!){ deleteGroup(id:$id) }', { id: editing.id });
      toast.success('Group deleted');
      setGroups(gs => gs.filter(g => g.id !== editing.id));
      setConfirmDelete(false);
      setOpenEdit(false);
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Invoice draft state
  const [draftBillingName, setDraftBillingName] = React.useState<string>('');
  const [draftBillingEmail, setDraftBillingEmail] = React.useState<string>('');
  const [draftBillingAddress, setDraftBillingAddress] = React.useState<string>('');
  const [draftBillingPostalCode, setDraftBillingPostalCode] = React.useState<string>('');
  const [draftBillingCity, setDraftBillingCity] = React.useState<string>('');
  const [draftBillingCountry, setDraftBillingCountry] = React.useState<string>('');
  const [draftVatNumber, setDraftVatNumber] = React.useState<string>('');
  const [draftCompanyNumber, setDraftCompanyNumber] = React.useState<string>('');
  const [draftIban, setDraftIban] = React.useState<string>('');
  const [draftBic, setDraftBic] = React.useState<string>('');
  const [showInvoice, setShowInvoice] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setDraftBillingName(editing.billingName || '');
      setDraftBillingEmail(editing.billingEmail || '');
      setDraftBillingAddress(editing.billingAddress || '');
      setDraftBillingPostalCode(editing.billingPostalCode || '');
      setDraftBillingCity(editing.billingCity || '');
      setDraftBillingCountry(editing.billingCountry || '');
      setDraftVatNumber(editing.vatNumber || '');
      setDraftCompanyNumber(editing.companyNumber || '');
      setDraftIban(editing.iban || '');
      setDraftBic(editing.bic || '');
  // Auto-expand invoice section if any field has a value.
  const anyBilling = [editing.billingName, editing.billingEmail, editing.billingAddress, editing.billingPostalCode, editing.billingCity, editing.billingCountry, editing.vatNumber, editing.companyNumber, editing.iban, editing.bic].some(Boolean);
  setShowInvoice(anyBilling);
    }
  }, [editing]);

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
              <TableHead className="w-[120px]"><SortHeader label="ID" k="id" /></TableHead>
              <TableHead><SortHeader label="Name" k="name" /></TableHead>
              <TableHead><SortHeader label="Members #" k="members" /></TableHead>
              <TableHead><SortHeader label="Admins #" k="admins" /></TableHead>
              <TableHead><SortHeader label="Status" k="status" /></TableHead>
              {/* Replaced Created column with Invoices status; removed separate Invoice column */}
              <TableHead><SortHeader label="Invoices" k="invoice" /></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && paged.map((g, i) => (
              <TableRow key={g.id}>
                <TableCell className="text-xs text-muted-foreground">{startIdx + i + 1}</TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[160px]" title={g.id}>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell><Badge variant="outline">{g.userCount}</Badge></TableCell>
                <TableCell><Badge variant="secondary">{adminCountOf(g)}</Badge></TableCell>
                <TableCell>
                  {adminCountOf(g) > 0 ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300">Active</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {(g.billingName || g.billingEmail || g.vatNumber || g.companyNumber || g.iban) ? (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300">Enabled</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300">Disabled</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => openGroup(g)}><IconEdit className="size-4" />Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !sorted.length && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No groups</TableCell></TableRow>}
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
  <Dialog open={openEdit} onOpenChange={(o)=>{ setOpenEdit(o); if(!o){ setEditing(null); setConfirmDelete(false); } }}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveEdit} className="flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Group</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto space-y-6 py-2 pr-1">
              <div className="space-y-2 px-1">
                <label className="text-sm font-medium">Group Name</label>
                <Input value={draftName} onChange={(e)=> setDraftName(e.target.value)} />
              </div>
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Members ({draftMembers.length})</h4>
                </div>
                <div className="rounded border p-2 max-h-60 overflow-auto space-y-2 text-sm">
                  {draftMembers.length ? draftMembers.map(u => (
                    <div key={u.id} className="flex items-center justify-between gap-2 bg-muted/40 px-2 py-1 rounded">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={isAdmin(u.id) ? 'default' : 'outline'} className="text-[10px]">{isAdmin(u.id) ? 'Admin' : 'Member'}</Badge>
                        <Button type="button" size="sm" variant="outline" onClick={()=>toggleAdmin(u.id)}>
                          {isAdmin(u.id) ? 'Demote' : 'Promote'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={()=>removeUserFromDraft(u.id)}>
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )) : <div className="text-xs text-muted-foreground">No members</div> }
                </div>
              </div>
              <Separator />
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Invoice Details (optional)</h4>
                  <button type="button" onClick={()=>setShowInvoice(s=>!s)} className="text-xs underline text-muted-foreground hover:text-foreground">{showInvoice ? 'Hide':'Show'}</button>
                </div>
                {showInvoice && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Billing Name</label>
                      <Input value={draftBillingName} onChange={e=>setDraftBillingName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Billing Email</label>
                      <Input value={draftBillingEmail} onChange={e=>setDraftBillingEmail(e.target.value)} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium">Address</label>
                      <Input value={draftBillingAddress} onChange={e=>setDraftBillingAddress(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Postal Code</label>
                      <Input value={draftBillingPostalCode} onChange={e=>setDraftBillingPostalCode(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">City</label>
                      <Input value={draftBillingCity} onChange={e=>setDraftBillingCity(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Country</label>
                      <Input value={draftBillingCountry} onChange={e=>setDraftBillingCountry(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">VAT Number</label>
                      <Input value={draftVatNumber} onChange={e=>setDraftVatNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Company Number</label>
                      <Input value={draftCompanyNumber} onChange={e=>setDraftCompanyNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">IBAN</label>
                      <Input value={draftIban} onChange={e=>setDraftIban(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">BIC</label>
                      <Input value={draftBic} onChange={e=>setDraftBic(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
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
                        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={()=> addUserToDraft(u)}>
                          <IconPlus className="size-4" /> Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <Button type="button" variant="destructive" className="w-full gap-2" onClick={() => setConfirmDelete(true)}>
                <IconTrash className="size-4" /> Delete Group
              </Button>
              {confirmDelete && (
                <div className="rounded-md border p-3 text-sm space-y-3">
                  <p className="font-medium">Are you sure you want to delete this group?</p>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="destructive" onClick={handleDeleteGroup}>Yes, delete</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
