const config = require('./config.js');
const rescueTime = require('./rescueTime');
const gs = require('./googleSpreadsheet');

const main = async apiKey => {
	config.init();
	const dsf = await rescueTime.getDailySummaryFeed(config.apiKey, { when: new Date() });
	gs.write(
		{
			client_email: config.spreadsheet.clientEmail,
			private_key: config.spreadsheet.privateKey
		},
		config.spreadsheet.key,
		dsf,
		{ key: 'date' }
	);
};

main();
