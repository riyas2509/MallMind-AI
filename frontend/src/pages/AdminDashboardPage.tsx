import { useState, useEffect, type FormEvent } from 'react';
import { api, HttpError } from '../api/client';
import type {
  DashboardStatsResponse,
  FloorOverviewResponse,
  ShopAdminResponse,
  ShopUpdateRequest,
  FacilityAdminResponse,
  RetailerUserResponse,
  RetailerOnboardRequest,
  InventoryAdjustmentResponse,
  InventoryAlertResponse,
  InventoryAdjustmentReason,
  AuditLogResponse,
  OrderResponse,
  OrderStatus,
  GraphValidationReport,
} from '../api/types';
import {
  Layers,
  Store,
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Plus,
  RefreshCw,
  Compass,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STRUCTURE' | 'RETAILERS' | 'INVENTORY' | 'ORDERS' | 'AUDIT'>('OVERVIEW');

  // Overview stats state
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);

  // Mall Structure state
  const [floors, setFloors] = useState<FloorOverviewResponse[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [shops, setShops] = useState<ShopAdminResponse[]>([]);
  const [facilities, setFacilities] = useState<FacilityAdminResponse[]>([]);
  const [shopSearch, setShopSearch] = useState('');
  const [editingShop, setEditingShop] = useState<ShopAdminResponse | null>(null);
  const [shopForm, setShopForm] = useState<ShopUpdateRequest>({});
  const [validationReport, setValidationReport] = useState<GraphValidationReport | null>(null);

  // Retailer state
  const [retailers, setRetailers] = useState<RetailerUserResponse[]>([]);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState<RetailerOnboardRequest>({
    email: '',
    fullName: '',
    password: '',
    shopId: undefined,
  });

  // Inventory state
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlertResponse[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryAdjustmentResponse[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryAlertResponse | null>(null);
  const [adjustNewStock, setAdjustNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<InventoryAdjustmentReason>('RESTOCK');
  const [adjustNotes, setAdjustNotes] = useState<string>('');

  // Orders state
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [delayedOnly, setDelayedOnly] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [orderInterventionStatus, setOrderInterventionStatus] = useState<OrderStatus>('COMPLETED');
  const [orderInterventionNotes, setOrderInterventionNotes] = useState('');

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Initial load
  useEffect(() => {
    loadOverview();
    loadStructure();
    loadRetailers();
    loadInventory();
    loadOrders();
    loadAudit();
  }, []);

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  // 1. Overview Load
  async function loadOverview() {
    try {
      const data = await api.get<DashboardStatsResponse>('/api/admin/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  // 2. Structure Load
  async function loadStructure() {
    try {
      const [flrs, shps, facs, graph] = await Promise.all([
        api.get<FloorOverviewResponse[]>('/api/admin/floors'),
        api.get<ShopAdminResponse[]>('/api/admin/shops'),
        api.get<FacilityAdminResponse[]>('/api/admin/facilities'),
        api.get<GraphValidationReport>('/api/navigation/validate-graph').catch(() => null),
      ]);
      setFloors(flrs);
      setShops(shps);
      setFacilities(facs);
      setValidationReport(graph);
    } catch (err) {
      console.error('Failed to load structure', err);
    }
  }

  // 3. Retailers Load
  async function loadRetailers() {
    try {
      const data = await api.get<RetailerUserResponse[]>('/api/admin/retailers');
      setRetailers(data);
    } catch (err) {
      console.error('Failed to load retailers', err);
    }
  }

  // 4. Inventory Load
  async function loadInventory() {
    try {
      const [alerts, history] = await Promise.all([
        api.get<InventoryAlertResponse[]>('/api/admin/inventory/alerts'),
        api.get<InventoryAdjustmentResponse[]>('/api/admin/inventory/history'),
      ]);
      setInventoryAlerts(alerts);
      setInventoryHistory(history);
    } catch (err) {
      console.error('Failed to load inventory', err);
    }
  }

  // 5. Orders Load
  async function loadOrders() {
    try {
      let q = '/api/admin/orders';
      const params = new URLSearchParams();
      if (orderStatusFilter) params.append('status', orderStatusFilter);
      if (delayedOnly) params.append('delayedOnly', 'true');
      if (params.toString()) q += `?${params.toString()}`;
      const data = await api.get<OrderResponse[]>(q);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  }

  // 6. Audit Load
  async function loadAudit() {
    try {
      let q = '/api/admin/audit-logs';
      if (auditActionFilter) q += `?actionType=${auditActionFilter}`;
      const data = await api.get<AuditLogResponse[]>(q);
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  }

  // Structure handlers
  async function handleToggleShopActive(shopId: number, currentActive: boolean) {
    setBusy(true);
    try {
      await api.patch(`/api/admin/shops/${shopId}/status?active=${!currentActive}`);
      flashSuccess(`Store status updated successfully.`);
      loadStructure();
      loadOverview();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Could not update store status.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveShop(e: FormEvent) {
    e.preventDefault();
    if (!editingShop) return;
    setBusy(true);
    try {
      await api.put(`/api/admin/shops/${editingShop.id}`, shopForm);
      flashSuccess(`Store '${editingShop.name}' updated.`);
      setEditingShop(null);
      loadStructure();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to update store.');
    } finally {
      setBusy(false);
    }
  }

  // Retailer handlers
  async function handleOnboardRetailer(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/api/admin/retailers', onboardForm);
      flashSuccess(`Retailer ${onboardForm.email} onboarded successfully.`);
      setShowOnboardModal(false);
      setOnboardForm({ email: '', fullName: '', password: '', shopId: undefined });
      loadRetailers();
      loadOverview();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to onboard retailer.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleRetailerEnabled(userId: number, currentEnabled: boolean) {
    setBusy(true);
    try {
      await api.patch(`/api/admin/retailers/${userId}/status?enabled=${!currentEnabled}`);
      flashSuccess(`Retailer account ${!currentEnabled ? 'activated' : 'suspended'}.`);
      loadRetailers();
      loadOverview();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to update retailer status.');
    } finally {
      setBusy(false);
    }
  }

  // Inventory handlers
  async function handleStockAdjustment(e: FormEvent) {
    e.preventDefault();
    if (!adjustingProduct) return;
    setBusy(true);
    try {
      await api.post('/api/admin/inventory/adjust', {
        productId: adjustingProduct.productId,
        newStock: Number(adjustNewStock),
        reason: adjustReason,
        notes: adjustNotes || undefined,
      });
      flashSuccess(`Inventory adjusted for ${adjustingProduct.productName}.`);
      setAdjustingProduct(null);
      loadInventory();
      loadOverview();
      loadAudit();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to adjust stock.');
    } finally {
      setBusy(false);
    }
  }

  // Order intervention handler
  async function handleOrderIntervention(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    setBusy(true);
    try {
      await api.patch(
        `/api/admin/orders/${selectedOrder.id}/status?status=${orderInterventionStatus}&notes=${encodeURIComponent(
          orderInterventionNotes,
        )}`,
      );
      flashSuccess(`Order #${selectedOrder.orderNumber} updated to ${orderInterventionStatus}.`);
      setSelectedOrder(null);
      setOrderInterventionNotes('');
      loadOrders();
      loadOverview();
      loadAudit();
    } catch (err) {
      setError(err instanceof HttpError ? err.message : 'Failed to update order status.');
    } finally {
      setBusy(false);
    }
  }

  // Filtered views
  const filteredShops = shops
    .filter((s) => selectedFloor === null || s.floorNumber === selectedFloor)
    .filter((s) => !shopSearch || s.name.toLowerCase().includes(shopSearch.toLowerCase()) || s.category.toLowerCase().includes(shopSearch.toLowerCase()));

  const filteredAlerts = inventoryAlerts.filter((a) => {
    if (inventoryFilter === 'LOW_STOCK') return a.alertType === 'LOW_STOCK';
    if (inventoryFilter === 'OUT_OF_STOCK') return a.alertType === 'OUT_OF_STOCK';
    return true;
  });

  return (
    <div className="stack" style={{ gap: 28, maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header Banner */}
      <div className="card" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#fff' }}>
        <div className="row-between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
              <ShieldCheck size={13} color="#10B981" /> MALL OPERATIONS COMMAND CENTER · PHASE 6
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, margin: '2px 0 6px', color: '#fff' }}>
              Alpha One Mall Administration
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#94A3B8', maxWidth: 640 }}>
              Central management portal for Nexus Ahmedabad One (Vastrapur). Live structural digital twin, five-floor store registry, retailer onboarding, authoritative inventory controls, and order oversight.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => {
                loadOverview();
                loadStructure();
                loadRetailers();
                loadInventory();
                loadOrders();
                loadAudit();
                flashSuccess('Refreshed all mall operational data.');
              }}
              disabled={busy}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh Sync
            </button>
            <span className="badge badge-gold" style={{ fontSize: 12, padding: '6px 12px' }}>
              Role: System Administrator
            </span>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div style={{ marginTop: 16, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} /> <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div style={{ marginTop: 16, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#A7F3D0', padding: '10px 14px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} /> <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--border)', paddingBottom: 10, overflowX: 'auto' }}>
        {[
          { id: 'OVERVIEW', label: 'Executive Overview', icon: TrendingUp },
          { id: 'STRUCTURE', label: 'Five-Floor Mall Twin', icon: Layers },
          { id: 'RETAILERS', label: 'Retailer Management', icon: Users },
          { id: 'INVENTORY', label: 'Catalogue & Inventory', icon: Package },
          { id: 'ORDERS', label: 'Order Oversight', icon: ShoppingBag },
          { id: 'AUDIT', label: 'System Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                background: active ? 'var(--brand-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE OVERVIEW
      ========================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="stack" style={{ gap: 24 }}>
          {/* Key Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="row-between" style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                <span>Registered Stores</span>
                <Store size={18} color="var(--brand-primary)" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                {stats?.totalStores ?? '...'}
              </div>
              <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                {stats?.activeStores} Active · {stats?.inactiveStores} Inactive
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="row-between" style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                <span>Floors & Facilities</span>
                <Layers size={18} color="#2563EB" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                {stats?.totalFloors ?? 5} Levels
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {stats?.totalFacilities} Navigable Facilities (LG to 3F)
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="row-between" style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                <span>Active Retailers</span>
                <Users size={18} color="#D97706" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                {stats?.activeRetailers ?? '...'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {stats?.totalUsers} Registered Accounts (DB)
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="row-between" style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                <span>Catalogue Products</span>
                <Package size={18} color="#059669" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                {stats?.totalProducts ?? '...'}
              </div>
              <div style={{ fontSize: 11, color: (stats?.lowStockCount ?? 0) > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                {stats?.lowStockCount} Low Stock · {stats?.outOfStockCount} Out
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <div className="row-between" style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}>
                <span>Gross Order Value (Sandbox)</span>
                <ShoppingBag size={18} color="#7C3AED" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 2px', color: 'var(--text-primary)' }}>
                ₹{stats?.totalRevenue?.toLocaleString('en-IN') ?? '0'}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {stats?.totalOrders} Total Orders (Excl. Cancelled)
              </div>
            </div>
          </div>

          {/* Operational Breakdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            {/* Orders by Status */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Orders by Operational Status</h3>
              <div className="stack" style={{ gap: 12 }}>
                {stats &&
                  Object.entries(stats.ordersByStatus).map(([st, cnt]) => {
                    const pct = stats.totalOrders > 0 ? (cnt / stats.totalOrders) * 100 : 0;
                    const color =
                      st === 'COMPLETED'
                        ? '#10B981'
                        : st === 'PLACED'
                        ? '#3B82F6'
                        : st === 'READY_FOR_PICKUP'
                        ? '#D97706'
                        : '#EF4444';
                    return (
                      <div key={st}>
                        <div className="row-between" style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                          <span>{st.replace(/_/g, ' ')}</span>
                          <span>
                            {cnt} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Product Category Distribution */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Catalogue Category Coverage</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                {stats &&
                  Object.entries(stats.categoryBreakdown).map(([cat, cnt]) => (
                    <div
                      key={cat}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>{cat}</span>
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                        {cnt}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Data Authenticity / Grounding Notice */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px 18px', borderRadius: 10, fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong>Data Source Truth:</strong> Counts derived from live PostgreSQL tables (<code style={{ fontSize: 11 }}>shops, products, orders, users, facilities</code>). No fabricated physical traffic or conversion projections.
            </div>
            <span className="badge badge-gold" style={{ fontSize: 11 }}>
              PostgreSQL :5433
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: FIVE-FLOOR MALL TWIN & STRUCTURE
      ========================================================================== */}
      {activeTab === 'STRUCTURE' && (
        <div className="stack" style={{ gap: 24 }}>
          {/* Floor Selector Pills */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            <button
              onClick={() => setSelectedFloor(null)}
              className={`btn btn-sm ${selectedFloor === null ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Floors (5 Levels)
            </button>
            {floors.map((f) => (
              <button
                key={f.floorId}
                onClick={() => setSelectedFloor(f.floorNumber)}
                className={`btn btn-sm ${selectedFloor === f.floorNumber ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 20 }}
              >
                {f.label} ({f.storeCount} stores · {f.facilityCount} facilities)
              </button>
            ))}
          </div>

          {/* Digital Twin Graph Safeguard Info */}
          {validationReport && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: 8, fontSize: 12, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Compass size={18} />
              <div>
                <strong>Digital Twin Navigation Safeguard:</strong> Canonical graph contains {validationReport.totalNodes} nodes and {validationReport.totalEdges} edges. All store doors and facilities are locked to physical coordinates. Store deletions are disabled to prevent topological fragmentation.
              </div>
            </div>
          )}

          {/* Stores Table */}
          <div className="card" style={{ padding: 22 }}>
            <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Registered Stores {selectedFloor !== null ? `on Floor ${selectedFloor}` : ''} ({filteredShops.length})
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Search stores or category..."
                  value={shopSearch}
                  onChange={(e) => setShopSearch(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, minWidth: 220 }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '10px 8px' }}>Store Name</th>
                    <th style={{ padding: '10px 8px' }}>Floor</th>
                    <th style={{ padding: '10px 8px' }}>Category</th>
                    <th style={{ padding: '10px 8px' }}>Operating Hours</th>
                    <th style={{ padding: '10px 8px' }}>Products</th>
                    <th style={{ padding: '10px 8px' }}>Assigned Retailer</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShops.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                          {s.floorLabel}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: '#64748B' }}>{s.category}</td>
                      <td style={{ padding: '12px 8px', fontSize: 12 }}>
                        {s.openingTime ? `${s.openingTime} - ${s.closingTime}` : '10:00 - 22:00'}
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.productCount}</td>
                      <td style={{ padding: '12px 8px', fontSize: 12 }}>
                        {s.ownerEmail ? (
                          <span style={{ color: '#059669', fontWeight: 600 }}>{s.ownerEmail}</span>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${s.active ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                          {s.active ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              setEditingShop(s);
                              setShopForm({
                                name: s.name,
                                category: s.category,
                                description: s.description ?? '',
                                logoUrl: s.logoUrl ?? '',
                                openingTime: s.openingTime ?? undefined,
                                closingTime: s.closingTime ?? undefined,
                              });
                            }}
                            className="btn btn-secondary btn-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleShopActive(s.id, s.active)}
                            disabled={busy}
                            className={`btn btn-xs ${s.active ? 'btn-ghost' : 'btn-primary'}`}
                            style={{ color: s.active ? '#DC2626' : undefined }}
                          >
                            {s.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigable Facilities Table */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>
              Navigable Facilities {selectedFloor !== null ? `on Floor ${selectedFloor}` : ''} ({facilities.filter(f => selectedFloor === null || f.floorNumber === selectedFloor).length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px' }}>Facility Label</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Floor</th>
                    <th style={{ padding: '8px' }}>Navigation Node ID</th>
                    <th style={{ padding: '8px' }}>Map Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities
                    .filter((f) => selectedFloor === null || f.floorNumber === selectedFloor)
                    .map((fac) => (
                      <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{fac.label}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                            {fac.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>{fac.floorLabel}</td>
                        <td style={{ padding: '10px 8px', color: '#64748B' }}>Node #{fac.navigationNodeId}</td>
                        <td style={{ padding: '10px 8px', fontSize: 12, color: '#64748B' }}>
                          ({fac.x.toFixed(1)}, {fac.y.toFixed(1)})
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Edit Shop Modal */}
          {editingShop && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
              }}
            >
              <div className="card" style={{ maxWidth: 520, width: '100%', padding: 24, background: '#fff' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Edit Store: {editingShop.name}</h3>
                <form onSubmit={handleSaveShop} className="stack" style={{ gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Store Name</label>
                    <input
                      type="text"
                      value={shopForm.name ?? ''}
                      onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Category</label>
                    <input
                      type="text"
                      value={shopForm.category ?? ''}
                      onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
                    <textarea
                      value={shopForm.description ?? ''}
                      onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={() => setEditingShop(null)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: RETAILER ONBOARDING & MANAGEMENT
      ========================================================================== */}
      {activeTab === 'RETAILERS' && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="row-between" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Authorized Retailers Directory</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Manage store manager logins and ensure strict store isolation across Nexus Ahmedabad One.
                </p>
              </div>
              <button onClick={() => setShowOnboardModal(true)} className="btn btn-primary btn-sm">
                <Plus size={14} style={{ marginRight: 4 }} /> Onboard New Retailer
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '10px 8px' }}>Retailer Account</th>
                  <th style={{ padding: '10px 8px' }}>Manager Name</th>
                  <th style={{ padding: '10px 8px' }}>Assigned Store</th>
                  <th style={{ padding: '10px 8px' }}>Floor</th>
                  <th style={{ padding: '10px 8px' }}>Account Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {retailers.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{r.email}</td>
                    <td style={{ padding: '12px 8px' }}>{r.fullName}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0F172A' }}>{r.shopName}</td>
                    <td style={{ padding: '12px 8px' }}>
                      {r.shopFloorNumber !== null ? (
                        <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                          Floor {r.shopFloorNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${r.enabled ? 'badge-primary' : 'badge-danger'}`} style={{ fontSize: 10 }}>
                        {r.enabled ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleRetailerEnabled(r.id, r.enabled)}
                        disabled={busy}
                        className={`btn btn-xs ${r.enabled ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ color: r.enabled ? '#DC2626' : undefined }}
                      >
                        {r.enabled ? 'Suspend Account' : 'Activate Account'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Onboard Retailer Modal */}
          {showOnboardModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
              }}
            >
              <div className="card" style={{ maxWidth: 480, width: '100%', padding: 24, background: '#fff' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Onboard Store Retailer</h3>
                <form onSubmit={handleOnboardRetailer} className="stack" style={{ gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Manager Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh Mehta"
                      value={onboardForm.fullName}
                      onChange={(e) => setOnboardForm({ ...onboardForm, fullName: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Login Email</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@brand.local"
                      value={onboardForm.email}
                      onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Temporary Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 characters"
                      value={onboardForm.password}
                      onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })}
                      required
                      minLength={6}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Assign Physical Store</label>
                    <select
                      value={onboardForm.shopId ?? ''}
                      onChange={(e) => setOnboardForm({ ...onboardForm, shopId: e.target.value ? Number(e.target.value) : undefined })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    >
                      <option value="">-- No Store Assigned Initially --</option>
                      {shops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.floorLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={() => setShowOnboardModal(false)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                      Complete Onboarding
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: INVENTORY & CATALOGUE
      ========================================================================== */}
      {activeTab === 'INVENTORY' && (
        <div className="stack" style={{ gap: 24 }}>
          {/* Inventory Filters & Alerts Header */}
          <div className="card" style={{ padding: 22 }}>
            <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mall-wide Inventory Control & Stock Warnings</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Every stock adjustment is atomic and recorded in the permanent adjustment ledger.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setInventoryFilter('ALL')}
                  className={`btn btn-xs ${inventoryFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  All Alerts ({inventoryAlerts.length})
                </button>
                <button
                  onClick={() => setInventoryFilter('OUT_OF_STOCK')}
                  className={`btn btn-xs ${inventoryFilter === 'OUT_OF_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Out of Stock ({inventoryAlerts.filter((a) => a.alertType === 'OUT_OF_STOCK').length})
                </button>
                <button
                  onClick={() => setInventoryFilter('LOW_STOCK')}
                  className={`btn btn-xs ${inventoryFilter === 'LOW_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Low Stock (&le;5) ({inventoryAlerts.filter((a) => a.alertType === 'LOW_STOCK').length})
                </button>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '10px 8px' }}>Product</th>
                  <th style={{ padding: '10px 8px' }}>Store & Floor</th>
                  <th style={{ padding: '10px 8px' }}>Category</th>
                  <th style={{ padding: '10px 8px' }}>Price</th>
                  <th style={{ padding: '10px 8px' }}>Stock Qty</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Adjustment</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.slice(0, 25).map((a) => (
                  <tr key={a.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{a.productName}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12 }}>
                      {a.shopName} (Floor {a.floorNumber})
                    </td>
                    <td style={{ padding: '12px 8px', color: '#64748B' }}>{a.category}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>₹{a.price}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 800, color: a.stockQuantity === 0 ? '#DC2626' : '#D97706' }}>
                      {a.stockQuantity}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${a.alertType === 'OUT_OF_STOCK' ? 'badge-danger' : 'badge-gold'}`} style={{ fontSize: 10 }}>
                        {a.alertType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setAdjustingProduct(a);
                          setAdjustNewStock(a.stockQuantity + 10);
                          setAdjustReason('RESTOCK');
                          setAdjustNotes('Restocked from mall central warehouse');
                        }}
                        className="btn btn-secondary btn-xs"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Historical Adjustments Ledger */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Recent Stock Adjustment Audit Ledger</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px' }}>Timestamp</th>
                    <th style={{ padding: '8px' }}>Product</th>
                    <th style={{ padding: '8px' }}>Store</th>
                    <th style={{ padding: '8px' }}>Old &rarr; New</th>
                    <th style={{ padding: '8px' }}>Change</th>
                    <th style={{ padding: '8px' }}>Reason</th>
                    <th style={{ padding: '8px' }}>Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryHistory.slice(0, 15).map((h) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 8px', color: '#64748B' }}>{new Date(h.createdAt).toLocaleTimeString()}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 600 }}>{h.productName}</td>
                      <td style={{ padding: '10px 8px' }}>{h.shopName}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>
                        {h.oldStock} &rarr; {h.newStock}
                      </td>
                      <td style={{ padding: '10px 8px', color: h.changeQuantity >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                        {h.changeQuantity >= 0 ? `+${h.changeQuantity}` : h.changeQuantity}
                      </td>
                      <td style={{ padding: '10px 8px' }}>
                        <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                          {h.reason}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: 11 }}>{h.actorEmail}</td>
                    </tr>
                  ))}
                  {inventoryHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}>
                        No inventory adjustments recorded in this session yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Navigable Facilities Table */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700 }}>
              Navigable Facilities {selectedFloor !== null ? `on Floor ${selectedFloor}` : ''} ({facilities.filter(f => selectedFloor === null || f.floorNumber === selectedFloor).length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                    <th style={{ padding: '8px' }}>Facility Label</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Floor</th>
                    <th style={{ padding: '8px' }}>Navigation Node ID</th>
                    <th style={{ padding: '8px' }}>Map Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities
                    .filter((f) => selectedFloor === null || f.floorNumber === selectedFloor)
                    .map((fac) => (
                      <tr key={fac.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 8px', fontWeight: 600 }}>{fac.label}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                            {fac.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px' }}>{fac.floorLabel}</td>
                        <td style={{ padding: '10px 8px', color: '#64748B' }}>Node #{fac.navigationNodeId}</td>
                        <td style={{ padding: '10px 8px', fontSize: 12, color: '#64748B' }}>
                          ({fac.x.toFixed(1)}, {fac.y.toFixed(1)})
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Adjustment Modal */}
          {adjustingProduct && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
              }}
            >
              <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24, background: '#fff' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>Adjust Stock: {adjustingProduct.productName}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  Current Stock: <strong>{adjustingProduct.stockQuantity}</strong> ({adjustingProduct.shopName})
                </div>

                <form onSubmit={handleStockAdjustment} className="stack" style={{ gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>New Stock Level (&ge; 0)</label>
                    <input
                      type="number"
                      min={0}
                      value={adjustNewStock}
                      onChange={(e) => setAdjustNewStock(Math.max(0, Number(e.target.value)))}
                      required
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Adjustment Reason</label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    >
                      <option value="RESTOCK">RESTOCK (Warehouse Intake)</option>
                      <option value="DAMAGE">DAMAGE (Broken / Expired)</option>
                      <option value="RETURN">RETURN (Customer Return)</option>
                      <option value="CORRECTION">CORRECTION (Count Discrepancy)</option>
                      <option value="CYCLE_COUNT">CYCLE_COUNT (Physical Audit)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified by Store Manager"
                      value={adjustNotes}
                      onChange={(e) => setAdjustNotes(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={() => setAdjustingProduct(null)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                      Confirm Adjustment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: ORDER OVERSIGHT
      ========================================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Mall-wide Order Oversight ({orders.length})</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Admin oversight with delay tracking, exception handling, and sandbox refund auditability.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => {
                    setOrderStatusFilter(e.target.value);
                    loadOrders();
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
                >
                  <option value="">All Statuses</option>
                  <option value="PLACED">PLACED</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={delayedOnly}
                    onChange={(e) => {
                      setDelayedOnly(e.target.checked);
                      loadOrders();
                    }}
                  />
                  <span>Delayed (&gt;2h) Only</span>
                </label>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '10px 8px' }}>Order Number</th>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Fulfilment</th>
                  <th style={{ padding: '10px 8px' }}>Total Amount</th>
                  <th style={{ padding: '10px 8px' }}>Payment</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 700 }}>{o.orderNumber}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12, color: '#64748B' }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 12 }}>{o.customerName ?? 'Customer'}</td>
                    <td style={{ padding: '12px 8px', fontSize: 12 }}>
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                        {o.fulfilmentType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 800 }}>₹{o.totalAmount}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-gold" style={{ fontSize: 10 }}>
                        {o.paymentStatus ?? 'PAID_SANDBOX'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        className={`badge ${
                          o.status === 'COMPLETED'
                            ? 'badge-primary'
                            : o.status === 'READY_FOR_PICKUP'
                            ? 'badge-gold'
                            : o.status === 'CANCELLED'
                            ? 'badge-danger'
                            : 'badge-secondary'
                        }`}
                        style={{ fontSize: 10 }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedOrder(o);
                          setOrderInterventionStatus(o.status);
                        }}
                        className="btn btn-secondary btn-xs"
                      >
                        Intervene
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order Intervention Modal */}
          {selectedOrder && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20,
              }}
            >
              <div className="card" style={{ maxWidth: 500, width: '100%', padding: 24, background: '#fff' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Admin Intervention: #{selectedOrder.orderNumber}</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
                  Total: <strong>₹{selectedOrder.totalAmount}</strong> · Customer: {selectedOrder.customerName}
                </div>

                <form onSubmit={handleOrderIntervention} className="stack" style={{ gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Target Status</label>
                    <select
                      value={orderInterventionStatus}
                      onChange={(e) => setOrderInterventionStatus(e.target.value as any)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED (Triggers Sandbox Refund & Stock Return)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Administrative Reason / Notes</label>
                    <textarea
                      value={orderInterventionNotes}
                      onChange={(e) => setOrderInterventionNotes(e.target.value)}
                      placeholder="State reason for status modification..."
                      required
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                    <button type="button" onClick={() => setSelectedOrder(null)} className="btn btn-secondary btn-sm">
                      Cancel
                    </button>
                    <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
                      Update Order
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: SYSTEM AUDIT TRAIL
      ========================================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="stack" style={{ gap: 24 }}>
          <div className="card" style={{ padding: 22 }}>
            <div className="row-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Immutable System Audit Trail</h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Every administrative mutation, retailer creation, stock change, and store modification is permanently logged.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    loadAudit();
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12 }}
                >
                  <option value="">All Action Types</option>
                  <option value="STORE_METADATA_UPDATED">STORE_METADATA_UPDATED</option>
                  <option value="STORE_STATUS_CHANGED">STORE_STATUS_CHANGED</option>
                  <option value="RETAILER_CREATED">RETAILER_CREATED</option>
                  <option value="RETAILER_STATUS_CHANGED">RETAILER_STATUS_CHANGED</option>
                  <option value="STOCK_ADJUSTED">STOCK_ADJUSTED</option>
                  <option value="ORDER_STATUS_UPDATED">ORDER_STATUS_UPDATED</option>
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: '#64748B' }}>
                  <th style={{ padding: '10px 8px' }}>Timestamp</th>
                  <th style={{ padding: '10px 8px' }}>Actor</th>
                  <th style={{ padding: '10px 8px' }}>Role</th>
                  <th style={{ padding: '10px 8px' }}>Action Type</th>
                  <th style={{ padding: '10px 8px' }}>Entity</th>
                  <th style={{ padding: '10px 8px' }}>Details</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>{log.actorEmail}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className="badge badge-secondary" style={{ fontSize: 10 }}>
                        {log.actorRole}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0F172A' }}>{log.actionType}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {log.entityType} #{log.entityId}
                    </td>
                    <td style={{ padding: '10px 8px', maxWidth: 360, color: '#334155' }}>{log.details}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className="badge badge-primary" style={{ fontSize: 10 }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: '#94A3B8' }}>
                      No audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
