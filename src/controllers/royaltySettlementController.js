const royaltySettlementService = require('../services/royaltySettlementService');

const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class RoyaltySettlementController {
  previewSettlement = handleAsync(async (req, res) => {
    const { authorId, from, to } = req.body;
    if (!authorId) {
      return res.status(400).json({ success: false, message: 'authorId is required for settlement preview' });
    }
    const result = await royaltySettlementService.previewSettlement(authorId, { from, to });
    res.status(200).json({ success: true, data: result });
  });

  createDraftSettlement = handleAsync(async (req, res) => {
    const { authorId, periodStart, periodEnd } = req.body;
    const settlement = await royaltySettlementService.createDraftSettlement(req.user, { authorId, periodStart, periodEnd });
    res.status(201).json({ success: true, data: settlement });
  });

  listSettlementsForAdmin = handleAsync(async (req, res) => {
    const result = await royaltySettlementService.listSettlementsForAdmin(req.query);
    res.status(200).json({ success: true, ...result });
  });

  getSettlementDetailForAdmin = handleAsync(async (req, res) => {
    const result = await royaltySettlementService.getSettlementDetail(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  });

  approveSettlement = handleAsync(async (req, res) => {
    const settlement = await royaltySettlementService.approveSettlement(req.user, req.params.id);
    res.status(200).json({ success: true, data: settlement });
  });

  markPaid = handleAsync(async (req, res) => {
    const { paymentMethod, transactionReference, notes, paidAt } = req.body;
    const result = await royaltySettlementService.markPaid(req.user, req.params.id, {
      paymentMethod,
      transactionReference,
      notes,
      paidAt
    });
    res.status(200).json({ success: true, data: result });
  });

  cancelSettlement = handleAsync(async (req, res) => {
    const { reason } = req.body;
    const settlement = await royaltySettlementService.cancelSettlement(req.user, req.params.id, { reason });
    res.status(200).json({ success: true, data: settlement });
  });

  reconcileSettlements = handleAsync(async (req, res) => {
    const result = await royaltySettlementService.reconcileSettlements();
    res.status(200).json({ success: true, data: result });
  });

  getAuthorSettlements = handleAsync(async (req, res) => {
    const authorId = req.user._id || req.user.id;
    const result = await royaltySettlementService.getAuthorSettlements(authorId, req.user, req.query);
    res.status(200).json({ success: true, ...result });
  });

  getAuthorSettlementDetail = handleAsync(async (req, res) => {
    const result = await royaltySettlementService.getSettlementDetail(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  });
}

module.exports = new RoyaltySettlementController();
module.exports.RoyaltySettlementController = RoyaltySettlementController;
