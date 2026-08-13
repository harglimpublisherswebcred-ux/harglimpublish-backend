# React / Next.js Integration Examples

These examples are framework-neutral enough to adapt to React, Next.js App Router, or any client state library.

## Login

```ts
const res = await api.post('/api/auth/login', {
  email,
  password
});

storeToken(res.data.token);
```

## Bootstrap User Context

```ts
const context = await api.get('/api/users/me/context');

setCapabilities(context.data.capabilities);
setUser(context.data.user);
```

## Book Listing

```ts
const books = await api.get(`/api/books?page=${page}&limit=12&category=${categorySlug || ''}`);
```

Display `book.mrp`. Treat `book.price` as legacy compatibility only.

## Create Order

```ts
const orderRes = await api.post('/api/orders', {
  items: cartItems.map((item) => ({
    book: item.bookId,
    quantity: item.quantity
  })),
  shippingAddress,
  paymentMethod: 'UPI'
});

showQr(orderRes.data.payment.qrCodeDataUrl);
```

## Submit Payment UTR

```ts
await api.put(`/api/orders/${orderId}/verify-payment`, {
  utr
});

showVerificationPending();
```

## Author Dashboard Access

```ts
const status = await api.get('/api/authors/me/dashboard-access');

if (status.data.dashboardAccess.status === 'ACTIVE') {
  showDashboard();
} else {
  showPaywallOrPendingState(status.data.dashboardAccess.status);
}
```

## Author Book Creation

```ts
await api.post('/api/authors/me/books', {
  title,
  description,
  category,
  mrp,
  format: 'paperback',
  coverImage
});
```

Do not send admin-owned fields like `status`, `royaltyPercentage`, `stock`, or `author`.

## Author Book Submission

```ts
await api.post(`/api/authors/me/books/${bookId}/submit`, {
  fileUrl: manuscriptUrl,
  genre,
  wordCount,
  packageId
});
```

## Admin Payment Approval

```ts
await api.post(`/api/admin/operations/payments/${paymentId}/approve`, {
  reason: 'Verified in bank statement'
});

refreshPaymentQueue();
```

## Admin Manual Payout

```ts
await api.post(`/api/admin/royalty-settlements/${settlementId}/mark-paid`, {
  paymentMethod: 'MANUAL_BANK_TRANSFER',
  transactionReference,
  paidAt: new Date().toISOString(),
  notes
});
```

Never send payout amount; backend uses settlement total.
