const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { promisify } = require('util');

const SCOPES = [
	'https://www.googleapis.com/auth/drive',
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/spreadsheets.readonly',
];
const TOKEN_PATH = path.resolve('.googleApiToken.json');

const getNewToken = oAuth2Client => new Promise((resolve, reject) => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question('Enter the code from that page here: ', async code => {
		rl.close();
		let token;
		try {
			token = await promisify(oAuth2Client.getToken).bind(oAuth2Client)(code);
		} catch(err) {
			console.error('Error while trying to retrieve access token', err);
			return reject(err);
		}

		oAuth2Client.setCredentials(token);

		try {
			await promisify(fs.writeFile)(TOKEN_PATH, JSON.stringify(token));
			console.log('Token stored to', TOKEN_PATH);
		} catch(err) {
			console.error(err);
			return reject(err);
		}
	});
});

const authorize = async (id, secret, redirectUri) => {
	const oAuth2Client = new google.auth.OAuth2(id, secret, redirectUri);
	try {
		const token = await promisify(fs.readFile)(TOKEN_PATH);
		oAuth2Client.setCredentials(JSON.parse(token));
	} catch(err) {
		await getNewToken(oAuth2Client);
	}
	return oAuth2Client;
}

const getFirstRow = async (spreadsheetId, sheets) => {
	const { data: { valueRanges } } = await promisify(sheets.spreadsheets.values.batchGet)
		.bind(sheets.spreadsheets.values)({
			spreadsheetId,
			ranges: [ '1:1' ]
		});
	return valueRanges[0].values[0];
};

const getFields = async (spreadsheetId, sheets, fields) => {
	const rowValues = await getFirstRow(spreadsheetId, sheets);

	if (fields.every(f => rowValues.indexOf(f) >= 0)) {
		return rowValues;
	}

	return null;
};

const writeFields = async (spreadsheetId, sheets, fields) => {
	await promisify(sheets.spreadsheets.values.batchUpdate)
		.bind(sheets.spreadsheets.values)({
			spreadsheetId,
			requestBody: {
				data: [
					{
						majorDimension: 'ROWS',
						range: '1:1',
						values: [fields]
					}
				],
				valueInputOption: 'RAW'
			}
		});
}

const orderData = (fields, data) => fields.reduce((orderedData, f) => {
		orderedData[f] = data[f];
		return orderedData;
	}, {});

const getLastRow = async (spreadsheetId, sheets) => {
	const { data: { valueRanges } } = await promisify(sheets.spreadsheets.values.batchGet)
		.bind(sheets.spreadsheets.values)({
			spreadsheetId,
			ranges: [ 'A:A' ]
		});
	return valueRanges[0].values.length + 1;
};

const writeLastRow = async (spreadsheetId, sheets, data) => {
	const lastRow = await getLastRow(spreadsheetId, sheets);

	await promisify(sheets.spreadsheets.values.batchUpdate)
		.bind(sheets.spreadsheets.values)({
			spreadsheetId,
			requestBody: {
				data: [
					{
						majorDimension: 'ROWS',
						range: `${lastRow}:${lastRow}`,
						values: [data]
					}
				],
				valueInputOption: 'RAW'
			}
		});
}

exports.write = async (authInfo, spreadsheetId, rawData) => {
	const auth = await authorize(authInfo.id, authInfo.secret, authInfo.redirectUris[0]);

	const sheets = google.sheets({ version: 'v4', auth });
	const rawFields = Object.keys(rawData);

	let fields = await getFields(spreadsheetId, sheets, rawFields);

	if (!fields) {
		await writeFields(spreadsheetId, sheets, rawFields);
		fields = rawFields;
	}

	const data = orderData(fields, rawData);

	await writeLastRow(spreadsheetId, sheets, Object.values(data));
};
