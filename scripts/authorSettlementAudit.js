require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Order = require('../src/models/Order');
const RoyaltySettlement = require('../src/models/RoyaltySettlement');
const RoyaltySettlementClaim = require('../src/models/RoyaltySettlementClaim');
const RoyaltyPayout = require('../src/models/RoyaltyPayout');
const royaltySettlementService = require('../src/services/royaltySettlementService');

async function runSettlementAudit() {
  try {
    console.log('--- ROYALTY SETTLEMENT & PAYOUT ACCOUNTING AUDIT ---');
    await connectDB();

    const [orders, settlements, claims, payouts, reconciliation] = await Promise.all([
      Order.find({ isPaid: true, status: 'DELIVERED' }).lean(),
      RoyaltySettlement.find().lean(),
      RoyaltySettlementClaim.find().lean(),
      RoyaltyPayout.find().lean(),
      royaltySettlementService.reconcileSettlements()
    ]);

    let totalDeliveredOrderItems = 0;
    orders.forEach((o) => {
      totalDeliveredOrderItems += o.items ? o.items.length : 0;
    });

    const activeSettlements = settlements.filter((s) => s.status !== 'CANCELLED');
    const paidSettlements = settlements.filter((s) => s.status === 'PAID');
    const paidPayouts = payouts.filter((p) => p.status === 'PAID');

    const totalSettledRoyaltyAmount = activeSettlements.reduce((sum, s) => sum + (s.totalRoyalty || 0), 0);
    const totalPaidDisbursementAmount = paidPayouts.reduce((sum, p) => sum + (p.amount || 0), 0);

    console.log(`Total Delivered Paid Order Items: ${totalDeliveredOrderItems}`);
    console.log(`Total Royalty Settlements Created: ${settlements.length} (${activeSettlements.length} active, ${paidSettlements.length} paid)`);
    console.log(`Total Source Line Claims: ${claims.length}`);
    console.log(`Total Royalty Payout Records: ${payouts.length} (${paidPayouts.length} paid)`);
    console.log('-----------------------------------------------');
    console.log(`Financial Accounting Totals:`);
    console.log(`- Active Settled Royalty Amount: ₹${totalSettledRoyaltyAmount.toFixed(2)}`);
    console.log(`- Recorded Paid Disbursement Amount: ₹${totalPaidDisbursementAmount.toFixed(2)}`);
    console.log('-----------------------------------------------');
    console.log(`Reconciliation Discrepancies Detected: ${reconciliation.discrepancyCount}`);
    if (reconciliation.discrepancies.length > 0) {
      console.log(JSON.stringify(reconciliation.discrepancies, null, 2));
    } else {
      console.log('Zero financial accounting discrepancies found.');
    }
    console.log('-----------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Audit failed:', error.message);
    process.exit(1);
  }
}

runSettlementAudit();
