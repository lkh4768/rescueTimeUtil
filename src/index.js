const config = require('./config.js');
const rescueTime = require('./rescueTime');
const gs = require('./googleSpreadsheet');

const main = async apiKey => {
	config.init();
	const when = new Date();
	when.setDate(when.getDate() - 1);
	const dsf = await rescueTime.getDailySummaryFeed(config.apiKey, { when });
	delete dsf.id;
	gs.write(
		config.googleApi.oauth2,
		config.spreadsheet.id,
		dsf,
		{ key: 'date' }
	);
};

main();
