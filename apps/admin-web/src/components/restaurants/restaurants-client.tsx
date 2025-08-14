"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconPlus, IconEdit, IconTrash, IconChevronUp, IconChevronDown, IconArrowsSort, IconInfoCircle, IconCheck, IconX, IconList } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RestaurantMenusManager } from './restaurant-menus-manager';

interface Restaurant { id: string; name: string; slug: string; email: string; phone?: string; cuisine?: string; isActive: boolean; isFeatured: boolean; createdAt: string; updatedAt: string; address: string; vatNumber?: string; billingName?: string; billingEmail?: string; billingAddress?: string; billingPostalCode?: string; billingCity?: string; billingCountry?: string; companyNumber?: string; iban?: string; bic?: string; admins?: { id: string; name: string; email: string }[] }

const API = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/graphql';
async function gql<T=any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query, variables }), cache: 'no-store' });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const CUISINES = ['UNSPECIFIED','BURGER','PIZZA','SUSHI','INDIAN','CHINESE','THAI','MEXICAN','MEDITERRANEAN','DESSERT','VEGAN','HEALTHY'];

type SortKey = 'name' | 'slug' | 'email' | 'cuisine' | 'created' | 'status' | 'featured' | 'admins';

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
  const [menusOpen, setMenusOpen] = React.useState(false);
  const [menusRestaurant, setMenusRestaurant] = React.useState<Restaurant | null>(null);

  // Form state
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cuisine, setCuisine] = React.useState<string>('UNSPECIFIED');
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [active, setActive] = React.useState(true);
  const ALLERGY_TAG_OPTIONS = ['Vega','Vegan','Glutenvrij','Lactosevrij','Halal'];
  const [allergyTags, setAllergyTags] = React.useState<string[]>([]);
  const [address, setAddress] = React.useState('');
  const [showBilling, setShowBilling] = React.useState(false);
  // Billing
  const [vatNumber, setVatNumber] = React.useState('');
  const [billingName, setBillingName] = React.useState('');
  const [billingEmail, setBillingEmail] = React.useState('');
  const [billingAddress, setBillingAddress] = React.useState('');
  const [billingPostalCode, setBillingPostalCode] = React.useState('');
  const [billingCity, setBillingCity] = React.useState('');
  const [billingCountry, setBillingCountry] = React.useState('');
  const [companyNumber, setCompanyNumber] = React.useState('');
  const [iban, setIban] = React.useState('');
  const [bic, setBic] = React.useState('');

  const [stagedAdminIds, setStagedAdminIds] = React.useState<string[]>([]);

  function resetForm(r?: Restaurant) {
    if (!r) {
  setName(''); setSlug(''); setEmail(''); setPhone(''); setCuisine('UNSPECIFIED'); setIsFeatured(false); setActive(true); setConfirmDelete(false); setAllergyTags([]);
      setAddress('');
      setVatNumber(''); setBillingName(''); setBillingEmail(''); setBillingAddress(''); setBillingPostalCode(''); setBillingCity(''); setBillingCountry(''); setCompanyNumber(''); setIban(''); setBic('');
  setShowBilling(false);
  setStagedAdminIds([]);
    } else {
  setName(r.name); setSlug(r.slug); setEmail(r.email); setPhone(r.phone || ''); setCuisine(r.cuisine || 'UNSPECIFIED'); setIsFeatured(r.isFeatured); setActive(r.isActive); setConfirmDelete(false); setAllergyTags(((r as any).allergyTags)||[]);
      setAddress((r as any).address || '');
      setVatNumber((r as any).vatNumber || ''); setBillingName((r as any).billingName || ''); setBillingEmail((r as any).billingEmail || ''); setBillingAddress((r as any).billingAddress || ''); setBillingPostalCode((r as any).billingPostalCode || ''); setBillingCity((r as any).billingCity || ''); setBillingCountry((r as any).billingCountry || ''); setCompanyNumber((r as any).companyNumber || ''); setIban((r as any).iban || ''); setBic((r as any).bic || '');
  const hasBilling = [vatNumber, billingName, billingEmail, billingAddress, billingPostalCode, billingCity, billingCountry, companyNumber, iban, bic].some(Boolean);
      setShowBilling(hasBilling);
  setStagedAdminIds((r.admins||[]).map(a=>a.id));
    }
  }

  async function load() {
    setLoading(true);
    try {
  const data = await gql<{ restaurants: Restaurant[] }>(`query { restaurants { id name slug email phone cuisine isActive isFeatured createdAt updatedAt address vatNumber billingName billingEmail billingAddress billingPostalCode billingCity billingCountry companyNumber iban bic admins { id name email } } }`);
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
  case 'status': va=a.isActive?1:0; vb=b.isActive?1:0; break;
  case 'featured': va=a.isFeatured?1:0; vb=b.isFeatured?1:0; break;
  case 'admins': va=(a.admins?.length)||0; vb=(b.admins?.length)||0; break;
      }
      if (va < vb) return sortDir==='asc'? -1:1;
      if (va > vb) return sortDir==='asc'? 1:-1;
      return 0;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  function openNew() { setEditing(null); resetForm(); setOpen(true); }
  function openEdit(r: Restaurant) { setEditing(r); resetForm(r); setOpen(true); }

  // Menus summary for activation requirements
  const [menuSummary, setMenuSummary] = React.useState<any[]|null>(null);
  React.useEffect(()=>{
    async function fetchMenus() {
      if (!editing) { setMenuSummary(null); return; }
      try {
        const data = await gql<{ menusByRestaurant: any[] }>(`query($id:ID!){ menusByRestaurant(restaurantId:$id){ id isActive categories { id items { id isEnabled } } } }`, { id: editing.id });
        setMenuSummary(data.menusByRestaurant);
      } catch { /* ignore */ }
    }
    fetchMenus();
  }, [editing, open]);

  function activationGaps(): string[] {
    if (!editing) return ['Restaurant not yet created'];
    const gaps: string[] = [];
    const adminCount = (editing.admins?.length)||0;
    if (adminCount === 0) gaps.push('Assign at least one restaurant admin');
    const menus = menuSummary||[];
    if (!menus.length) gaps.push('Create a menu');
    const activeMenu = menus.find(m=>m.isActive);
    if (menus.length && !activeMenu) gaps.push('Activate a menu');
    if (activeMenu) {
      const categories = activeMenu.categories||[];
      if (!categories.length) gaps.push('Add a category to the active menu');
      const anyEnabledItem = categories.some((c:any)=> (c.items||[]).some((it:any)=>it.isEnabled));
  const anyItem = categories.some((c:any)=> (c.items||[]).length>0);
  if (categories.length && !anyItem) gaps.push('Add at least one item to the active menu');
  if (categories.length && anyItem && !anyEnabledItem) gaps.push('Add an enabled item to the active menu');
    }
    return gaps;
  }
  const gaps = activationGaps();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !email.trim()) { toast.error('Name, slug, email required'); return; }
    setSaving(true);
    try {
    if (editing) {
  await gql(`mutation($data:UpdateRestaurantInput!){ updateRestaurant(data:$data){ id } }`, { data: { id: editing.id, name: name.trim(), slug: slug.trim(), email: email.trim(), phone: phone || null, address: address.trim(), cuisine: cuisine !== 'UNSPECIFIED'? cuisine: null, isFeatured: isFeatured, isActive: active, allergyTags, vatNumber: vatNumber || null, billingName: billingName || null, billingEmail: billingEmail || null, billingAddress: billingAddress || null, billingPostalCode: billingPostalCode || null, billingCity: billingCity || null, billingCountry: billingCountry || null, companyNumber: companyNumber || null, iban: iban || null, bic: bic || null } });
        toast.success('Restaurant updated');
    } else {
  await gql(`mutation($data:CreateRestaurantInput!){ createRestaurant(data:$data){ id } }`, { data: { name: name.trim(), slug: slug.trim(), email: email.trim(), phone: phone || null, address: address.trim(), cuisine: cuisine !== 'UNSPECIFIED'? cuisine: null, isFeatured, allergyTags, vatNumber: vatNumber || null, billingName: billingName || null, billingEmail: billingEmail || null, billingAddress: billingAddress || null, billingPostalCode: billingPostalCode || null, billingCity: billingCity || null, billingCountry: billingCountry || null, companyNumber: companyNumber || null, iban: iban || null, bic: bic || null, adminUserIds: stagedAdminIds } });
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
              <TableHead><SortHeader label="Status" k="status"/></TableHead>
              <TableHead><SortHeader label="Featured" k="featured"/></TableHead>
              <TableHead>Allergy Tags</TableHead>
              <TableHead><SortHeader label="Created" k="created"/></TableHead>
              <TableHead><SortHeader label="Admins" k="admins"/></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
  {loading && <TableRow><TableCell colSpan={10} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && sorted.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="font-mono text-xs" title={r.slug}>{r.slug}</TableCell>
                <TableCell className="text-xs" title={r.email}>{r.email}</TableCell>
                <TableCell>{r.cuisine ? <Badge variant="outline" className="uppercase text-[10px] tracking-wide">{r.cuisine}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                <TableCell>{r.isActive ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300">Active</Badge>:<Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300">Inactive</Badge>}</TableCell>
                <TableCell>{r.isFeatured ? <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300">Yes</Badge>: <span className="text-xs text-muted-foreground">No</span>}</TableCell>
                <TableCell>
                  {((r as any).allergyTags||[]).length ? (
                    <div className="flex flex-wrap gap-1 max-w-[180px]">{((r as any).allergyTags||[]).slice(0,6).map((t:string)=><Badge key={t} variant="outline" className="text-[9px] uppercase tracking-wide px-1 py-0">{t}</Badge>)}{((r as any).allergyTags||[]).length>6 && <span className="text-[10px] text-muted-foreground">+{((r as any).allergyTags||[]).length-6}</span>}</div>
                  ) : <span className="text-[10px] text-muted-foreground">None</span>}
                </TableCell>
                <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
        <TableCell>{!r.admins?.length ? <span className="text-xs text-muted-foreground">None</span> : <Badge variant="outline" className="text-[10px]">{r.admins.length}</Badge>}</TableCell>
                <TableCell className="text-right flex gap-2 justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={()=>openEdit(r)}><IconEdit className="size-4"/>Edit</Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={()=>{ setMenusRestaurant(r); setMenusOpen(true); }}><IconList className="size-4"/>Menus</Button>
                </TableCell>
              </TableRow>
            ))}
  {!loading && !sorted.length && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No restaurants</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if(!o){ setEditing(null);} }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
            <DialogHeader className="px-0 pt-0">
              <DialogTitle>{editing ? 'Edit Restaurant' : 'New Restaurant'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 border rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Restaurant Admins</span>
                  <span className="text-[10px] text-muted-foreground">Assign RESTAURANT users {editing? '' : '(can add before saving)'}</span>
                </div>
                <AdminSelector restaurantId={editing?.id} initialAdmins={(editing as any)?.admins || []} stagedIdsState={[stagedAdminIds, setStagedAdminIds]} onChanged={()=>load()} />
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">Allergy Tags
                  <span className="text-[10px] text-muted-foreground font-normal">(toggle to include)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_TAG_OPTIONS.map(tag => {
                    const activeTag = allergyTags.includes(tag);
                    return (
                      <button type="button" key={tag} onClick={()=>setAllergyTags(t=> t.includes(tag)? t.filter(x=>x!==tag): [...t, tag])} className={`px-2 py-1 rounded-md text-xs font-medium border transition ${activeTag? 'bg-primary text-primary-foreground border-primary':'bg-muted hover:bg-muted/70 border-border text-foreground'}`}>{tag}</button>
                    );
                  })}
                </div>
                {!allergyTags.length && <div className="text-[10px] text-muted-foreground">No tags selected</div>}
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Address *</label>
                <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, number, city" />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Flags</label>
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none"><input type="checkbox" className="scale-110" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} /> <span>Featured</span></label>
                  </div>
                </div>
                {editing && (
                  <div className="border-t pt-4">
                  <div className="border rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold flex items-center gap-2">Activation Status {active ? <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">Active</Badge>: <Badge className="bg-red-500/20 text-red-700 dark:text-red-300">Inactive</Badge>}</span>
                    </div>
                    {!active && (
                      <div className="space-y-2">
                        <div className="text-xs flex items-center gap-1 text-muted-foreground"><IconInfoCircle className="size-3"/> Requirements before activation:</div>
                        <ul className="text-xs space-y-1 list-disc ml-4">
                          {['Assign at least one restaurant admin','Create a menu','Activate a menu','Add a category to the active menu','Add an enabled item to the active menu'].map(req => {
                            const met = !gaps.includes(req);
                            return <li key={req} className={`flex items-start gap-2 ${met? 'text-emerald-600 dark:text-emerald-400':'text-muted-foreground'}`}><span className="mt-0.5">{met? <IconCheck className="size-3"/>:<IconX className="size-3"/>}</span><span>{req}</span></li>;
                          })}
                        </ul>
                        <Button type="button" size="sm" disabled={gaps.length>0} onClick={()=>{ if(gaps.length>0) return; if(confirm('Mark restaurant as Active? This will be applied when you press Save Changes.')) { setActive(true); } }}>
                          Mark Active (Save to apply)
                        </Button>
                        {gaps.length>0 && <div className="text-[10px] text-muted-foreground">Complete remaining requirements to enable staging activation.</div>}
                        {active !== editing.isActive && <div className="text-[10px] text-amber-600">Activation change pending – remember to Save.</div>}
                      </div>
                    )}
                    {active && (
                      <div className="space-y-2">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Restaurant is active.</div>
                        <Button type="button" size="sm" variant="outline" onClick={()=>{ if(confirm('Deactivate this restaurant? Change will apply on Save.')) setActive(false); }}>
                          Deactivate (Save to apply)
                        </Button>
                        {active !== editing.isActive && <div className="text-[10px] text-amber-600">Deactivation pending – remember to Save.</div>}
                      </div>
                    )}
                  </div>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Invoice & Payout Details</span>
                  <button type="button" onClick={()=>setShowBilling(s=>!s)} className="text-xs underline text-muted-foreground hover:text-foreground">{showBilling? 'Hide':'Show'}</button>
                </div>
                {showBilling && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1"><label className="text-xs font-medium">VAT Number</label><Input value={vatNumber} onChange={e=>setVatNumber(e.target.value)} placeholder="NL123456789B01" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Company Number</label><Input value={companyNumber} onChange={e=>setCompanyNumber(e.target.value)} placeholder="KVK" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Billing Name</label><Input value={billingName} onChange={e=>setBillingName(e.target.value)} placeholder="Legal entity" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Billing Email</label><Input value={billingEmail} onChange={e=>setBillingEmail(e.target.value)} type="email" placeholder="finance@example.com" /></div>
                    <div className="space-y-1 md:col-span-2"><label className="text-xs font-medium">Billing Address</label><Input value={billingAddress} onChange={e=>setBillingAddress(e.target.value)} placeholder="Street and number" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Postal Code</label><Input value={billingPostalCode} onChange={e=>setBillingPostalCode(e.target.value)} placeholder="1234AB" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">City</label><Input value={billingCity} onChange={e=>setBillingCity(e.target.value)} placeholder="Amsterdam" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">Country</label><Input value={billingCountry} onChange={e=>setBillingCountry(e.target.value)} placeholder="NL" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">IBAN</label><Input value={iban} onChange={e=>setIban(e.target.value)} placeholder="NL00BANK0123456789" /></div>
                    <div className="space-y-1"><label className="text-xs font-medium">BIC</label><Input value={bic} onChange={e=>setBic(e.target.value)} placeholder="BANKNL2A" /></div>
                  </div>
                )}
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
            <DialogFooter className="gap-2 px-0 pb-0">
              <Button type="submit" disabled={saving}>{saving? 'Saving...': editing? 'Save Changes':'Create'}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {menusRestaurant && (
        <RestaurantMenusManager
          restaurantId={menusRestaurant.id}
          restaurantName={menusRestaurant.name}
          open={menusOpen}
          onOpenChange={(o)=>{ setMenusOpen(o); if(!o) setMenusRestaurant(null); }}
        />
      )}
    </div>
  );
}

// Lightweight selector for admins
function AdminSelector({ restaurantId, initialAdmins, stagedIdsState, onChanged }: { restaurantId?: string; initialAdmins: {id:string; name:string; email:string}[]; stagedIdsState?: [string[], React.Dispatch<React.SetStateAction<string[]>>]; onChanged(): void }) {
  const [admins, setAdmins] = React.useState(initialAdmins);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{id:string; name:string; email:string; role:string}[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState<string|null>(null);
  const hasRestaurant = !!restaurantId;
  const [stagedIds, setStagedIds] = stagedIdsState || React.useState<string[]>([]);

  React.useEffect(()=>{ setAdmins(initialAdmins); }, [initialAdmins]);

  async function search(q: string) {
    if(!q.trim()) { setResults([]); return; }
    setSearching(true); setError(null);
    try {
      // Reuse users query and filter client-side for role RESTAURANT
      const data = await gql<{ users: any[] }>(`query { users { id name email role } }`);
      const lower = q.toLowerCase();
  setResults(data.users.filter(u => u.role==='RESTAURANT' && (u.name.toLowerCase().includes(lower) || u.email.toLowerCase().includes(lower)) && !admins.find(a=>a.id===u.id) && !stagedIds.includes(u.id)).slice(0,10));
    } catch(e:any){ setError(e.message); }
    finally { setSearching(false); }
  }
  React.useEffect(()=>{ const t = setTimeout(()=>search(query), 300); return ()=>clearTimeout(t); }, [query]);

  async function add(userId: string) {
    if (!hasRestaurant) {
      const added = results.find(r=>r.id===userId);
      if (added) { setAdmins(a=>[...a, added]); setStagedIds(ids=>[...ids, userId]); }
      setResults(rs=>rs.filter(r=>r.id!==userId)); setQuery('');
      return;
    }
    try { await gql(`mutation($r: String!, $u: String!){ addRestaurantAdmin(restaurantId:$r, userId:$u) }`, { r: restaurantId, u: userId });
      const added = results.find(r=>r.id===userId); if(added) setAdmins(a=>[...a, added]);
      setResults(rs=>rs.filter(r=>r.id!==userId)); setQuery(''); onChanged();
    } catch(e:any){ setError(e.message); }
  }
  async function remove(userId: string) {
    if (!hasRestaurant) {
      setAdmins(a=>a.filter(a=>a.id!==userId));
      setStagedIds(ids=>ids.filter(i=>i!==userId));
      return;
    }
    try { await gql(`mutation($r:String!,$u:String!){ removeRestaurantAdmin(restaurantId:$r, userId:$u) }`, { r: restaurantId, u: userId });
      setAdmins(a=>a.filter(a=>a.id!==userId)); onChanged();
    } catch(e:any){ setError(e.message); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
  {admins.map(a => (
          <span key={a.id} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs">
            {a.name || a.email}
            <button type="button" onClick={()=>remove(a.id)} className="text-muted-foreground hover:text-foreground">×</button>
          </span>
        ))}
        {!admins.length && <span className="text-xs text-muted-foreground">No admins assigned</span>}
      </div>
      <div className="space-y-2">
        <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search restaurant users..." />
        {error && <div className="text-xs text-destructive">{error}</div>}
        {query && (
          <div className="border rounded-md max-h-40 overflow-y-auto divide-y text-xs bg-background">
            {searching && <div className="p-2 text-muted-foreground">Searching…</div>}
            {!searching && !results.length && <div className="p-2 text-muted-foreground">No matches</div>}
            {results.map(u => (
              <button key={u.id} type="button" onClick={()=>add(u.id)} className="w-full text-left p-2 hover:bg-muted/50 flex flex-col">
                <span className="font-medium">{u.name || '—'}</span>
                <span className="text-[10px] text-muted-foreground">{u.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
