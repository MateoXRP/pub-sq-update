/**
 * @desc convert hex to string
 * @param {hex} hex
 * @return {string} result
 */
function hex2String(hex) {
  // convert hex into buffer
  const bufHex = Buffer.from(hex, 'hex');

  // convert buffer to utf8 string
  const string = bufHex.toString();

  return string;
}

/**
 * @desc convert string to hex using Buffer
 * @param {string} str
 * @return {hex string} hexString
 */
function string2Hex(str) {
  // convert string into buffer
  let bufStr = Buffer.from(str, 'utf8');

  // convert buffer to hex string
  const hexString = bufStr.toString('hex');

  return hexString;
}

/**
 * @desc parse memos field and get memo data
 * @param {hex} txMemos
 * @return {string} parsedMemo
 */
function parseMemoData(txMemos) {
  if (!txMemos) {
    return '';
  }

  const memoData = txMemos[0].Memo.MemoData;

  if (!memoData) {
    return '';
  }

  const parsedMemo = hex2String(memoData);

  return parsedMemo;
}

/**
 * @desc convert date field to timestamp
 * @param {UNIX date} date
 * @return {Date} timestamp
 */
function getTimestamp(date) {
  const unixDate = date + 946684800;
  const timestamp = new Date(unixDate * 1000);

  return timestamp;
}

/**
 * @desc get tx amount data
 * @param {object || string}
 * @return {object} amount: {currency, value}
 */
function getTxAmountData(amount) {
  if (amount.currency) return amount;

  return {
    currency: 'XRP',
    value: parseInt(amount) / 1000000
  };
}

/**
 * @desc get tx amount formatted for display
 * @param {object || string}
 * @return {string} amount
 */
function getTxDisplayAmount(amount) {
  const displayAmount = amount.currency
    ? `${amount.value} ${amount.currency}`
    : `${parseInt(amount) / 1000000} XRP`;

  return displayAmount;
}

module.exports = {
  hex2String,
  string2Hex,
  parseMemoData,
  getTimestamp,
  getTxAmountData,
  getTxDisplayAmount
};
