// Mirrors backend/src/main/java/com/mallmind/backend DTOs field-for-field.
// Every shape here should match a real Java record -- no field is invented.

export interface ProductResponse {
  id: number;
  name: string;
  brand: string | null;
  color: string | null;
  category: string;
  price: number;
  discountPrice: number | null;
  effectivePrice: number;
  available: boolean;
  imageUrl: string | null;
  shopId: number;
  shopName: string;
  shopFloorNumber: number;
  description?: string | null;
  specifications?: string | null;
  stockQuantity?: number | null;
}

export interface ShopResponse {
  id: number;
  name: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  floorNumber: number;
  navigationNodeId: number;
  x: number;
  y: number;
}

export type NavigationNodeType =
  | 'SHOP_ENTRANCE'
  | 'FACILITY'
  | 'CORRIDOR_JUNCTION'
  | 'ENTRANCE_EXIT'
  | 'ESCALATOR'
  | 'ELEVATOR'
  | 'STAIRCASE';

export type FacilityType =
  | 'WASHROOM'
  | 'ATM'
  | 'FOOD_COURT'
  | 'PARKING_ACCESS'
  | 'CUSTOMER_SERVICE'
  | 'SECURITY_DESK';

export interface FacilityResponse {
  id: number;
  type: FacilityType;
  label: string;
  floorNumber: number;
  x: number;
  y: number;
  navigationNodeId: number;
}

export interface FloorSummary {
  id: number;
  floorNumber: number;
  label: string;
  planWidth: number;
  planHeight: number;
}

export interface FloorMapResponse {
  floor: FloorSummary;
  shops: ShopResponse[];
  facilities: FacilityResponse[];
}

export interface RouteStep {
  nodeId: number;
  floorNumber: number;
  x: number;
  y: number;
  nodeType: NavigationNodeType;
  label: string;
  instruction: string;
}

export interface RouteResponse {
  fromNodeId: number;
  toNodeId: number;
  totalDistance: number;
  steps: RouteStep[];
  spokenDirections: string[];
  estimatedDistanceMeters?: number;
  isEstimatedDistance?: boolean;
  rawCanvasDistance?: number;
  floorTransitionsCount?: number;
  floorSequence?: number[];
  routeType?: string;
}

export interface GraphValidationReport {
  status: 'PASS' | 'FAIL';
  isFullyConnected: boolean;
  connectedComponentsCount: number;
  totalNodes: number;
  totalEdges: number;
  totalFloors: number;
  floorsRepresented: number[];
  totalShopsChecked: number;
  reachableShopsCount: number;
  unreachableShopIds: number[];
  totalFacilitiesChecked: number;
  reachableFacilitiesCount: number;
  unreachableFacilityIds: number[];
  details: string[];
}

export interface RecommendationResponse {
  products: ProductResponse[];
  source: 'ml-content-based' | 'baseline-filter';
}

export interface NluEntities {
  maxBudget: number | null;
  category: string | null;
  brand: string | null;
  color: string | null;
  shop: string | null;
  facility: string | null;
  destination: string | null;
}

export interface VoiceQueryResponse {
  sessionId: string;
  transcript: string | null;
  intent: string;
  confidence: number;
  lowConfidence: boolean;
  entities: NluEntities;
  responseText: string;
  data: unknown;
  audioBase64: string | null;
}

export interface DemandForecastResponse {
  category: string;
  predictedNextDayCount: number;
  basis: string;
}

export interface ImageClassificationResponse {
  category: string | null;
  confidence: number;
  lowConfidence: boolean;
  probabilities: Record<string, number>;
  note: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface CartItemResponse {
  cartItemId: number;
  product: ProductResponse;
  quantity: number;
  lineTotal: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  subtotal: number;
  totalItemCount: number;
}

export interface WishlistItemResponse {
  wishlistItemId: number;
  product: ProductResponse;
}

export interface WishlistResponse {
  items: WishlistItemResponse[];
}

export type FulfilmentType = 'IN_STORE_PURCHASE' | 'STORE_PICKUP' | 'MALL_DELIVERY';
export type OrderStatus = 'PLACED' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'UPI_SANDBOX' | 'CARD_SANDBOX' | 'COUNTER_CASH';
export type PaymentStatus = 'PENDING_PAYMENT' | 'PAID_SANDBOX' | 'FAILED_SANDBOX' | 'REFUNDED_SANDBOX';

export interface OrderItemResponse {
  productId: number;
  productName: string;
  shopName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  fulfilmentType: FulfilmentType;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  deliveryFee?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  transactionReference?: string;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface CheckoutRequest {
  fulfilmentType: FulfilmentType;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  specialInstructions?: string;
  paymentMethod?: PaymentMethod;
  simulatePaymentFailure?: boolean;
}

export interface OfferResponse {
  id: number;
  shopId: number;
  shopName: string;
  title: string;
  description: string | null;
  validFrom: string | null;
  validTo: string | null;
  active: boolean;
  sponsored: boolean;
}

export interface ProductCreateRequest {
  shopId: number;
  categoryName: string;
  name: string;
  brand?: string;
  color?: string;
  description?: string;
  price: number;
  discountPrice?: number;
  specifications?: string;
  imageUrl?: string;
  available: boolean;
  stockQuantity: number;
}

export interface ProductUpdateRequest {
  name?: string;
  brand?: string;
  color?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  specifications?: string;
  imageUrl?: string;
  available?: boolean;
  stockQuantity?: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  details?: Record<string, string>;
}

// ============================================================================
// Phase 6: Admin Operations, Retailer Management & Inventory Types
// ============================================================================

export interface DashboardStatsResponse {
  totalStores: number;
  activeStores: number;
  inactiveStores: number;
  totalFloors: number;
  totalFacilities: number;
  totalProducts: number;
  activeRetailers: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  lowStockCount: number;
  outOfStockCount: number;
  countsSource: string;
  isDemoData: boolean;
}

export interface FloorOverviewResponse {
  floorId: number;
  floorNumber: number;
  label: string;
  storeCount: number;
  facilityCount: number;
  planWidth: number;
  planHeight: number;
}

export interface ShopAdminResponse {
  id: number;
  name: string;
  category: string;
  description: string | null;
  logoUrl: string | null;
  floorNumber: number;
  floorLabel: string;
  navigationNodeId: number;
  x: number;
  y: number;
  active: boolean;
  openingTime: string | null;
  closingTime: string | null;
  ownerUserId: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  productCount: number;
}

export interface ShopUpdateRequest {
  name?: string;
  category?: string;
  description?: string;
  logoUrl?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface FacilityAdminResponse {
  id: number;
  floorNumber: number;
  floorLabel: string;
  type: FacilityType;
  label: string;
  navigationNodeId: number;
  x: number;
  y: number;
}

export interface FacilityCreateRequest {
  floorNumber: number;
  type: FacilityType;
  label: string;
  navigationNodeId: number;
}

export interface FacilityUpdateRequest {
  type: FacilityType;
  label: string;
}

export interface RetailerUserResponse {
  id: number;
  email: string;
  fullName: string;
  enabled: boolean;
  createdAt: string;
  shopId: number | null;
  shopName: string;
  shopFloorNumber: number | null;
}

export interface RetailerOnboardRequest {
  email: string;
  fullName: string;
  password: string;
  shopId?: number;
}

export type InventoryAdjustmentReason = 'RESTOCK' | 'DAMAGE' | 'RETURN' | 'CORRECTION' | 'CYCLE_COUNT' | 'SALE' | 'CANCEL_RESTORE';

export interface InventoryAdjustmentRequest {
  productId: number;
  newStock: number;
  reason: InventoryAdjustmentReason;
  notes?: string;
}

export interface InventoryAdjustmentResponse {
  id: number;
  productId: number;
  productName: string;
  shopId: number;
  shopName: string;
  oldStock: number;
  newStock: number;
  changeQuantity: number;
  reason: InventoryAdjustmentReason;
  actorEmail: string;
  actorRole: string;
  notes: string | null;
  createdAt: string;
}

export interface InventoryAlertResponse {
  productId: number;
  productName: string;
  brand: string | null;
  category: string;
  shopId: number;
  shopName: string;
  floorNumber: number;
  price: number;
  stockQuantity: number;
  available: boolean;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface AuditLogResponse {
  id: number;
  actorEmail: string;
  actorRole: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  status: string;
  createdAt: string;
}
