const path = require('path');
const { argv } = require('yargs');

class Config {
	init() {
		let config;
		if (argv.config) {
			config = require(argv.config);
		} else {
			config = require(path.join(process.cwd(), './.rescue-util.json'));
		}
		
		Object.keys(config).forEach(key => {
			this[key] = config[key];
		});
	}
}

const config = new Config();

module.exports = config;
