const manualRoyaltyService = require('../services/manualRoyaltyService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const createStatement = async (req, res) => {
  try {
    res.status(201).json({ success: true, data: await manualRoyaltyService.createStatement(req.body, req.user) });
  } catch (error) { sendError(res, error); }
};

const listAdminStatements = async (req, res) => {
  try {
    const result = await manualRoyaltyService.listAdmin(req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { sendError(res, error); }
};

const getAdminStatement = async (req, res) => {
  try {
    res.json({ success: true, data: await manualRoyaltyService.getStatement(req.params.id) });
  } catch (error) { sendError(res, error); }
};

const voidStatement = async (req, res) => {
  try {
    res.json({ success: true, data: await manualRoyaltyService.voidStatement(req.params.id, req.body.reason, req.user) });
  } catch (error) { sendError(res, error); }
};

const listMyStatements = async (req, res) => {
  try {
    const result = await manualRoyaltyService.listForAuthor(req.user._id, req.query);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) { sendError(res, error); }
};

module.exports = { createStatement, listAdminStatements, getAdminStatement, voidStatement, listMyStatements };
