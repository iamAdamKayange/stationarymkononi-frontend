export type Role = 'CUSTOMER' | 'STATIONERY' | 'DELIVERY_RIDER' | 'ADMIN';
export type UserStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED_BY_STATIONERY'
  | 'PRINTING'
  | 'READY_FOR_PICKUP'
  | 'RIDER_ASSIGNED'
  | 'RIDER_ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED_DELIVERY';

export type DeliveryStatus =
  | 'UNASSIGNED'
  | 'SEARCHING_RIDER'
  | 'RIDER_ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'M_PESA' | 'TIGO_PESA' | 'AIRTEL_MONEY' | 'HALOPESA' | 'CARD' | 'CASH_ON_DELIVERY';

export type PaperSize = 'A4' | 'A3' | 'A5' | 'CUSTOM';
export type ColorOption = 'BLACK_AND_WHITE' | 'COLOR';
export type SideOption = 'SINGLE_SIDED' | 'DOUBLE_SIDED';
export type OrientationOption = 'PORTRAIT' | 'LANDSCAPE';
export type BindingType = 'NONE' | 'SPIRAL' | 'COMB' | 'HARD_COVER' | 'STAPLE' | 'OTHER';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string;
  role: Role;
  status: UserStatus;
  avatarUrl?: string;
  stationery?: Stationery;
  riderProfile?: RiderProfile;
}

export interface Stationery {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  phoneNumber: string;
  email?: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  openingHours?: string;
  avgRating: number;
  totalRatings: number;
  verificationStatus: UserStatus;
  distanceKm?: number;
  services?: StationeryService[];
  products?: Product[];
}

export interface StationeryService {
  id: string;
  stationeryId: string;
  name: string;
  paperSize: PaperSize;
  colorOption: ColorOption;
  pricePerPage: number;
  bindingType: BindingType;
  bindingPrice: number;
  isAvailable: boolean;
  description?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  stationeryId: string;
  stationery?: Stationery;
  categoryId: string;
  category?: ProductCategory;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  stockQuantity: number;
  isAvailable: boolean;
  sku?: string;
}

export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  pageCount: number;
  uploadedById: string;
  createdAt: string;
}

export interface PrintItemConfiguration {
  documentId: string;
  fileName: string;
  fileUrl?: string;
  pageCount: number;
  paperSize: PaperSize;
  colorOption: ColorOption;
  sideOption: SideOption;
  orientation: OrientationOption;
  binding: BindingType;
  paperType: string;
  copies: number;
  pagesToPrint: string;
  customNotes?: string;
  estimatedPrice: number;
}

export interface CartItem {
  id: string;
  type: 'PRINTING' | 'PRODUCT';
  title: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  product?: Product;
  printConfig?: PrintItemConfiguration;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  product?: Product;
  itemType: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  details?: Record<string, unknown>;
}

export interface RiderProfile {
  id: string;
  userId: string;
  user?: User;
  vehicleType: string;
  vehiclePlate?: string;
  nationalId?: string;
  licenseNumber?: string;
  isOnline: boolean;
  currentLat?: number;
  currentLng?: number;
  avgRating: number;
  totalRatings: number;
  totalDeliveries: number;
  verificationStatus: UserStatus;
}

export interface Delivery {
  id: string;
  orderId: string;
  order?: Order;
  riderId?: string;
  rider?: RiderProfile;
  status: DeliveryStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress: string;
  dropoffLatitude: number;
  dropoffLongitude: number;
  estimatedDistanceKm: number;
  estimatedDurationMin: number;
  deliveryFee: number;
  currentLat?: number;
  currentLng?: number;
  lastTrackingUpdate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer?: User;
  stationeryId: string;
  stationery: Stationery;
  status: OrderStatus;
  subtotal: number;
  printingCost: number;
  productCost: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryPhone: string;
  deliveryInstructions?: string;
  createdAt: string;
  orderItems: OrderItem[];
  delivery?: Delivery;
  payment?: {
    id: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    transactionReference: string;
  };
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  relatedOrderId?: string;
  isRead: boolean;
  createdAt: string;
}
