const axios = require('axios');

const apiUrl = 'https://www.rescuetime.com/anapi';

exports.getDailySummaryFeed = async (apiKey, { when }) => {
	const { data: dailySummaryFeeds } = await axios.get(
		`${apiUrl}/daily_summary_feed?key=${apiKey}`
	);
	return dailySummaryFeeds.find(dsf => {
		const date = new Date(dsf.date);
		return (
			date.getYear() === when.getYear() &&
			date.getMonth() === when.getMonth() &&
			date.getDay() === when.getDay()
		);
	});
};