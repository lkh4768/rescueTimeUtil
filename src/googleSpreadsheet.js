const GoogleSpreadsheet = require('google-spreadsheet');
const { promisify } = require('util');

exports.write = async (creds, spreadsheetKey, data, { key }) => {
	const doc = new GoogleSpreadsheet(spreadsheetKey);
	await promisify(doc.useServiceAccountAuth)(creds);
	const docInfo = await promisify(doc.getInfo)();
	console.log({ docInfo });
};