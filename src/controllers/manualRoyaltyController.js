const manualRoyaltyService = require('../services/manualRoyaltyService');

const sendError = (res, error) => {
  const status = error.statusCode || 500;
  return res.status(status).json({
    success: false,
    ...(error.code && { error: error.code }),
    message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message
  });
};

const noStore = (res) => res.set('Cache-Control', 'no-store');

const createStatement = async (req, res) => {
  try {
    noStore(res);
    res.status(201).json({
      success: true,
      data: await manualRoyaltyService.createStatement(req.body, req.user, {
        idempotencyKey: req.get('Idempotency-Key')
      })
    });
  } catch (error) { sendError(res, error); }
};

const listAdminStatements = async (req, res) => {
  try {
    noStore(res);
    const result = await manualRoyaltyService.listAdmin(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { sendError(res, error); }
};

const getAdminStatement = async (req, res) => {
  try {
    noStore(res);
    res.json({ success: true, data: await manualRoyaltyService.getStatement(req.params.id) });
  } catch (error) { sendError(res, error); }
};

const voidStatement = async (req, res) => {
  try {
    noStore(res);
    res.json({ success: true, data: await manualRoyaltyService.voidStatement(req.params.id, req.body.reason, req.user) });
  } catch (error) { sendError(res, error); }
};

const listMyStatements = async (req, res) => {
  try {
    noStore(res);
    const result = await manualRoyaltyService.listForAuthor(req.user._id, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { sendError(res, error); }
};

module.exports = { createStatement, listAdminStatements, getAdminStatement, voidStatement, listMyStatements };
