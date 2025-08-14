"use client";
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from '@/components/ui/table';
import { IconPlus, IconX, IconChevronDown, IconChevronUp, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';

const API = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/graphql';
async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }), cache: 'no-store' });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

interface Order { id: string; groupId: string; restaurantId: string; userId: string; status: string; grandTotal: string; currency: string; createdAt: string; isFinalized: boolean; subtotal: string; taxAmount: string; deliveryFee: string; serviceFee: string; tipAmount: string; discountTotal: string; group?: { id: string; name: string; users?: { id: string; name: string; email: string }[] }; }
interface Group { id: string; name: string; users: { id: string; name: string; email: string }[] }
interface Restaurant { id: string; name: string }
interface MenuItem { id: string; name: string; price: string }
interface OrderItem { id: string; menuItemId: string; quantity: number; price: string; comment?: string | null; addedByUserId?: string }

export function OrdersClient() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Order | null>(null);
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [groupSearchResults, setGroupSearchResults] = React.useState<Group[]>([]);
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [draftGroupId, setDraftGroupId] = React.useState('');
  const [draftRestaurantId, setDraftRestaurantId] = React.useState('');
  const [groupSearch, setGroupSearch] = React.useState('');
  const [memberSearch, setMemberSearch] = React.useState('');
  const groupOptions = groupSearch.length >= 2 ? groupSearchResults : groups;
  const [draftAddress, setDraftAddress] = React.useState('');
  const [draftPostal, setDraftPostal] = React.useState('');
  const [draftCity, setDraftCity] = React.useState('');
  const [draftMemberUserId, setDraftMemberUserId] = React.useState('');
  const [addingItem, setAddingItem] = React.useState(false);
  const [draftMenuItemId, setDraftMenuItemId] = React.useState('');
  const [draftQty, setDraftQty] = React.useState(1);
  const [draftComment, setDraftComment] = React.useState('');
  const [draftItemUserId, setDraftItemUserId] = React.useState('');
  const [selectedGroup, setSelectedGroup] = React.useState<Group | null>(null);
  const [groupHighlight, setGroupHighlight] = React.useState(0);
  const [memberHighlight, setMemberHighlight] = React.useState(0);
  const [restaurantSearch, setRestaurantSearch] = React.useState('');
  const [restaurantHighlight, setRestaurantHighlight] = React.useState(0);

  async function loadOrders() {
    setLoading(true);
    try {
  const data = await gql<{ ordersAll: any[] }>(`query { ordersAll { id groupId restaurantId userId status currency createdAt isFinalized grandTotal group { id name } items { id menuItemId quantity price comment addedByUserId } } }`);
      setOrders(data.ordersAll);
    } catch (e:any) { toast.error(e.message); } finally { setLoading(false); }
  }
  React.useEffect(() => { loadOrders(); }, []);

  async function loadRefs() {
    try {
      const data = await gql<{ groups: any[]; restaurants: any[] }>(`query { groups { id name users { id name email } } restaurants { id name } }`);
      setGroups(data.groups);
      setRestaurants(data.restaurants);
    } catch (e:any) { toast.error(e.message); }
  }
  React.useEffect(() => { loadRefs(); }, []);

  // Debounced group search
  React.useEffect(() => {
    let active = true;
    if (groupSearch.trim().length < 2) { setGroupSearchResults([]); return; }
    const handle = setTimeout(async () => {
      try {
        const data = await gql<{ groupsSearch: any[] }>(`query($q:String!){ groupsSearch(q:$q){ id name users { id name email } } }`, { q: groupSearch.trim() });
        if (active) { setGroupSearchResults(data.groupsSearch); setGroupHighlight(0); }
      } catch { /* ignore */ }
    }, 300);
    return () => { active = false; clearTimeout(handle); };
  }, [groupSearch]);

  async function onCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!draftGroupId || !draftRestaurantId || !draftMemberUserId || !draftAddress || !draftPostal || !draftCity) return;
    setCreating(true);
    try {
  const data = await gql<{ createOrder: any }>(`mutation($input:CreateOrderInput!){ createOrder(input:$input){ id groupId restaurantId userId status currency createdAt isFinalized grandTotal } }`, { input: { groupId: draftGroupId, restaurantId: draftRestaurantId, userId: draftMemberUserId, deliveryAddressLine: draftAddress, deliveryPostalCode: draftPostal, deliveryCity: draftCity } });
      toast.success('Order created');
      setOpen(false);
      setDraftGroupId(''); setDraftRestaurantId(''); setDraftAddress(''); setDraftPostal(''); setDraftCity(''); setDraftMemberUserId('');
      loadOrders();
    } catch (e:any) { toast.error(e.message); } finally { setCreating(false); }
  }

  async function openEdit(o: Order) {
    try {
  const data = await gql<{ order: any }>(`query($id:String!){ order(id:$id){ id groupId restaurantId userId status currency createdAt isFinalized subtotal taxAmount deliveryFee serviceFee tipAmount discountTotal grandTotal deliveryAddressLine deliveryPostalCode deliveryCity items { id menuItemId quantity price comment addedByUserId } group { id name users { id name email } } } }`, { id: o.id });
      setEditing(data.order);
      setItems(data.order.items);
      setDraftGroupId(data.order.groupId);
      setDraftRestaurantId(data.order.restaurantId);
      setDraftMemberUserId(data.order.userId);
  setDraftItemUserId(data.order.userId);
      setDraftAddress(data.order.deliveryAddressLine || '');
      setDraftPostal(data.order.deliveryPostalCode || '');
      setDraftCity(data.order.deliveryCity || '');
      // load menu items for restaurant
      const mi = await gql<{ menusByRestaurant: any[] }>(`query($r:ID!){ menusByRestaurant(restaurantId:$r){ categories { items { id name price } } } }`, { r: data.order.restaurantId });
      const flat: MenuItem[] = (mi.menusByRestaurant||[]).flatMap(m => (m.categories||[]).flatMap((c:any) => c.items || []));
      setMenuItems(flat);
      setOpen(true);
    } catch (e:any) { toast.error(e.message); }
  }

  function calcSubtotal() { return items.reduce((acc, it) => acc + parseFloat(it.price) * it.quantity, 0); }

  async function addItem() {
    if (!editing) return;
    if (!draftMenuItemId || draftQty <= 0 || !draftItemUserId) return;
    setAddingItem(true);
    try {
      await gql<{ addOrderItem: any }>(`mutation($o:String!,$u:String!,$m:String!,$q:Int!,$c:String){ addOrderItem(orderId:$o,userId:$u,menuItemId:$m,quantity:$q,comment:$c){ id } }`, { o: editing.id, u: draftItemUserId, m: draftMenuItemId, q: draftQty, c: draftComment || null });
      // refetch order for fresh items & totals
      const refreshed = await gql<{ order: any }>(`query($id:String!){ order(id:$id){ id isFinalized subtotal taxAmount deliveryFee serviceFee tipAmount discountTotal grandTotal items { id menuItemId quantity price comment addedByUserId } } }`, { id: editing.id });
      setItems(refreshed.order.items);
      setEditing(e => e ? { ...e, ...refreshed.order } : e);
      setDraftMenuItemId(''); setDraftQty(1); setDraftComment('');
    } catch(e:any){ toast.error(e.message);} finally { setAddingItem(false); }
  }

  async function updateQuantity(itemId: string, delta: number) {
    const target = items.find(i => i.id === itemId); if (!target) return;
    const nextQty = target.quantity + delta; if (nextQty <= 0) return;
    try {
      const data = await gql<{ updateOrderItemQuantity: any }>(`mutation($id:String!,$u:String!,$q:Int!){ updateOrderItemQuantity(orderItemId:$id,userId:$u,quantity:$q){ id subtotal taxAmount deliveryFee serviceFee tipAmount discountTotal grandTotal items { id menuItemId quantity price comment addedByUserId } } }`, { id: itemId, u: draftMemberUserId, q: nextQty });
      setItems(data.updateOrderItemQuantity.items);
      setEditing(e => e ? { ...e, ...data.updateOrderItemQuantity } : e);
    } catch(e:any){ toast.error(e.message); }
  }

  async function removeItem(itemId: string) {
    try {
      await gql<{ removeOrderItem: boolean }>(`mutation($id:String!,$u:String!){ removeOrderItem(orderItemId:$id,userId:$u) }`, { id: itemId, u: draftMemberUserId });
      const refreshed = await gql<{ order: any }>(`query($id:String!){ order(id:$id){ id subtotal taxAmount deliveryFee serviceFee tipAmount discountTotal grandTotal items { id menuItemId quantity price comment addedByUserId } } }`, { id: editing?.id });
      setItems(refreshed.order.items);
      setEditing(e => e ? { ...e, ...refreshed.order } : e);
    } catch(e:any){ toast.error(e.message);}  }

  async function finalize() {
    if (!editing) return;
    try {
      await gql<{ finalizeOrder: any }>(`mutation($o:String!,$u:String!){ finalizeOrder(orderId:$o,userId:$u){ id isFinalized } }`, { o: editing.id, u: draftMemberUserId });
      toast.success('Finalized');
      setEditing(e => e ? { ...e, isFinalized: true } : e);
    } catch(e:any){ toast.error(e.message);}  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Orders</h2>
        <Button onClick={()=>{ setOpen(true); setEditing(null); setItems([]); }}>New Order</Button>
      </div>
      <div className="border rounded overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!loading && !orders.length && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No orders</TableCell></TableRow>}
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs max-w-[140px] truncate" title={o.id}>{o.id}</TableCell>
                <TableCell>{o.group?.name || o.groupId}</TableCell>
                <TableCell>{o.restaurantId}</TableCell>
                <TableCell><Badge variant={o.isFinalized ? 'default' : 'outline'}>{o.status}</Badge></TableCell>
                <TableCell>{o.grandTotal ? parseFloat(o.grandTotal).toFixed(2) : '0.00'} {o.currency}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                <TableCell><Button size="sm" variant="outline" onClick={()=>openEdit(o)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if(!o){ setEditing(null);} }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Order' : 'New Order'}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto space-y-6 pr-1 py-2">
            {!editing && (
              <form onSubmit={onCreateOrder} className="space-y-5">
                {/* Group Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Group</label>
                  {!selectedGroup && (
                    <div className="relative" onKeyDown={e=>{
                      if (groupSearchResults.length === 0) return;
                      if (e.key === 'ArrowDown') { e.preventDefault(); setGroupHighlight(h => Math.min(groupSearchResults.length-1, h+1)); }
                      else if (e.key === 'ArrowUp') { e.preventDefault(); setGroupHighlight(h => Math.max(0, h-1)); }
                      else if (e.key === 'Enter') { const g = groupSearchResults[groupHighlight]; if (g){ setSelectedGroup(g); setDraftGroupId(g.id); setDraftMemberUserId(''); setMemberSearch(''); } }
                      else if (e.key === 'Escape') { setGroupSearch(''); setGroupSearchResults([]); }
                    }}>
                      <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input autoFocus placeholder="Type to search groups..." className="pl-8" value={groupSearch} onChange={e=> setGroupSearch(e.target.value)} />
                      {groupSearch.trim().length >= 2 && (
                        <div className="absolute z-20 mt-1 left-0 right-0 max-h-64 overflow-y-auto border rounded bg-popover shadow-sm">
                          {groupSearchResults.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No matches</div>}
                          {groupSearchResults.map((g,i) => (
                            <button type="button" key={g.id} onClick={()=>{ setSelectedGroup(g); setDraftGroupId(g.id); setDraftMemberUserId(''); setMemberSearch(''); }} className={`w-full text-left px-3 py-2 flex items-center justify-between ${i===groupHighlight? 'bg-accent' : 'hover:bg-accent/60'}`}>
                              <span className="text-sm">{g.name}</span>
                              <span className="text-[10px] text-muted-foreground">{g.users.length} members</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedGroup && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 text-xs rounded bg-accent/60 font-medium">{selectedGroup.name}</span>
                      <Button type="button" size="sm" variant="outline" onClick={()=>{ setSelectedGroup(null); setDraftGroupId(''); setDraftMemberUserId(''); }}>Change</Button>
                    </div>
                  )}
                </div>

                {/* Host Selection */}
                {selectedGroup && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Dinner Host (Group Member)</label>
                    {!draftMemberUserId && (
                      <div className="relative" onKeyDown={e=>{
                        const list = selectedGroup.users.filter(u=> (memberSearch.trim()==='' || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))).slice(0,40);
                        if (list.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setMemberHighlight(h => Math.min(list.length-1, h+1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setMemberHighlight(h => Math.max(0, h-1)); }
                        else if (e.key === 'Enter') { const u = list[memberHighlight]; if (u){ setDraftMemberUserId(u.id); } }
                        else if (e.key === 'Escape') { setMemberSearch(''); setMemberHighlight(0); }
                      }}>
                        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search member..." className="pl-8" value={memberSearch} onChange={e=> { setMemberSearch(e.target.value); setMemberHighlight(0); }} />
                        <div className="absolute z-20 mt-1 left-0 right-0 max-h-60 overflow-y-auto border rounded bg-popover shadow-sm">
                          {selectedGroup.users.filter(u=> (memberSearch.trim()==='' || u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u.email.toLowerCase().includes(memberSearch.toLowerCase()))).slice(0,40).map((u,i) => (
                            <button type="button" key={u.id} onClick={()=>{ setDraftMemberUserId(u.id); }} className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${i===memberHighlight? 'bg-accent' : 'hover:bg-accent/60'}`}>
                              <span className="text-sm">{u.name}</span>
                              <span className="text-[10px] text-muted-foreground">{u.email}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {draftMemberUserId && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 text-xs rounded bg-accent/60 font-medium">{selectedGroup.users.find(u=>u.id===draftMemberUserId)?.name}</span>
                        <Button type="button" size="sm" variant="outline" onClick={()=> setDraftMemberUserId('')}>Change</Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Restaurant & Address */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Restaurant</label>
                    {!draftRestaurantId && (
                      <div className="relative" onKeyDown={e=>{
                        const filtered = restaurants.filter(r=> restaurantSearch.trim()==='' || r.name.toLowerCase().includes(restaurantSearch.toLowerCase()));
                        if (filtered.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setRestaurantHighlight(h=> Math.min(filtered.length-1, h+1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setRestaurantHighlight(h=> Math.max(0, h-1)); }
                        else if (e.key === 'Enter') { const r = filtered[restaurantHighlight]; if (r) { setDraftRestaurantId(r.id); } }
                        else if (e.key === 'Escape') { setRestaurantSearch(''); setRestaurantHighlight(0); }
                      }}>
                        <IconSearch className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search restaurant..." className="pl-8" value={restaurantSearch} onChange={e=> { setRestaurantSearch(e.target.value); setRestaurantHighlight(0); }} />
                        <div className="absolute z-10 mt-1 left-0 right-0 max-h-60 overflow-y-auto border rounded bg-popover shadow-sm">
                          {restaurants.filter(r=> restaurantSearch.trim()==='' || r.name.toLowerCase().includes(restaurantSearch.toLowerCase())).slice(0,40).map((r,i)=>(
                            <button type="button" key={r.id} onClick={()=> setDraftRestaurantId(r.id)} className={`w-full text-left px-3 py-1.5 flex items-center justify-between ${i===restaurantHighlight? 'bg-accent' : 'hover:bg-accent/60'}`}>
                              <span className="text-sm">{r.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {draftRestaurantId && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 text-xs rounded bg-accent/60 font-medium">{restaurants.find(r=>r.id===draftRestaurantId)?.name}</span>
                        <Button type="button" size="sm" variant="outline" onClick={()=> setDraftRestaurantId('')}>Change</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Address</label>
                    <Input value={draftAddress} onChange={e=>setDraftAddress(e.target.value)} placeholder="Street & No" />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Postal</label>
                    <Input value={draftPostal} onChange={e=>setDraftPostal(e.target.value)} placeholder="Postal" />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">City</label>
                    <Input value={draftCity} onChange={e=>setDraftCity(e.target.value)} placeholder="City" />
                  </div>
                </div>

                <Button type="submit" disabled={creating || !draftGroupId || !draftMemberUserId || !draftRestaurantId || !draftAddress || !draftPostal || !draftCity} className="w-full">{creating ? 'Creating...' : 'Create Order'}</Button>
              </form>
            )}

            {editing && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Group</div>
                    <div>{editing.group?.name || editing.groupId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Restaurant</div>
                    <div>{editing.restaurantId}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">Status</div>
                    <Badge variant={editing.isFinalized ? 'default':'outline'}>{editing.status}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between"><h4 className="font-medium">Items ({items.length})</h4></div>
                  {/* Group items by addedBy (host or member) when available */}
      <div className="space-y-4">
                    {(() => {
                      const groupsMap = new Map<string, OrderItem[]>();
                      items.forEach(it => {
                        const key = (it as any).addedByUserId || 'unknown';
                        if (!groupsMap.has(key)) groupsMap.set(key, []);
                        groupsMap.get(key)!.push(it);
                      });
                      return Array.from(groupsMap.entries()).map(([userId, list]) => {
                        const user = (editing as any)?.group?.users?.find((u:any) => u.id === userId);
        const userSubtotal = list.reduce((acc, it)=> acc + parseFloat(it.price)*it.quantity, 0);
        return (
                          <div key={userId} className="border rounded">
                            <div className="px-3 py-1.5 text-xs font-medium bg-muted/50 flex items-center justify-between">
          <span>{user ? user.name : 'Member'} ({list.length})</span>
          <span className="text-[10px] font-normal text-muted-foreground">€{userSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="divide-y">
                              {list.map(it => (
                                <div key={it.id} className="flex items-center gap-3 p-2 text-sm">
                                  <div className="flex-1">
                                    <div className="font-medium">{menuItems.find(m=>m.id===it.menuItemId)?.name || it.menuItemId}</div>
                                    {it.comment && <div className="text-xs text-muted-foreground">{it.comment}</div>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs font-mono min-w-[56px] text-right">{parseFloat(it.price).toFixed(2)}</div>
                                    <div className="flex items-center gap-1">
                                      <Button size="sm" variant="outline" disabled={editing.isFinalized} onClick={()=>updateQuantity(it.id,-1)}>-</Button>
                                      <div className="w-6 text-center text-xs">{it.quantity}</div>
                                      <Button size="sm" variant="outline" disabled={editing.isFinalized} onClick={()=>updateQuantity(it.id,1)}>+</Button>
                                    </div>
                                    <Button size="sm" variant="ghost" disabled={editing.isFinalized} onClick={()=>removeItem(it.id)}><IconX className="size-4" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      });
                    })()}
                    {!items.length && <div className="p-4 text-xs text-muted-foreground border rounded">No items</div>}
                  </div>
                  {!editing.isFinalized && (
                    <div className="grid gap-2 md:grid-cols-6 items-end p-3 border rounded bg-muted/30">
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium">Menu Item</label>
                        <select className="border rounded px-2 py-1 w-full text-sm" value={draftMenuItemId} onChange={e=>setDraftMenuItemId(e.target.value)}>
                          <option value="">Select</option>
                          {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name} (€{parseFloat(mi.price).toFixed(2)})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium">Qty</label>
                        <Input type="number" min={1} value={draftQty} onChange={e=>setDraftQty(parseInt(e.target.value)||1)} />
                      </div>
                      <div>
                        <label className="text-xs font-medium">Member</label>
                        <select className="border rounded px-2 py-1 w-full text-sm" value={draftItemUserId} onChange={e=>setDraftItemUserId(e.target.value)}>
                          <option value="">Select</option>
                          {editing.group?.users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium">Comment</label>
                        <Input value={draftComment} onChange={e=>setDraftComment(e.target.value)} placeholder="(optional)" />
                      </div>
                      <Button type="button" disabled={addingItem || !draftMenuItemId || !draftItemUserId} onClick={addItem} className="md:col-span-6">{addingItem ? 'Adding...' : 'Add Item'}</Button>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-sm border rounded p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-1"><h4 className="font-medium text-xs tracking-wide uppercase text-muted-foreground">Breakdown</h4><span className="text-[10px] text-muted-foreground">Auto-updated</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Items Subtotal</span><span>€{parseFloat(editing.subtotal||'0').toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>€{parseFloat(editing.taxAmount||'0').toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span>€{parseFloat(editing.serviceFee||'0').toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>€{parseFloat(editing.deliveryFee||'0').toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><span>€{parseFloat(editing.tipAmount||'0').toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Discounts</span><span>-€{parseFloat(editing.discountTotal||'0').toFixed(2)}</span></div>
                  <div className="border-t mt-1 pt-1 flex justify-between font-medium"><span>Total</span><span>€{parseFloat(editing.grandTotal||'0').toFixed(2)}</span></div>
                </div>

                {!editing.isFinalized && <div className="flex gap-2"><Button onClick={finalize} className="flex-1" variant="outline">Finalize Order</Button></div>}
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
