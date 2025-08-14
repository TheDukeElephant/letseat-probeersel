"use client";
import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '@/components/ui/badge';
import { IconPlus, IconTrash, IconEdit, IconChevronDown, IconChevronRight, IconStar, IconStarOff } from '@tabler/icons-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Internal light duplicate of gql helper (could be extracted later)
const API = (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000') + '/graphql';
async function gql<T=any>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query, variables }), cache: 'no-store' });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

interface MenuItem { id: string; categoryId: string; name: string; description?: string; price: number; imageUrl?: string; isEnabled: boolean; stock?: number; allergyTags?: string[]; sortOrder?: number; }
interface MenuCategory { id: string; menuId: string; name: string; sortOrder: number; items?: MenuItem[]; }
interface Menu { id: string; restaurantId: string; name: string; description?: string; isActive: boolean; categories?: MenuCategory[]; }

interface Props { restaurantId: string; restaurantName: string; open: boolean; onOpenChange(o:boolean): void; }

export function RestaurantMenusManager({ restaurantId, restaurantName, open, onOpenChange }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [menus, setMenus] = React.useState<Menu[]>([]);
  const [selectedMenuId, setSelectedMenuId] = React.useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});
  const [busy, setBusy] = React.useState(false);
  // Track unsaved item field changes (enable/state/order) & staged CRUD
  const [pendingItemChanges, setPendingItemChanges] = React.useState<Record<string, { isEnabled?: boolean; sortOrder?: number }>>({});
  const [pendingCreatedItems, setPendingCreatedItems] = React.useState<Record<string, MenuItem & { __temp: true }>>({}); // temp id -> item
  const [pendingDeletedItemIds, setPendingDeletedItemIds] = React.useState<Set<string>>(new Set());
  const hasPendingItemChanges = React.useMemo(()=>{
    return Object.keys(pendingItemChanges).length>0 || Object.keys(pendingCreatedItems).length>0 || pendingDeletedItemIds.size>0;
  }, [pendingItemChanges, pendingCreatedItems, pendingDeletedItemIds]);
  // Pending menu-level changes (e.g., activation toggles) requiring explicit save
  const [pendingMenuChanges, setPendingMenuChanges] = React.useState<Record<string, { isActive: boolean }>>({});
  const [pendingDeletedMenuIds, setPendingDeletedMenuIds] = React.useState<Set<string>>(new Set());
  const hasPendingMenuChanges = React.useMemo(()=> Object.keys(pendingMenuChanges).length > 0 || pendingDeletedMenuIds.size>0, [pendingMenuChanges, pendingDeletedMenuIds]);
  const hasAnyPending = hasPendingMenuChanges || hasPendingItemChanges;
  const [savingAll, setSavingAll] = React.useState(false);

  // New / edit states
  const [menuForm, setMenuForm] = React.useState<{ id?: string; name: string; description: string; isActive: boolean }>({ name:'', description:'', isActive:true });
  const [menuOriginal, setMenuOriginal] = React.useState<{ id?: string; name: string; description: string; isActive: boolean } | null>(null);
  const [categoryForm, setCategoryForm] = React.useState<{ id?: string; name: string }>({ name:'' });
  const [itemForm, setItemForm] = React.useState<{ id?: string; categoryId?: string; name: string; description: string; price: string; isEnabled: boolean; stock: string; allergyTags: string[] }>({ name:'', description:'', price:'', isEnabled:true, stock:'', allergyTags:[] });
  const ALLERGY_TAG_OPTIONS = React.useMemo(()=>['Vega','Vegan','Glutenvrij','Lactosevrij','Halal'], []);
  const [mode, setMode] = React.useState<'menu'|'category'|'item'|null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function loadMenus() {
    setLoading(true);
    try {
  const data = await gql<{ menusByRestaurant: Menu[] }>(`query($id:ID!){ menusByRestaurant(restaurantId:$id){ id restaurantId name description isActive categories { id menuId name sortOrder items { id categoryId name description price imageUrl isEnabled stock sortOrder allergyTags } } } }`, { id: restaurantId });
      setMenus(data.menusByRestaurant);
      // Reset selection if needed
      if (selectedMenuId && !data.menusByRestaurant.find(m=>m.id===selectedMenuId)) setSelectedMenuId(null);
    } catch(e){ toast.error((e as Error).message); } finally { setLoading(false); }
  }
  React.useEffect(()=>{ if(open) loadMenus(); }, [open, restaurantId]);

  function openCreateMenu() { setMode('menu'); const snap = { name:'', description:'', isActive:true }; setMenuForm(snap); setMenuOriginal(snap); }
  function openEditMenu(m: Menu) { setMode('menu'); const snap = { id: m.id, name: m.name, description: m.description||'', isActive: m.isActive }; setMenuForm(snap); setMenuOriginal(snap); }

  function stageToggleMenuActive(m: Menu) {
    setMenus(curr => {
      // Enforce single active menu rule locally: if activating one, deactivate others.
      const activating = !m.isActive;
      if (activating) {
        const updated = curr.map(menu => {
          if (menu.id === m.id) return { ...menu, isActive: true };
          if (menu.isActive) {
            // record deactivation if previously active
            setPendingMenuChanges(ch => ({ ...ch, [menu.id]: { isActive: false } }));
            return { ...menu, isActive: false };
          }
          return menu;
        });
        setPendingMenuChanges(ch => ({ ...ch, [m.id]: { isActive: true } }));
        return updated;
      } else {
        // Deactivating current menu: ensure at least one remains active or warn and cancel
        const otherActive = curr.some(menu => menu.id !== m.id && menu.isActive);
        if (!otherActive) { toast.error('At least one active menu is required. Activate another first.'); return curr; }
        setPendingMenuChanges(ch => ({ ...ch, [m.id]: { isActive: false } }));
        return curr.map(menu => menu.id === m.id ? { ...menu, isActive: false } : menu);
      }
    });
  }

  async function savePendingMenuChanges() {
    /* legacy single-purpose save retained for potential future granular use (currently unused) */
  }

  const isMenuDirty = React.useMemo(()=>{
    if(!menuOriginal) return !!menuForm.name || !!menuForm.description;
    return menuForm.name !== menuOriginal.name || menuForm.description !== menuOriginal.description || menuForm.isActive !== menuOriginal.isActive;
  }, [menuForm, menuOriginal]);

  async function saveMenu(e: React.FormEvent) {
    e.preventDefault(); if(!menuForm.name.trim()) { toast.error('Menu name required'); return; }
    setBusy(true);
    try {
      if (menuForm.id) {
        await gql(`mutation($data:UpdateMenuInput!){ updateMenu(data:$data){ id } }`, { data: { id: menuForm.id, restaurantId, name: menuForm.name.trim(), description: menuForm.description.trim()||null, isActive: menuForm.isActive } });
        toast.success('Menu updated');
      } else {
        await gql(`mutation($data:CreateMenuInput!){ createMenu(data:$data){ id } }`, { data: { restaurantId, name: menuForm.name.trim(), description: menuForm.description.trim()||null } });
        toast.success('Menu created');
      }
      setMode(null); setMenuOriginal(null); await loadMenus();
    } catch(e){ toast.error((e as Error).message); } finally { setBusy(false); }
  }
  function stageDeleteMenu(id: string) {
    const willDelete = !pendingDeletedMenuIds.has(id);
    if (willDelete) {
      if(!confirm('Delete this menu? It will be removed after you press Save Changes.')) return;
      setPendingDeletedMenuIds(prev => new Set([...Array.from(prev), id]));
      if(selectedMenuId===id) setSelectedMenuId(null);
      // Remove any activation changes (not needed) & item pending changes for this menu
      setPendingMenuChanges(ch => { const cp = { ...ch }; delete cp[id]; return cp; });
      // Remove pending item changes related to this menu
      setPendingItemChanges(ch => {
        const next: typeof ch = {} as any;
        const menu = menus.find(m=>m.id===id);
        const itemIds = new Set(menu?.categories?.flatMap(c=>c.items?.map(i=>i.id)||[])||[]);
        for (const [iid, val] of Object.entries(ch)) if(!itemIds.has(iid)) next[iid]=val; return next;
      });
    } else {
      // Undo deletion staging
      setPendingDeletedMenuIds(prev => { const s = new Set(Array.from(prev)); s.delete(id); return s; });
    }
  }

  function openCreateCategory() { setMode('category'); setCategoryForm({ name:'' }); }
  function openEditCategory(c: MenuCategory) { setMode('category'); setCategoryForm({ id: c.id, name: c.name }); }
  // For now categories still persist immediately (could be staged similarly). Keeping as-is to limit scope.
  async function saveCategory(e:React.FormEvent) { e.preventDefault(); if(!categoryForm.name.trim() || !selectedMenuId){ toast.error('Category name required'); return; } setBusy(true); try { if(categoryForm.id){ await gql(`mutation($data:UpdateMenuCategoryInput!){ updateMenuCategory(data:$data){ id } }`, { data: { id: categoryForm.id, menuId: selectedMenuId, name: categoryForm.name.trim() } }); toast.success('Category updated'); } else { await gql(`mutation($data:CreateMenuCategoryInput!){ createMenuCategory(data:$data){ id } }`, { data: { menuId: selectedMenuId, name: categoryForm.name.trim() } }); toast.success('Category created'); } setMode(null); await loadMenus(); } catch(e){ toast.error((e as Error).message);} finally { setBusy(false);} }
  async function deleteCategory(id:string){ if(!confirm('Delete category and its items?')) return; setBusy(true); try { await gql(`mutation($id:ID!){ deleteMenuCategory(id:$id) }`, { id }); toast.success('Category deleted'); await loadMenus(); } catch(e){ toast.error((e as Error).message);} finally { setBusy(false);} }

  function openCreateItem(categoryId: string) { setMode('item'); setItemForm({ categoryId, name:'', description:'', price:'', isEnabled:true, stock:'', allergyTags:[] }); }
  function openEditItem(i: MenuItem) { setMode('item'); setItemForm({ id: i.id, categoryId: i.categoryId, name: i.name, description: i.description||'', price: String(i.price), isEnabled: i.isEnabled, stock: i.stock!=null? String(i.stock):'', allergyTags: (i as any).allergyTags || [] }); }
  async function saveItem(e:React.FormEvent) { e.preventDefault(); if(!itemForm.name.trim() || !itemForm.categoryId){ toast.error('Item name & category required'); return; } const priceNum = Number(itemForm.price); if(isNaN(priceNum) || priceNum < 0){ toast.error('Valid price required'); return; } const stockNum = itemForm.stock.trim()? Number(itemForm.stock): null; if(stockNum!=null && (isNaN(stockNum) || stockNum < 0)){ toast.error('Invalid stock'); return; } const allergyTagsArr = itemForm.allergyTags.filter(Boolean);
    // Stage create or update locally (for update, still immediate for simplicity)
    if (!itemForm.id) {
      const tempId = 'temp_'+Math.random().toString(36).slice(2);
      setPendingCreatedItems(items => ({ ...items, [tempId]: { id: tempId, __temp: true, categoryId: itemForm.categoryId!, name: itemForm.name.trim(), description: itemForm.description.trim()||'', price: priceNum, imageUrl: undefined, isEnabled: true, stock: stockNum || undefined, allergyTags: allergyTagsArr, sortOrder: Object.keys(items).length } as any }));
      // Insert into local menus tree
      setMenus(ms => ms.map(m => ({ ...m, categories: m.categories?.map(c => {
        if (c.id !== itemForm.categoryId) return c;
        const newItems = [...(c.items||[]), { id: tempId, categoryId: c.id, name: itemForm.name.trim(), description: itemForm.description.trim()||'', price: priceNum, imageUrl: undefined, isEnabled: true, stock: stockNum||undefined, allergyTags: allergyTagsArr, sortOrder: (c.items?.length||0) }];
        return { ...c, items: newItems };
      }) })));
      toast.success('Item staged (remember to Save Changes)');
      setMode(null);
    } else {
      // For existing items keep previous immediate save behavior to limit scope
      setBusy(true);
      try {
        await gql(`mutation($data:UpdateMenuItemInput!){ updateMenuItem(data:$data){ id } }`, { data: { id: itemForm.id, categoryId: itemForm.categoryId, name: itemForm.name.trim(), description: itemForm.description.trim()||null, price: priceNum, stock: stockNum, isEnabled: itemForm.isEnabled, allergyTags: allergyTagsArr } });
        toast.success('Item updated');
        await loadMenus();
      } catch(e){ toast.error((e as Error).message);} finally { setBusy(false); }
      setMode(null);
    }
  }

  function toggleAllergyTag(tag: string) {
    setItemForm(f => {
      const has = f.allergyTags.includes(tag);
      return { ...f, allergyTags: has ? f.allergyTags.filter(t=>t!==tag) : [...f.allergyTags, tag] };
    });
  }
  async function deleteItem(id:string){ if(!confirm('Delete item?')) return; 
    // If it's a temp (not saved yet) just remove from staging
    if (pendingCreatedItems[id]) {
      setPendingCreatedItems(items => { const cp = { ...items }; delete cp[id]; return cp; });
      setMenus(ms => ms.map(m => ({ ...m, categories: m.categories?.map(c => ({ ...c, items: c.items?.filter(i=>i.id!==id) })) })));
      toast.success('Staged item removed');
      return;
    }
    // Otherwise stage deletion
    setPendingDeletedItemIds(ids => new Set([...Array.from(ids), id]));
    setMenus(ms => ms.map(m => ({ ...m, categories: m.categories?.map(c => ({ ...c, items: c.items?.filter(i=>i.id!==id) })) })));
    toast.success('Item deletion staged (remember to Save Changes)');
  }

  function toggleItemEnabled(item: MenuItem) {
    setPendingItemChanges(ch => {
      const current = ch[item.id];
      const baseEnabled = current ? current.isEnabled : item.isEnabled;
      const nextEnabled = !baseEnabled;
      const next = { ...ch, [item.id]: { isEnabled: nextEnabled } };
      // If it matches original state, remove entry (no change)
      if (nextEnabled === item.isEnabled) { delete next[item.id]; }
      return { ...next };
    });
  }

  function SortableItemWrapper({ item, children }: { item: { id: string }, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>;
  }

  function onDragEndCategoryItems(event: any, category: MenuCategory) {
    const { active, over } = event; if (!over || active.id === over.id) return;
    setMenus(ms => ms.map(m => ({ ...m, categories: m.categories?.map(c => {
      if (c.id !== category.id) return c;
      const oldIndex = c.items?.findIndex(i=>i.id===active.id) ?? -1;
      const newIndex = c.items?.findIndex(i=>i.id===over.id) ?? -1;
      if (oldIndex < 0 || newIndex < 0) return c;
      const newItems = arrayMove(c.items!, oldIndex, newIndex).map((it, idx) => ({ ...it, sortOrder: idx }));
      newItems.forEach((it) => setPendingItemChanges(ch => {
        const original = (category.items || []).find(orig=>orig.id===it.id);
        const baseSort = original?.sortOrder;
        const baseEnabled = original?.isEnabled ?? it.isEnabled;
        const existing = ch[it.id] || { isEnabled: baseEnabled };
        const nextEntry: any = { ...existing, sortOrder: it.sortOrder };
        const changed = (nextEntry.sortOrder !== baseSort) || (nextEntry.isEnabled !== baseEnabled);
        const next = { ...ch } as any;
        if (changed) next[it.id] = nextEntry; else delete next[it.id];
        return next;
      }));
      return { ...c, items: newItems };
  }) })));
  }

  async function savePendingItemChanges() {
    /* legacy single-purpose save retained for potential future granular use (currently unused) */
  }

  async function saveAllChanges() {
    if (!hasAnyPending || savingAll) return;
    setSavingAll(true);
    try {
      // Apply menu activation changes first
      const deletingMenus = pendingDeletedMenuIds;
      if (Object.keys(pendingMenuChanges).length) {
        for (const [id, changes] of Object.entries(pendingMenuChanges)) {
          if (deletingMenus.has(id)) continue; // skip menus slated for deletion
          const menu = menus.find(m=>m.id===id);
          if (!menu) continue;
          await gql(`mutation($data:UpdateMenuInput!){ updateMenu(data:$data){ id } }`, { data: { id, restaurantId: menu.restaurantId, name: menu.name, description: menu.description, isActive: changes.isActive } });
        }
      }
      // Apply item visibility / ordering changes
      if (hasPendingItemChanges) {
        // Apply batch updates (enable/order) for existing items only
        const menusBeingDeleted = new Set(Array.from(pendingDeletedMenuIds));
        const updateEntries = Object.entries(pendingItemChanges).filter(([id]) => !pendingCreatedItems[id] && !pendingDeletedItemIds.has(id)).filter(([id]) => {
          // ensure item's menu not being deleted
          for (const m of menus) {
            if (menusBeingDeleted.has(m.id)) continue;
            if (m.categories?.some(c=>c.items?.some(i=>i.id===id))) return true;
          }
          return false;
        }).map(([id, changes]) => ({ id, ...changes }));
        if (updateEntries.length) {
          await gql(`mutation($data:BatchUpdateMenuItemsInput!){ batchUpdateMenuItems(data:$data) }`, { data: { items: updateEntries } });
        }
        // Create new items
        for (const temp of Object.values(pendingCreatedItems)) {
          // Skip if its menu/category slated for deletion
          const parentMenu = menus.find(m=>m.categories?.some(c=>c.id===temp.categoryId));
            if (parentMenu && menusBeingDeleted.has(parentMenu.id)) continue;
            await gql(`mutation($data:CreateMenuItemInput!){ createMenuItem(data:$data){ id } }`, { data: { categoryId: temp.categoryId, name: temp.name, description: temp.description || null, price: temp.price, stock: temp.stock ?? null, allergyTags: temp.allergyTags || [] } });
        }
        // Delete staged deletions
        for (const delId of Array.from(pendingDeletedItemIds)) {
          await gql(`mutation($id:ID!){ deleteMenuItem(id:$id) }`, { id: delId });
        }
      }
      // Finally delete menus
      if (pendingDeletedMenuIds.size) {
        for (const menuId of Array.from(pendingDeletedMenuIds)) {
          await gql(`mutation($id:ID!){ deleteMenu(id:$id) }`, { id: menuId });
        }
      }
      toast.success('Changes saved');
      setPendingMenuChanges({});
      setPendingItemChanges({});
      setPendingCreatedItems({});
      setPendingDeletedItemIds(new Set());
      setPendingDeletedMenuIds(new Set());
      await loadMenus();
    } catch(e){ toast.error((e as Error).message); } finally { setSavingAll(false); }
  }

  function currentMenu(): Menu | undefined { return menus.find(m=>m.id===selectedMenuId); }

  function CategoryBlock({ c }: { c: MenuCategory }) {
    const expanded = expandedCategories[c.id];
    return (
      <div className="border rounded-md p-3 space-y-2 bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="flex items-center gap-2" onClick={()=>setExpandedCategories(s=>({ ...s, [c.id]: !expanded }))}>
            {expanded ? <IconChevronDown className="size-4"/> : <IconChevronRight className="size-4"/>}
            <span className="font-medium">{c.name}</span>
            <Badge variant="outline" className="text-[10px]">{c.items?.length||0} items</Badge>
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={()=>openEditCategory(c)}><IconEdit className="size-3"/></Button>
            <Button size="sm" variant="destructive" onClick={()=>deleteCategory(c.id)}><IconTrash className="size-3"/></Button>
            <Button size="sm" onClick={()=>openCreateItem(c.id)} className="gap-1"><IconPlus className="size-3"/>Item</Button>
          </div>
        </div>
        {expanded && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e)=>onDragEndCategoryItems(e, c)}>
            <SortableContext items={c.items?.map(i=>({id:i.id})) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 pl-6">
                {c.items && c.items.map(i => {
          const pending = pendingItemChanges[i.id] || pendingItemChanges[i.id];
          const effectiveEnabled = (pending && pending.isEnabled !== undefined ? pending.isEnabled : i.isEnabled);
          const isTemp = !!(pendingCreatedItems as any)[i.id];
          const isDeleted = pendingDeletedItemIds.has(i.id);
                  return (
                    <SortableItemWrapper key={i.id} item={{ id: i.id }}>
            <div className={`flex items-start justify-between gap-4 border rounded-md px-3 py-2 bg-background ${pending || isTemp || isDeleted ? 'ring-2 ring-amber-400/60' : ''} ${isDeleted? 'opacity-50 line-through':''}`}>
                        <div className="flex-1 min-w-0 cursor-grab">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{i.name}</span>
                            {!effectiveEnabled && <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300">Disabled</Badge>}
              {(pending || isTemp || isDeleted) && <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-300">{isTemp? 'New': isDeleted? 'Deleted':'Unsaved'}</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{i.description || '—'}</div>
                          {(i as any).allergyTags?.length ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(i as any).allergyTags.map((t: string) => <Badge key={t} variant="outline" className="text-[10px] uppercase tracking-wide">{t}</Badge>)}
                            </div>
                          ) : <div className="mt-1 text-[10px] text-muted-foreground">No allergy tags</div>}
                          <div className="text-xs mt-1 font-mono">€{Number(i.price).toFixed(2)} {i.stock!=null && <span className="ml-2 text-muted-foreground">Stock: {i.stock}</span>}</div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="flex gap-1">
                            {!isDeleted && (
                            <Button size="sm" variant={effectiveEnabled? 'outline':'secondary'} disabled={savingAll || isTemp} onClick={()=>toggleItemEnabled(i)}>
                              {effectiveEnabled ? 'Deactivate' : 'Activate'}
                            </Button>
                            )}
                            {!isDeleted && <Button size="sm" variant="outline" disabled={savingAll || isTemp} onClick={()=>openEditItem(i)}><IconEdit className="size-3"/></Button>}
                            <Button size="sm" variant="destructive" disabled={savingAll} onClick={()=>deleteItem(i.id)}>{isDeleted? 'Undo':'Delete'}</Button>
                          </div>
                          <div className="text-[10px] text-muted-foreground">Order: {(i.sortOrder ?? 0) + 1}</div>
                        </div>
                      </div>
                    </SortableItemWrapper>
                  );
                })}
                {(!c.items || !c.items.length) && <div className="text-xs text-muted-foreground">No items</div>}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  function renderForm() {
    if(mode==='menu') {
      return (
        <form onSubmit={saveMenu} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Name *</label>
            <Input value={menuForm.name} onChange={e=>setMenuForm(f=>({...f, name:e.target.value}))} placeholder="Menu name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={menuForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setMenuForm(f=>({...f, description:e.target.value}))} placeholder="Optional description" rows={3} />
          </div>
          {menuForm.id && (
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="scale-110" checked={menuForm.isActive} onChange={e=>setMenuForm(f=>({...f, isActive:e.target.checked}))} /> Active
            </label>
          )}
          <div className="text-[10px] text-muted-foreground">
            {isMenuDirty ? <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span> : 'No changes yet'}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || !isMenuDirty}>{busy? 'Saving...': menuForm.id? 'Save Changes':'Create Menu'}</Button>
            <Button type="button" variant="outline" onClick={()=>{ if(isMenuDirty && !confirm('Discard unsaved changes?')) return; setMode(null); setMenuOriginal(null); }}>Cancel</Button>
          </div>
        </form>
      );
    }
  if(mode==='category') {
      return (
        <form onSubmit={saveCategory} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Category Name *</label>
            <Input value={categoryForm.name} onChange={e=>setCategoryForm(f=>({...f, name:e.target.value}))} placeholder="Category name" />
          </div>
          <div className="flex gap-2">
      <Button type="submit" disabled={busy}>{busy? 'Saving...': categoryForm.id? 'Save Changes':'Create Category'}</Button>
            <Button type="button" variant="outline" onClick={()=>setMode(null)}>Cancel</Button>
          </div>
        </form>
      );
    }
    if(mode==='item') {
      return (
        <form onSubmit={saveItem} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Item Name *</label>
              <Input value={itemForm.name} onChange={e=>setItemForm(f=>({...f, name:e.target.value}))} placeholder="Item name" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={itemForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setItemForm(f=>({...f, description:e.target.value}))} placeholder="Item description" rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Price (€)*</label>
              <Input value={itemForm.price} onChange={e=>setItemForm(f=>({...f, price:e.target.value}))} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Stock</label>
              <Input value={itemForm.stock} onChange={e=>setItemForm(f=>({...f, stock:e.target.value}))} placeholder="(optional)" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Allergy Tags</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGY_TAG_OPTIONS.map(tag => {
                  const active = itemForm.allergyTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={()=>toggleAllergyTag(tag)}
                      className={`px-2 py-1 rounded-md text-xs font-medium border transition ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/70 border-border text-foreground'} `}
                    >{tag}</button>
                  );
                })}
              </div>
              {!itemForm.allergyTags.length && <div className="text-[10px] text-muted-foreground mt-1">No tags selected</div>}
            </div>
            {itemForm.id && (
              <div className="col-span-2">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="scale-110" checked={itemForm.isEnabled} onChange={e=>setItemForm(f=>({...f, isEnabled:e.target.checked}))} /> Enabled</label>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>{busy? 'Saving...': itemForm.id? 'Save Changes':'Create Item'}</Button>
            <Button type="button" variant="outline" onClick={()=>setMode(null)}>Cancel</Button>
          </div>
        </form>
      );
    }
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Menus for {restaurantName}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Menus</h3>
              <div className="flex gap-2 items-center">
                <Button size="sm" className="gap-1" onClick={openCreateMenu}><IconPlus className="size-3"/>New</Button>
              </div>
            </div>
            <div className="space-y-2">
              {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
              {!loading && menus.map(m => {
                const deleting = pendingDeletedMenuIds.has(m.id);
                return (
                <div key={m.id} className={`border rounded-md px-3 py-2 flex flex-col gap-1 cursor-pointer ${selectedMenuId===m.id? 'bg-primary/5 border-primary':'bg-muted/30 hover:bg-muted/50'} ${m.isActive? 'shadow-[0_0_0_1px_rgba(16,185,129,0.4)]':'opacity-90'} ${(pendingMenuChanges[m.id]||deleting)? 'ring-2 ring-amber-400/60':''} ${deleting? 'opacity-60 line-through':''}`} onClick={()=>{ if(deleting) return; setSelectedMenuId(m.id); }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate text-sm">{m.name}</span>
                    <div className="flex gap-1">
                      {!deleting && (
                      <Button size="icon" variant={m.isActive? 'secondary':'outline'} className={`h-6 w-6 ${m.isActive? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300':''}`} title={m.isActive? 'Stage deactivation':'Stage activation'} onClick={(e)=>{e.stopPropagation(); stageToggleMenuActive(m);}}>
                        {m.isActive? <IconStar className="size-3"/> : <IconStarOff className="size-3"/>}
                      </Button>
                      )}
                      {!deleting && <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e)=>{e.stopPropagation(); openEditMenu(m);}}><IconEdit className="size-3"/></Button>}
                      <Button size="icon" variant={deleting? 'secondary':'destructive'} className="h-6 w-6" title={deleting? 'Undo delete':'Stage delete'} onClick={(e)=>{e.stopPropagation(); stageDeleteMenu(m.id);}}><IconTrash className="size-3"/></Button>
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wide flex gap-2">
                    {deleting ? <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 h-4 px-1">Deleted</Badge> : (m.isActive ? <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 h-4 px-1">Active</Badge>: <Badge className="bg-red-500/20 text-red-700 dark:text-red-300 h-4 px-1">Inactive</Badge>)}
                    {m.categories?.length ? <span className="text-muted-foreground">{m.categories.length} cat.</span>: <span className="text-muted-foreground">No categories</span>}
                  </div>
                </div>
              );})}
              {!loading && !menus.length && <div className="text-xs text-muted-foreground">No menus yet (restaurant inactive until a populated active menu exists)</div>}
            </div>
          </div>
          <div className="md:col-span-2 space-y-6">
            {mode && (
              <div className="border rounded-md p-4 bg-muted/20">
                {renderForm()}
              </div>
            )}
            {!mode && selectedMenuId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Categories</h3>
                  <div className="flex gap-2 items-center">
                    <Button size="sm" onClick={openCreateCategory} className="gap-1"><IconPlus className="size-4"/>Category</Button>
                  </div>
                </div>
                {hasAnyPending && <div className="text-xs text-amber-600 dark:text-amber-400">You have unsaved changes. Use the Save Changes button above.</div>}
                <div className="space-y-4">
                  {currentMenu()?.categories?.map(c => <CategoryBlock key={c.id} c={c} />)}
                  {!currentMenu()?.categories?.length && <div className="text-sm text-muted-foreground">No categories yet</div>}
                </div>
              </div>
            )}
            {!mode && !selectedMenuId && (
              <div className="text-sm text-muted-foreground">Select a menu to manage its categories & items, or create a new one.</div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground mr-auto">
            {hasAnyPending && !savingAll && <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>}
            {savingAll && <span>Saving...</span>}
          </div>
          <div className="flex gap-2">
            <Button type="button" disabled={!hasAnyPending || savingAll} onClick={saveAllChanges}>{savingAll? 'Saving…':'Save Changes'}</Button>
            <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
