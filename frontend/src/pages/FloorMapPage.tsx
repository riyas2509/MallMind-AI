import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { FacilityResponse, FloorMapResponse, FloorSummary, RouteResponse, ShopResponse } from '../api/types';
import { FALLBACK_FLOORS, FALLBACK_FACILITIES, FALLBACK_SHOPS, getFallbackFloorMap, getFallbackRoute } from '../data/fallbackData';
import { getShopImage } from '../utils/images';
import {
  Compass,
  Navigation2,
  Layers,
  Search,
  Footprints,
  ArrowRight,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Play,
  Square,
  CheckCircle2,
  Star,
  ShoppingBag,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Accessibility,
  AlertTriangle,
  Box,
} from 'lucide-react';

interface Selected {
  kind: 'shop' | 'facility';
  name: string;
  category?: string;
  navigationNodeId: number;
  floorNumber: number;
  x?: number;
  y?: number;
  description?: string;
  id?: number | string;
}

const STARTING_POINTS = [
  { nodeId: 21, floorNumber: 0, label: 'Main Grand Entrance (Vastrapur Gate • Floor G)' },
  { nodeId: 25, floorNumber: 0, label: 'Central Atrium East Kiosk (Floor G)' },
  { nodeId: 1, floorNumber: -1, label: 'LG Parking & Valet Entrance (Floor LG)' },
  { nodeId: 41, floorNumber: 1, label: 'West Balcony Kiosk (Floor 1F)' },
  { nodeId: 61, floorNumber: 2, label: 'West Corridor Kiosk (Floor 2F)' },
  { nodeId: 81, floorNumber: 3, label: 'Food Court & Cinema Concourse (Floor 3F)' },
];

const ENTRANCE_QR = 'QR-G-ENTRANCE';

export default function FloorMapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [floors, setFloors] = useState<FloorSummary[]>(FALLBACK_FLOORS);
  const [activeFloor, setActiveFloor] = useState<number>(Number(searchParams.get('floor') ?? 0));
  const [floorMap, setFloorMap] = useState<FloorMapResponse | null>(() => getFallbackFloorMap(Number(searchParams.get('floor') ?? 0)));
  const [entrance, setEntrance] = useState<{ nodeId: number; floorNumber: number; label: string }>({
    nodeId: 21,
    floorNumber: 0,
    label: 'Main Grand Entrance (Vastrapur Gate • Floor G)',
  });
  const [selected, setSelected] = useState<Selected | null>(null);
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'2d' | 'isometric'>('2d');

  // Live Navigation Simulation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [audioGuidance, setAudioGuidance] = useState(true);
  const simTimerRef = useRef<number | null>(null);

  // Load floors and main entrance check-in
  useEffect(() => {
    api
      .get<FloorSummary[]>('/api/floors')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setFloors(data);
      })
      .catch(() => {});

    api
      .get<{ nodeId: number; floorNumber: number; label: string }>(`/api/navigation/checkin?qrCode=${ENTRANCE_QR}`)
      .then(setEntrance)
      .catch(() => {
        setEntrance({ nodeId: 21, floorNumber: 0, label: 'Main Grand Entrance (Vastrapur Gate • Floor G)' });
      });
  }, []);

  // Load floor plan for current floor
  useEffect(() => {
    api
      .get<FloorMapResponse>(`/api/floors/${activeFloor}/map`)
      .then((data) => {
        if (data && Array.isArray(data.shops)) {
          setFloorMap(data);
        } else {
          setFloorMap(getFallbackFloorMap(activeFloor));
        }
      })
      .catch(() => {
        setFloorMap(getFallbackFloorMap(activeFloor));
      });
  }, [activeFloor]);

  const computeRoute = useCallback(
    async (toNodeId: number, autoStart = false, accessible = accessibleOnly) => {
      setRouting(true);
      setError(null);
      setIsNavigating(false);
      if (simTimerRef.current) clearInterval(simTimerRef.current);

      const fromId = entrance?.nodeId ?? 21;
      try {
        const res = await api.post<RouteResponse>('/api/navigation/route', {
          fromNodeId: fromId,
          toNodeId,
          accessibleOnly: accessible,
        });
        setRoute(res);
        if (autoStart) {
          setIsNavigating(true);
          setCurrentStepIndex(0);
        }
      } catch {
        // Compute client fallback route
        const fallback = getFallbackRoute(fromId, toNodeId);
        if (fallback) {
          setRoute(fallback);
          if (autoStart) {
            setIsNavigating(true);
            setCurrentStepIndex(0);
          }
        } else {
          setRoute(null);
          setError('No direct route found between the selected starting point and destination. Please choose another starting kiosk or accessible transition.');
        }
      } finally {
        setRouting(false);
      }
    },
    [entrance, accessibleOnly],
  );

  // Handle URL deep linking (e.g. from Voice Widget or Shop cards)
  useEffect(() => {
    const toNodeId = searchParams.get('toNodeId') || searchParams.get('destNodeId');
    const toLabel = searchParams.get('toLabel');
    const floorParam = searchParams.get('floor');
    const autoStartParam = searchParams.get('autoStart');

    if (floorParam !== null && floorParam !== undefined) {
      setActiveFloor(Number(floorParam));
    }

    if (toNodeId) {
      setSelected({
        kind: 'shop',
        name: toLabel ?? 'Destination Store',
        navigationNodeId: Number(toNodeId),
        floorNumber: Number(floorParam ?? 0),
      });
      void computeRoute(Number(toNodeId), autoStartParam === 'true');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, computeRoute, setSearchParams]);

  const handleToggleAccessible = (checked: boolean) => {
    setAccessibleOnly(checked);
    if (selected) {
      void computeRoute(selected.navigationNodeId, false, checked);
    }
  };

  // Turn-by-turn simulation loop
  useEffect(() => {
    if (!isNavigating || !route || route.steps.length === 0) return;

    simTimerRef.current = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < route.steps.length - 1) {
          const nextIdx = prev + 1;
          const nextStep = route.steps[nextIdx];
          // Auto switch floor if route transitions to another floor!
          if (nextStep && nextStep.floorNumber !== activeFloor) {
            setActiveFloor(nextStep.floorNumber);
          }
          return nextIdx;
        } else {
          // Arrived!
          if (simTimerRef.current) clearInterval(simTimerRef.current);
          return prev;
        }
      });
    }, 2800);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isNavigating, route, activeFloor]);

  const onFloorChange = (floorNumber: number) => {
    setActiveFloor(floorNumber);
  };

  const onMarkerClick = (kind: 'shop' | 'facility', item: ShopResponse | FacilityResponse) => {
    const isShop = kind === 'shop';
    const name = isShop ? (item as ShopResponse).name : (item as FacilityResponse).label;
    const category = isShop ? (item as ShopResponse).category : (item as FacilityResponse).type;
    const description = isShop ? ((item as ShopResponse).description ?? undefined) : undefined;

    setSelected({
      kind,
      name,
      category,
      navigationNodeId: item.navigationNodeId,
      floorNumber: item.floorNumber,
      x: item.x,
      y: item.y,
      description,
      id: item.id,
    });
    void computeRoute(item.navigationNodeId, false);
  };

  const planWidth = floorMap?.floor.planWidth ?? 1000;
  const planHeight = floorMap?.floor.planHeight ?? 600;

  const routeStepsOnThisFloor = useMemo(
    () => route?.steps.filter((s) => s.floorNumber === activeFloor) ?? [],
    [route, activeFloor],
  );
  const routePoints = routeStepsOnThisFloor.map((s) => `${s.x},${s.y}`).join(' ');

  // Current simulation position
  const currentStep = route?.steps[currentStepIndex];
  const isSimPointOnActiveFloor = currentStep && currentStep.floorNumber === activeFloor;

  // Filtered shops on this floor
  const filteredShops = useMemo(() => {
    if (!floorMap) return [];
    if (!filterQuery.trim()) return floorMap.shops;
    const q = filterQuery.toLowerCase();
    return floorMap.shops.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [floorMap, filterQuery]);

  const estimatedWalkingMeters = route?.estimatedDistanceMeters ?? (route ? Math.round(route.totalDistance * 0.25) : 0);
  const estimatedMins = route ? Math.max(1, Math.round((estimatedWalkingMeters / 75) * 10) / 10) : 0;
  const hasArrived = isNavigating && route && currentStepIndex === route.steps.length - 1;

  // Compute direction icon for current guidance
  const currentInstruction =
    route?.spokenDirections?.[Math.min(currentStepIndex, (route.spokenDirections.length || 1) - 1)] ||
    (selected ? `Head toward ${selected.name}` : 'Select a destination');

  return (
    <div className="stack" style={{ gap: 20 }}>
      {/* Prototype Positioning Disclaimer Banner */}
      <div
        style={{
          background: 'var(--bg-brand-light)',
          border: '1px solid rgba(36, 88, 74, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 14px',
          fontSize: 12,
          color: 'var(--brand-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Compass size={14} style={{ flexShrink: 0 }} />
        <span>
          <strong>Indoor Digital Twin & Navigation:</strong> Nexus Ahmedabad One (Alpha One Mall, Vastrapur). Starting points are mapped to physical entry kiosks. Dijkstra pathfinding evaluates real corridor graph edges.
        </span>
      </div>

      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            color: '#991B1B',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* ================= GOOGLE MAPS INDOOR HUD HEADER ================= */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
          {/* Origin & Destination Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Start location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--color-success)',
                  border: '2px solid #E8F5EF',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  Starting Point (Selected Kiosk)
                </span>
                <div style={{ marginTop: 2 }}>
                  <select
                    value={entrance.nodeId}
                    onChange={(e) => {
                      const chosen = STARTING_POINTS.find((p) => p.nodeId === Number(e.target.value));
                      if (chosen) {
                        setEntrance(chosen);
                        if (selected) {
                          void computeRoute(selected.navigationNodeId);
                        }
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: '#fff',
                      color: 'var(--text-primary)',
                      width: '100%',
                      maxWidth: 440,
                    }}
                  >
                    {STARTING_POINTS.map((sp) => (
                      <option key={sp.nodeId} value={sp.nodeId}>
                        {sp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Destination */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: 'var(--color-error)',
                  border: '2px solid #FCEBEB',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  Destination
                </span>
                <div style={{ marginTop: 2 }}>
                  <select
                    value={selected?.navigationNodeId ?? ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!val) return;
                      const shop = FALLBACK_SHOPS.find((s) => s.navigationNodeId === val);
                      const facility = FALLBACK_FACILITIES.find((f) => f.navigationNodeId === val);
                      if (shop) {
                        setSelected({
                          kind: 'shop',
                          name: shop.name,
                          category: shop.category,
                          navigationNodeId: shop.navigationNodeId,
                          floorNumber: shop.floorNumber,
                          x: shop.x,
                          y: shop.y,
                          description: shop.description ?? undefined,
                          id: shop.id,
                        });
                        setActiveFloor(shop.floorNumber);
                        void computeRoute(shop.navigationNodeId);
                      } else if (facility) {
                        setSelected({
                          kind: 'facility',
                          name: facility.label,
                          category: facility.type,
                          navigationNodeId: facility.navigationNodeId,
                          floorNumber: facility.floorNumber,
                          x: facility.x,
                          y: facility.y,
                          id: facility.id,
                        });
                        setActiveFloor(facility.floorNumber);
                        void computeRoute(facility.navigationNodeId);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      background: '#fff',
                      color: selected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      width: '100%',
                      maxWidth: 440,
                    }}
                  >
                    <option value="">-- Choose destination store or amenity --</option>
                    <optgroup label="Stores & Dining (30 Directory Stores)">
                      {FALLBACK_SHOPS.map((s) => (
                        <option key={s.id} value={s.navigationNodeId}>
                          {s.name} (Floor {s.floorNumber === -1 ? 'LG' : s.floorNumber === 0 ? 'G' : s.floorNumber} · {s.category})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Facilities & Amenities (11 Mall Facilities)">
                      {FALLBACK_FACILITIES.map((f) => (
                        <option key={f.id} value={f.navigationNodeId}>
                          {f.label} (Floor {f.floorNumber === -1 ? 'LG' : f.floorNumber === 0 ? 'G' : f.floorNumber})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action: Route Metrics & 2D/Isometric View Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
            {/* View Mode Toggle Button */}
            <div
              style={{
                display: 'flex',
                background: '#EAE8E1',
                borderRadius: 'var(--radius-sm)',
                padding: 3,
                gap: 4,
              }}
            >
              <button
                onClick={() => setViewMode('2d')}
                style={{
                  border: 'none',
                  background: viewMode === '2d' ? '#FFFFFF' : 'transparent',
                  color: viewMode === '2d' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === '2d' ? 700 : 500,
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: viewMode === '2d' ? 'var(--shadow-xs)' : 'none',
                }}
              >
                <Layers size={13} />
                <span>2D Plan</span>
              </button>
              <button
                onClick={() => setViewMode('isometric')}
                style={{
                  border: 'none',
                  background: viewMode === 'isometric' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'isometric' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'isometric' ? 700 : 500,
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: viewMode === 'isometric' ? 'var(--shadow-xs)' : 'none',
                }}
              >
                <Box size={13} />
                <span>2.5D Isometric</span>
              </button>
            </div>

            {/* Accessibility Checkbox */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={accessibleOnly}
                onChange={(e) => handleToggleAccessible(e.target.checked)}
                style={{ accentColor: 'var(--brand-primary)' }}
              />
              <Accessibility size={14} style={{ color: accessibleOnly ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
              <span style={{ fontWeight: accessibleOnly ? 600 : 400 }}>Wheelchair Accessible (Elevator Only)</span>
            </label>

            {/* Route summary badge */}
            {route && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-primary)' }}>
                    ~{estimatedWalkingMeters} m
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    ~{estimatedMins} min walk • {route.steps.length} steps
                  </div>
                </div>

                {!isNavigating ? (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setIsNavigating(true);
                      setCurrentStepIndex(0);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
                  >
                    <Play size={14} fill="#fff" />
                    <span>Start Guidance</span>
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setIsNavigating(false);
                      if (simTimerRef.current) clearInterval(simTimerRef.current);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                  >
                    <Square size={14} fill="currentColor" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= TURN-BY-TURN GUIDANCE BANNER ================= */}
      {route && (
        <div
          style={{
            background: hasArrived ? '#E8F5EF' : 'var(--brand-primary)',
            color: hasArrived ? '#0F5132' : '#FFFFFF',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: hasArrived ? 'rgba(15, 81, 50, 0.15)' : 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {hasArrived ? (
                <CheckCircle2 size={20} />
              ) : currentInstruction.toLowerCase().includes('right') ? (
                <CornerUpRight size={20} />
              ) : currentInstruction.toLowerCase().includes('left') ? (
                <CornerUpLeft size={20} />
              ) : currentInstruction.toLowerCase().includes('elevator') || currentInstruction.toLowerCase().includes('escalator') ? (
                <ArrowUp size={20} />
              ) : (
                <Footprints size={20} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.01em' }}>
                {hasArrived ? `Arrived at ${selected?.name}!` : currentInstruction}
              </div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                Step {currentStepIndex + 1} of {route.steps.length} • {activeFloor === -1 ? 'LG' : activeFloor === 0 ? 'Ground Floor' : `Floor ${activeFloor}`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setAudioGuidance(!audioGuidance)}
              title={audioGuidance ? 'Mute Voice Directions' : 'Unmute Voice Directions'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'inherit',
                borderRadius: 'var(--radius-xs)',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {audioGuidance ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.9 }}>
              {isNavigating ? 'Simulated Wayfinding' : 'Step-by-Step Preview'}
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN INTERACTIVE MAP CANVAS + SIDEBAR ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* MAP CONTAINER */}
        <div
          className="map-canvas-container"
          style={{
            position: 'relative',
            background: '#ECEBE4',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow:
              viewMode === 'isometric'
                ? '0 30px 60px rgba(32, 42, 50, 0.18), 0 10px 20px rgba(32, 42, 50, 0.1)'
                : 'var(--shadow-sm)',
            perspective: viewMode === 'isometric' ? '1200px' : 'none',
            padding: viewMode === 'isometric' ? '30px 10px' : 0,
            transition: 'all 0.4s ease',
          }}
        >
          {/* Top Floating Overlay Badge */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              zIndex: 20,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Layers size={13} style={{ color: 'var(--brand-primary)' }} />
            <span>{floorMap?.floor.label || `Floor ${activeFloor}`}</span>
            <span style={{ color: 'var(--border-strong)' }}>•</span>
            <span style={{ color: 'var(--text-secondary)' }}>{floorMap?.shops.length || 0} Stores</span>
            {viewMode === 'isometric' && (
              <>
                <span style={{ color: 'var(--border-strong)' }}>•</span>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>2.5D Isometric Mode</span>
              </>
            )}
          </div>

          {/* VERTICAL FLOOR SELECTOR PILL (Floating on right edge) */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 25,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: 4,
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              border: '1px solid var(--border-color)',
            }}
          >
            {floors.slice().reverse().map((f) => {
              const isActive = f.floorNumber === activeFloor;
              const shortLabel = f.floorNumber === -1 ? 'LG' : f.floorNumber === 0 ? 'G' : `${f.floorNumber}`;
              return (
                <button
                  key={f.id}
                  onClick={() => onFloorChange(f.floorNumber)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: isActive ? 'var(--brand-primary)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  title={f.label}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>

          {/* SVG FLOOR PLAN (With 2.5D Isometric Perspective Tilt support) */}
          <div
            style={{
              transform:
                viewMode === 'isometric'
                  ? 'rotateX(46deg) rotateZ(-26deg) scale(0.92)'
                  : 'none',
              transformOrigin: '50% 50%',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow:
                viewMode === 'isometric'
                  ? '0 20px 40px rgba(32, 42, 50, 0.25)'
                  : 'none',
              borderRadius: 12,
            }}
          >
            <svg
              viewBox={`0 0 ${planWidth} ${planHeight}`}
              width="100%"
              style={{ display: 'block', maxHeight: 580 }}
            >
              <defs>
                <linearGradient id="gmapsRoute" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#276EF1" />
                  <stop offset="100%" stopColor="#1A73E8" />
                </linearGradient>
                <filter id="slabShadow" x="-5%" y="-5%" width="110%" height="115%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#202A32" floodOpacity="0.14" />
                </filter>
              </defs>

              <g
                transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                style={{ transformOrigin: `${planWidth / 2}px ${planHeight / 2}px`, transition: 'transform 0.15s ease-out' }}
              >
                {/* 2.5D Extruded Architectural Base Slab */}
                {viewMode === 'isometric' && (
                  <rect
                    x={25}
                    y={33}
                    width={planWidth - 50}
                    height={planHeight - 50}
                    rx={12}
                    fill="#C9C7BF"
                  />
                )}

                {/* Mall Outer Boundary Floor Slab */}
                <rect
                  x={25}
                  y={25}
                  width={planWidth - 50}
                  height={planHeight - 50}
                  rx={12}
                  fill="#F4F3ED"
                  stroke="#D8D6CE"
                  strokeWidth={2}
                  filter={viewMode === 'isometric' ? 'url(#slabShadow)' : undefined}
                />

                {/* Central Pedestrian Corridor */}
                <rect
                  x={100}
                  y={260}
                  width={planWidth - 200}
                  height={80}
                  rx={8}
                  fill="#E8E6DF"
                  stroke="#CBC8BC"
                  strokeWidth={1}
                />

                {/* Corridor Center Walkway Tile Guide */}
                <line
                  x1={100}
                  y1={300}
                  x2={planWidth - 100}
                  y2={300}
                  stroke="rgba(32, 42, 50, 0.12)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                />

                {/* Vertical Connectors: Escalators & Elevators with Wheelchair Badge */}
                <g transform="translate(500, 275)">
                  <rect x={-34} y={-14} width={68} height={28} rx={4} fill="#E5EDE7" stroke="#24584A" strokeWidth={1} />
                  <text x={0} y={4} textAnchor="middle" fill="#24584A" fontSize={9.5} fontWeight={700}>
                    ⚡ ESCALATOR
                  </text>
                </g>

                <g transform="translate(700, 275)">
                  <rect x={-36} y={-14} width={72} height={28} rx={4} fill="#FAF6EE" stroke="#B58A52" strokeWidth={1.2} />
                  <text x={0} y={4} textAnchor="middle" fill="#B58A52" fontSize={9.5} fontWeight={700}>
                    🛗 LIFT (ACC)
                  </text>
                </g>

                {/* ENTRANCE GATES */}
                {activeFloor === 0 && (
                  <g transform="translate(50, 260)">
                    <rect x={0} y={0} width={65} height={80} rx={6} fill="#E8F5EF" stroke="#21865A" strokeWidth={1.5} />
                    <text x={32} y={34} textAnchor="middle" fill="#21865A" fontSize={8.5} fontWeight={800}>
                      VASTRAPUR
                    </text>
                    <text x={32} y={48} textAnchor="middle" fill="#21865A" fontSize={8.5} fontWeight={800}>
                      ENTRANCE
                    </text>
                    <circle cx={32} cy={62} r={4} fill="#21865A" />
                  </g>
                )}
                {activeFloor === -1 && (
                  <g transform="translate(50, 260)">
                    <rect x={0} y={0} width={65} height={80} rx={6} fill="#E8F5EF" stroke="#21865A" strokeWidth={1.5} />
                    <text x={32} y={34} textAnchor="middle" fill="#21865A" fontSize={8.5} fontWeight={800}>
                      VALET
                    </text>
                    <text x={32} y={48} textAnchor="middle" fill="#21865A" fontSize={8.5} fontWeight={800}>
                      PARKING
                    </text>
                    <circle cx={32} cy={62} r={4} fill="#21865A" />
                  </g>
                )}

                {/* SHOPS (30 Directory Stores) */}
                {floorMap?.shops.map((s) => {
                  const isSelected = selected?.name === s.name;
                  return (
                    <g
                      key={`shop-${s.id}`}
                      onClick={() => onMarkerClick('shop', s)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Shop 2.5D Drop Shadow */}
                      {viewMode === 'isometric' && (
                        <rect
                          x={s.x - 70}
                          y={s.y - 44}
                          width={144}
                          height={96}
                          rx={8}
                          fill="#D4D2CA"
                        />
                      )}

                      {/* Shop room box */}
                      <rect
                        x={s.x - 72}
                        y={s.y - 48}
                        width={144}
                        height={96}
                        rx={8}
                        fill={isSelected ? '#E5EDE7' : '#FFFFFF'}
                        stroke={isSelected ? '#24584A' : '#D8D6CE'}
                        strokeWidth={isSelected ? 2.5 : 1}
                      />

                      {/* Doorway slot connecting to corridor */}
                      <line
                        x1={s.x - 15}
                        y1={s.y < 300 ? s.y + 48 : s.y - 48}
                        x2={s.x + 15}
                        y2={s.y < 300 ? s.y + 48 : s.y - 48}
                        stroke="#E8E6DF"
                        strokeWidth={3}
                      />

                      {/* Marker Pin Icon */}
                      <circle
                        cx={s.x}
                        cy={s.y - 12}
                        r={isSelected ? 14 : 12}
                        fill={isSelected ? '#24584A' : '#697580'}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <text
                        x={s.x}
                        y={s.y - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#ffffff"
                        fontWeight={700}
                      >
                        {s.id}
                      </text>

                      {/* Shop Name Label */}
                      <text
                        x={s.x}
                        y={s.y + 16}
                        textAnchor="middle"
                        fontSize={12}
                        fontWeight={700}
                        fill={isSelected ? '#24584A' : '#202A32'}
                        fontFamily="var(--font-headings)"
                      >
                        {s.name}
                      </text>

                      {/* Category label */}
                      <text
                        x={s.x}
                        y={s.y + 32}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#697580"
                      >
                        {s.category}
                      </text>
                    </g>
                  );
                })}

                {/* FACILITIES (Restrooms, Food Court, ATM, Parking with Visual Icons) */}
                {floorMap?.facilities.map((f) => {
                  const isSelected = selected?.name === f.label;
                  const iconSymbol =
                    f.type === 'WASHROOM'
                      ? '🚻'
                      : f.type === 'ATM'
                      ? '🏧'
                      : f.type === 'CUSTOMER_SERVICE'
                      ? 'ℹ️'
                      : f.type === 'PARKING_ACCESS'
                      ? '🅿️'
                      : '🍽️';

                  return (
                    <g
                      key={`fac-${f.id}`}
                      onClick={() => onMarkerClick('facility', f)}
                      style={{ cursor: 'pointer' }}
                    >
                      {viewMode === 'isometric' && (
                        <rect
                          x={f.x - 46}
                          y={f.y - 28}
                          width={96}
                          height={64}
                          rx={6}
                          fill="#D4D2CA"
                        />
                      )}
                      <rect
                        x={f.x - 48}
                        y={f.y - 32}
                        width={96}
                        height={64}
                        rx={6}
                        fill={isSelected ? '#FAF6EE' : '#FAF9F6'}
                        stroke={isSelected ? '#B58A52' : '#E3E1DA'}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <circle cx={f.x} cy={f.y - 12} r={11} fill="#B58A52" />
                      <text
                        x={f.x}
                        y={f.y - 8}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#ffffff"
                      >
                        {iconSymbol}
                      </text>
                      <text
                        x={f.x}
                        y={f.y + 14}
                        textAnchor="middle"
                        fontSize={9.5}
                        fontWeight={700}
                        fill="#202A32"
                      >
                        {f.label.split(' ')[0]}
                      </text>
                      <text
                        x={f.x}
                        y={f.y + 25}
                        textAnchor="middle"
                        fontSize={8.5}
                        fill="#697580"
                      >
                        {f.type}
                      </text>
                    </g>
                  );
                })}

                {/* NAVIGATION ROUTE (Dijkstra Core Path & Walking Dots) */}
                {routePoints && (
                  <g>
                    {/* Route Buffer Shadow */}
                    <polyline
                      points={routePoints}
                      fill="none"
                      stroke="#276EF1"
                      strokeWidth={7}
                      strokeOpacity={0.2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Solid Core Path */}
                    <polyline
                      points={routePoints}
                      fill="none"
                      stroke="#276EF1"
                      strokeWidth={4.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Directional Walking Dots */}
                    <polyline
                      points={routePoints}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      strokeDasharray="4 8"
                    />
                  </g>
                )}

                {/* STARTING KIOSK BEACON ("You Are Here") */}
                {entrance && entrance.floorNumber === activeFloor && (
                  <g transform="translate(60, 300)">
                    <circle cx={0} cy={0} r={8} fill="#21865A" stroke="#ffffff" strokeWidth={2.5} />
                    <circle cx={0} cy={0} r={18} fill="rgba(33, 134, 90, 0.3)">
                      <animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <rect x={-40} y={-32} width={80} height={18} rx={4} fill="#21865A" />
                    <text x={0} y={-20} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight={800}>
                      START KIOSK
                    </text>
                  </g>
                )}

                {/* LIVE SIMULATION POSITION PIN */}
                {isNavigating && isSimPointOnActiveFloor && (
                  <g transform={`translate(${currentStep.x}, ${currentStep.y})`}>
                    <circle cx={0} cy={0} r={8} fill="#276EF1" stroke="#ffffff" strokeWidth={2.5} />
                    <circle cx={0} cy={0} r={20} fill="rgba(39, 110, 241, 0.3)">
                      <animate attributeName="r" values="8;24;8" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* RED DROP PIN AT DESTINATION */}
                {selected && selected.x && selected.y && selected.floorNumber === activeFloor && (
                  <g transform={`translate(${selected.x}, ${selected.y - 20})`}>
                    <ellipse cx={0} cy={20} rx={6} ry={3} fill="rgba(32, 42, 50, 0.25)" />
                    <path
                      d="M0,-22 C-8,-22 -14,-16 -14,-7 C-14,4 0,18 0,18 C0,18 14,4 14,-7 C14,-16 8,-22 0,-22 Z"
                      fill="#C74747"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <circle cx={0} cy={-9} r={4.5} fill="#ffffff" />
                  </g>
                )}
              </g>
            </svg>
          </div>

          {/* Floating Zoom & Pan Controls */}
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              right: 14,
              zIndex: 25,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              padding: 3,
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setZoom((z) => Math.min(2.2, Math.round((z + 0.2) * 10) / 10))}
              title="Zoom In"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.8, Math.round((z - 0.2) * 10) / 10))}
              title="Zoom Out"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Reset View"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Map Footer Legend */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              fontSize: 11,
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            <div className="row" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#21865A' }} />
              <span>Starting Kiosk</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C74747' }} />
              <span>Destination</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span style={{ width: 20, height: 3, background: '#276EF1', borderRadius: 2 }} />
              <span>Dijkstra Corridor Route</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#E5EDE7', border: '1px solid #24584A' }} />
              <span>Escalator</span>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#FAF6EE', border: '1px solid #B58A52' }} />
              <span>Glass Lift (Wheelchair Accessible)</span>
            </div>
            <div className="row" style={{ gap: 6, marginLeft: 'auto', fontWeight: 600, color: 'var(--brand-primary)' }}>
              <span>Nexus Ahmedabad One • Vastrapur</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: PLACE DETAIL & DIRECTORY */}
        <div className="stack" style={{ gap: 16 }}>
          {/* Selected Place Card */}
          {selected ? (
            <div
              className="card"
              style={{
                padding: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Storefront Image */}
              <div style={{ height: 130, position: 'relative', overflow: 'hidden', background: '#EAE8E1' }}>
                <img
                  src={getShopImage(selected.name)}
                  alt={selected.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(32, 42, 50, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  Floor {selected.floorNumber === -1 ? 'LG' : selected.floorNumber === 0 ? 'G' : selected.floorNumber}
                </div>
              </div>

              {/* Store Details Body */}
              <div className="stack" style={{ padding: 16, gap: 10 }}>
                <div>
                  <div className="row-between" style={{ alignItems: 'baseline' }}>
                    <h3 style={{ fontSize: 16, margin: 0, color: 'var(--text-primary)' }}>{selected.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--brand-accent)', fontSize: 12, fontWeight: 700 }}>
                      <Star size={13} fill="var(--brand-accent)" /> 4.8
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {selected.category} • <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Open</span> (Closes 10 PM)
                  </div>
                </div>

                {selected.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    {selected.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    disabled={routing}
                    onClick={() => computeRoute(selected.navigationNodeId, true)}
                  >
                    <Navigation2 size={14} />
                    {routing ? 'Calculating Route...' : 'Start Walking Route'}
                  </button>

                  {selected.kind === 'shop' && (
                    <Link
                      to={`/shops/${selected.id}`}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 12,
                      }}
                    >
                      <ShoppingBag size={13} /> View Store Profile & Products
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Compass size={32} style={{ margin: '0 auto 8px', color: 'var(--brand-primary)', opacity: 0.8 }} />
              <h4 style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-primary)' }}>
                Indoor Architectural Wayfinding
              </h4>
              <p style={{ fontSize: 12, margin: 0, color: 'var(--text-secondary)' }}>
                Select any store or amenity on the floor plan or toggle the 2.5D Isometric view to explore Nexus Ahmedabad One.
              </p>
            </div>
          )}

          {error && <p className="error-text" style={{ fontSize: 12, color: 'var(--color-error)' }}>{error}</p>}

          {/* Stores on Current Floor Directory Search */}
          <div className="card" style={{ padding: 16 }}>
            <div className="row-between" style={{ marginBottom: 10 }}>
              <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                Stores on Floor {activeFloor === -1 ? 'LG' : activeFloor === 0 ? 'G' : activeFloor}
              </strong>
              <span className="muted" style={{ fontSize: 11 }}>{filteredShops.length} stores</span>
            </div>

            <div style={{ position: 'relative', marginBottom: 10 }}>
              <Search size={13} style={{ position: 'absolute', top: 9, left: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search floor directory..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 12, padding: '7px 10px 7px 30px' }}
              />
            </div>

            <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredShops.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onMarkerClick('shop', s)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: selected?.name === s.name ? 'var(--bg-brand-light)' : 'var(--bg-primary)',
                    border: selected?.name === s.name ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{s.category}</div>
                  </div>
                  <ArrowRight size={12} style={{ color: selected?.name === s.name ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
