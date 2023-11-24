const { InstanceStatus } = require('@companion-module/base');

const axios = require('axios');
const xml2js = require('xml2js');

module.exports = {
	initConnection: function () {
		let self = this;

		if (self.config.host) {
			if (self.config.enable_feedbacks) {
				//create the interval and start polling
				self.stopTimer();
				self.Timer = setInterval(self.getData.bind(self), self.config.poll_interval);
				self.getData(); //get data immediately
			}
			else {
				self.getData();
			}
		}	
	},

	getData () {
		let self = this;

		self.getDeviceInfo();
		self.getAppsInfo();
		self.getActiveApp();
	},

	getDeviceInfo: async function () {
		let self = this;

		if (self.config.host) {
			//get TV device information, then rebuild actions array
			try {
				let url_deviceinfo = '/query/device-info';

				let parseString = xml2js.parseString;

				let response = await axios.get('http://' + self.config.host + ':' + self.config.port + url_deviceinfo);

				if (response) {
					let xml = response.data;

					parseString(xml, function (err, result) {
						let entries = Object.entries(result['device-info']);

						self.DEVICE_INFO = {};

						self.Variables = [
							{
								name: 'Active App / Input',
								variableId: 'active-app'
							}
						];

						for (const [key, value] of entries) {
							let variableObj = {};
							variableObj.name = key;
							variableObj.variableId = key;
							self.Variables.push(variableObj);

							self.DEVICE_INFO[key] = value[0];
						}

						self.setVariableDefinitions(self.Variables);

						let variableObj = {};

						for (const [key, value] of entries) {
							variableObj[key] = value;
						}
						self.setVariableValues(variableObj);

						self.initActions();
						self.updateStatus(InstanceStatus.Ok);
					});
				}
			}
			catch(error) {
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Error obtaining Device Info from Roku Device.');
				self.log('error', 'Error obtaining Device Info from Roku Device.');
				console.log(error);
				self.stopTimer();
			}
		}
	},

	getAppsInfo: async function () {
		let self = this;

		if (self.config.host) {
			try {
				let url_apps = '/query/apps';

				let parseString = xml2js.parseString;

				let response = await axios.get('http://' + self.config.host + ':' + self.config.port + url_apps);

				if (response) {
					let xml = response.data;

					parseString(xml, function (err, result) {
						self.Apps = [];
						
						for (let i = 0; i < result.apps.app.length; i++) {
							let appObj = {};
							appObj.id = result.apps.app[i]['$'].id;
							appObj.label = result.apps.app[i]['_'];
							self.Apps.push(appObj);
						}

						self.initActions();
					});
				}
			}
			catch(error) {
				self.status(InstanceStatus.ConnectionFailure, 'Error obtaining Apps List from Roku Device.');
				self.log('error', 'Error obtaining Apps List from Roku Device.');
				self.stopTimer();
			}
		}
	},

	getActiveApp: async function () {
		let self = this;

		if (self.config.host) {
			try {
				let url_active_app = '/query/active-app';

				let parseString = xml2js.parseString;

				let response = await axios.get('http://' + self.config.host + ':' + self.config.port + url_active_app);

				if (response) {
					let xml = response.data;

					parseString(xml, function (err, result) {
						let nameValue = '';
						let idValue = '';

						if (result['active-app'].app[0]['_']) {
							nameValue = result['active-app'].app[0]['_'];
							idValue = result['active-app'].app[0]['$'].id;
						}
						else {
							nameValue = result['active-app'].app[0];
							idValue = 0;
						}

						//save active app as variable
						self.setVariableValues({'active-app': nameValue});
						self.ActiveAppID = idValue;
					});
				}
			}
			catch(error) {
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Error obtaining Active App from Roku Device.');
				self.log('error', 'Error obtaining Active App from Roku Device.');
				console.log(error);
				self.stopTimer();
			}
		}
	},

	stopTimer: function () {
		let self = this;
		
		if (self.Timer) {
			clearInterval(self.Timer);
			delete self.Timer;
		}
	},

	sendCommand: function (cmd) {
		let self = this;

		if (self.config.host) {
			try {
				let url =  'http://' + self.config.host + ':' + self.config.port + cmd;
				axios.post(url);
			}
			catch(error) {
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Error sending command to Roku Device.');
				self.log('error', 'Error sending command to Roku Device.');
				console.log(error);
			}
		}
	},

	sendString: function (literalString, pos) {
		let self = this;

		let character = literalString.charAt(pos);

		if (character) {
			//if we haven't gone past the length of the string, send the next character on a timeout of 50ms, and then send the next character after
			setTimeout(function () {
				let cmd = '/keypress/Lit_' + (character);
				self.sendCommand(cmd);
				self.sendString(literalString, pos++);
			}, 50);
		}
	}
}