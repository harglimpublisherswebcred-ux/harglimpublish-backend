const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const hasChargeBasedRoyalty = (source = {}) => [
  source.printingCost,
  source.platformCharges,
  source.deliveryCharges,
].some((value) => Number(value) > 0);

const royaltyPerCopyFromBook = (book = {}) => {
  if (!hasChargeBasedRoyalty(book)) return null;
  return roundMoney(Math.max(0,
    Number(book.mrp || 0)
      - Number(book.printingCost || 0)
      - Number(book.platformCharges || 0)
      - Number(book.deliveryCharges || 0)
  ));
};

const royaltyForOrderItem = (item = {}) => {
  const quantity = Number(item.quantity || 0);
  if (typeof item.royaltyPerCopySnapshot === 'number') {
    return {
      royaltyPerCopy: item.royaltyPerCopySnapshot,
      royaltyAmount: roundMoney(item.royaltyPerCopySnapshot * quantity),
      royaltyPercentage: null,
      source: 'CHARGE_SNAPSHOT',
    };
  }
  if (typeof item.royaltyPercentage === 'number') {
    const gross = Number(item.price || 0) * quantity;
    return {
      royaltyPerCopy: quantity > 0 ? roundMoney(((gross * item.royaltyPercentage) / 100) / quantity) : 0,
      royaltyAmount: roundMoney((gross * item.royaltyPercentage) / 100),
      royaltyPercentage: item.royaltyPercentage,
      source: 'PERCENTAGE_SNAPSHOT',
    };
  }
  return { royaltyPerCopy: null, royaltyAmount: null, royaltyPercentage: null, source: 'UNAVAILABLE' };
};

module.exports = {
  roundMoney,
  hasChargeBasedRoyalty,
  royaltyPerCopyFromBook,
  royaltyForOrderItem,
};
