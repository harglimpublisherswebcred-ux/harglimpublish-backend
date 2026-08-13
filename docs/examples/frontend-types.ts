export type UserRole = 'reader' | 'author' | 'admin';
export type BookStatus = 'draft' | 'published' | 'archived';
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentPurpose = 'ORDER_PURCHASE' | 'AUTHOR_ACCESS';
export type PaymentStatus =
  | 'INTENT_CREATED'
  | 'QR_PENDING'
  | 'QR_GENERATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUBMITTED'
  | 'VERIFICATION_PENDING'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUND_APPROVED'
  | 'REFUNDED';

export type AuthorApplicationStatus = 'pending' | 'approved' | 'rejected';
export type DashboardAccessState =
  | 'NOT_AUTHOR'
  | 'APPROVED_AUTHOR_NO_PLAN'
  | 'PAYMENT_PENDING'
  | 'VERIFICATION_PENDING'
  | 'ACTIVE'
  | 'REVOKED';
export type RoyaltyStatus = 'CALCULATED' | 'HISTORICAL_RATE_UNAVAILABLE';
export type SettlementStatus = 'DRAFT' | 'READY_FOR_APPROVAL' | 'APPROVED' | 'PAYMENT_PENDING' | 'PAID' | 'CANCELLED';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  pagination?: Pagination;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit?: number;
  pages?: number;
  totalPages?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UserContext {
  user: User;
  capabilities: {
    canPublish: boolean;
    canAccessAuthorDashboard: boolean;
    canAdminister: boolean;
  };
  authorApplication?: {
    status?: AuthorApplicationStatus;
  } | null;
  dashboardAccess?: {
    status: DashboardAccessState;
    hasAccess: boolean;
  };
}

export interface Book {
  _id: string;
  title: string;
  slug: string;
  description: string;
  author: string | User;
  category: string | { _id: string; name: string; slug: string };
  mrp: number;
  price?: number;
  royaltyPercentage?: number;
  coverImage?: string;
  stock?: number;
  status: BookStatus;
  ratings?: number;
  reviewCount?: number;
}

export interface OrderItem {
  book: string | Book;
  quantity: number;
  price: number;
  author?: string;
  royaltyPercentage?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  payment?: string;
  paymentMethod?: string;
  utr?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface PaymentSummary {
  paymentId: string;
  order?: string;
  purpose: PaymentPurpose;
  subjectType?: string;
  subjectId?: string;
  status: PaymentStatus;
  amount: number;
  currency: 'INR' | string;
  upiUri?: string;
  qrImage?: string;
  qrCodeDataUrl?: string;
  qrExpiresAt?: string;
}

export interface AuthorDashboardSummary {
  books: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  sales: {
    unitsSold: number;
    grossBookRevenue: number;
  };
  royalties: {
    accruedKnown: number;
    accrued: number;
    eligibleUnsettled: number;
    settledPendingPayment: number;
    paidLifetime: number;
    currency: string;
    dataStatus: 'COMPLETE' | 'PARTIAL';
    unresolvedLegacySales: number;
  };
  topBooks: AuthorBookPerformance[];
  recentSales: RoyaltyHistoryItem[];
}

export interface AuthorBookPerformance {
  bookId: string;
  title: string;
  status: BookStatus;
  unitsSold: number;
  grossBookRevenue: number;
  knownAccruedRoyalty: number;
  unresolvedLegacySales: number;
  currentRoyaltyPercentage: number;
}

export interface RoyaltyHistoryItem {
  orderNumber: string;
  bookId: string | null;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  grossBookRevenue: number;
  royaltyPercentageSnapshot: number | null;
  royaltyAmount: number | null;
  royaltyStatus: RoyaltyStatus;
  saleDate: string;
  status: 'ACCRUED';
}

export interface RoyaltySettlement {
  _id: string;
  settlementNumber: string;
  author: string | User;
  periodStart: string;
  periodEnd: string;
  currency: string;
  status: SettlementStatus;
  grossBookRevenue: number;
  totalRoyalty: number;
  itemCount: number;
  paidAt?: string;
}

export interface AdminDashboard {
  [key: string]: unknown;
}

export interface AdminAuthorDetail {
  profile: User;
  application?: unknown;
  dashboardAccess?: unknown;
  books?: unknown;
  publishing?: unknown;
  royalty?: unknown;
  settlements?: unknown;
}
