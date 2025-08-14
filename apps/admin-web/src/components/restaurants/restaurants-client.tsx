"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconPlus, IconEdit, IconTrash, IconChevronUp, IconChevronDown, IconArrowsSort } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Restaurant { id: string; name: string; slug: string; email: string; phone?: string; cuisine?: string; isActive: boolean; isFeatured: boolean; createdAt: string; updatedAt: string; }

const API = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/graphql';
async function gql<T=any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query, variables }), cache: 'no-store' });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const CUISINES = ['UNSPECIFIED','BURGER','PIZZA','SUSHI','INDIAN','CHINESE','THAI','MEXICAN','MEDITERRANEAN','DESSERT','VEGAN','HEALTHY'];

type SortKey = 'name' | 'slug' | 'email' | 'cuisine' | 'created';

export function RestaurantsClient() {
  const [items, setItems] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [sortKey, setSortKey] = React.useState<SortKey>('created');
  const [sortDir, setSortDir] = React.useState<'asc'|'desc'>('desc');
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Restaurant | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cuisine, setCuisine] = React.useState<string>('UNSPECIFIED');
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [active, setActive] = React.useState(true);

  function resetForm(r?: Restaurant) {
    if (!r) {
      setName(''); setSlug(''); setEmail(''); setPhone(''); setCuisine('UNSPECIFIED'); setIsFeatured(false); setActive(true); setConfirmDelete(false);
    } else {
      setName(r.name); setSlug(r.slug); setEmail(r.email); setPhone(r.phone || ''); setCuisine(r.cuisine || 'UNSPECIFIED'); setIsFeatured(r.isFeatured); setActive(r.isActive); setConfirmDelete(false);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const data = await gql<{ restaurants: Restaurant[] }>(`query { restaurants { id name slug email phone cuisine isActive isFeatured createdAt updatedAt } }`);
      setItems(data.restaurants);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, []);

  function onSortClick(k: SortKey) {
    setSortDir(d => (sortKey === k ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(k);
  }
  function SortHeader({ label, k }: { label:string; k:SortKey }) {
    const active = sortKey === k;
    return (
      <button type="button" onClick={()=>onSortClick(k)} className={`flex items-center gap-1 ${active? 'text-foreground':'text-foreground/70'} hover:text-foreground`}>
        <span>{label}</span>
        {active ? (sortDir==='asc'? <IconChevronUp className="size-3.5"/>:<IconChevronDown className="size-3.5"/>) : <IconArrowsSort className="size-3.5"/>}
      </button>
    );
  }

  const filtered = items.filter(r => {
    const q = filter.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });
  const sorted = React.useMemo(()=>{
    const list = [...filtered];
    list.sort((a,b) => {
      let va: any; let vb: any;
      switch (sortKey) {
        case 'name': va=a.name.toLowerCase(); vb=b.name.toLowerCase(); break;
        case 'slug': va=a.slug.toLowerCase(); vb=b.slug.toLowerCase(); break;
        case 'email': va=a.email.toLowerCase(); vb=b.email.toLowerCase(); break;
        case 'cuisine': va=a.cuisine||''; vb=b.cuisine||''; break;
        case 'created': va=new Date(a.createdAt).getTime(); vb=new Date(b.createdAt).getTime(); break;
      }
      if (va < vb) return sortDir==='asc'? -1:1;
      if (va > vb) return sortDir==='asc'? 1:-1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  function openNew() { setEditing(null); resetForm(); setOpen(true); }
  function openEdit(r: Restaurant) { setEditing(r); resetForm(r); setOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !email.trim()) { toast.error('Name, slug, email required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await gql(`mutation($data:UpdateRestaurantInput!){ updateRestaurant(data:$data){ id } }`, { data: { id: editing.id, name: name.trim(), slug: slug.trim(), email: email.trim(), phone: phone || null, cuisine: cuisine !== 'UNSPECIFIED'? cuisine: null, isFeatured: isFeatured, isActive: active } });
        toast.success('Restaurant updated');
      } else {
        await gql(`mutation($data:CreateRestaurantInput!){ createRestaurant(data:$data){ id } }`, { data: { name: name.trim(), slug: slug.trim(), email: email.trim(), phone: phone || null, cuisine: cuisine !== 'UNSPECIFIED'? cuisine: null, isFeatured, } });
        toast.success('Restaurant created');
      }
      setOpen(false); await load();
    } catch(e){ toast.error((e as Error).message); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!editing) return; if (!confirm('Delete this restaurant?')) return; setSaving(true);
    try { await gql(`mutation($id:String!){ deleteRestaurant(id:$id) }`, { id: editing.id }); toast.success('Restaurant deleted'); setOpen(false); await load(); }
    catch(e){ toast.error((e as Error).message);} finally { setSaving(false);} }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="flex gap-2 flex-1">
          <Input placeholder="Filter restaurants" value={filter} onChange={e=>setFilter(e.target.value)} />
        </div>
        <Button onClick={openNew} className="gap-1"><IconPlus className="size-4"/> New Restaurant</Button>
      </div>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortHeader label="Name" k="name"/></TableHead>
              <TableHead><SortHeader label="Slug" k="slug"/></TableHead>
              <TableHead><SortHeader label="Email" k="email"/></TableHead>
              <TableHead><SortHeader label="Cuisine" k="cuisine"/></TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead><SortHeader label="Created" k="created"/></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && sorted.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs" title={r.slug}>{r.slug}</TableCell>
                <TableCell className="text-xs" title={r.email}>{r.email}</TableCell>
                <TableCell>{r.cuisine ? <Badge variant="outline" className="uppercase text-[10px] tracking-wide">{r.cuisine}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>{r.isActive ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300">Active</Badge>:<Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300">Inactive</Badge>}</TableCell>
                <TableCell>{r.isFeatured ? <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300">Yes</Badge>: <span className="text-xs text-muted-foreground">No</span>}</TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={()=>openEdit(r)}><IconEdit className="size-4"/>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !sorted.length && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No restaurants</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if(!o){ setEditing(null);} }}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Restaurant' : 'New Restaurant'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 col-span-2">
                <label className="text-sm font-medium">Name *</label>
                <Input value={name} onChange={e=>{ setName(e.target.value); if(!editing){ setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')); } }} placeholder="Restaurant name" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Slug *</label>
                <Input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="slug" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email *</label>
                <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="contact@example.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+31..." />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cuisine</label>
                <Select value={cuisine} onValueChange={v=>setCuisine(v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select cuisine" /></SelectTrigger>
                  <SelectContent>
                    {CUISINES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flags</label>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" className="scale-110" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} /> <span>Featured</span></label>
                  {editing && <label className="inline-flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" className="scale-110" checked={active} onChange={e=>setActive(e.target.checked)} /> <span>Active</span></label>}
                </div>
              </div>
            </div>
            {editing && (
              <div className="space-y-2">
                <Button type="button" variant="destructive" className="w-full gap-2" onClick={()=>setConfirmDelete(c=>!c)}><IconTrash className="size-4"/>Delete</Button>
                {confirmDelete && (
                  <div className="border rounded-md p-3 text-sm space-y-3">
                    <p>Confirm delete restaurant? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>Yes, delete</Button>
                      <Button type="button" variant="outline" size="sm" onClick={()=>setConfirmDelete(false)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button type="submit" disabled={saving}>{saving? 'Saving...': editing? 'Save Changes':'Create'}</Button>
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
