const { InstanceStatus } = require('@companion-module/base');

const xml2js = require('xml2js');

module.exports = {
	initConnection: function () {
		let self = this;

		//always clear any previous timer so settings changes never leave a stale one running
		self.stopTimer();

		if (!self.config.host || self.config.host === '') {
			self.updateStatus(InstanceStatus.BadConfig, 'No IP address set');
			return;
		}

		if (self.config.enable_feedbacks) {
			let interval = parseInt(self.config.poll_interval) || 30000;
			self.Timer = setInterval(self.getData.bind(self), Math.max(interval, 1000));
		}

		self.getData(); //get data immediately
	},

	getData: async function () {
		let self = this;

		//skip this round if the last one has not finished, so slow TVs don't pile up requests
		if (self.Polling) {
			return;
		}
		self.Polling = true;

		try {
			let results = await Promise.all([self.getDeviceInfo(), self.getAppsInfo(), self.getActiveApp()]);

			if (results.every((ok) => ok)) {
				self.updateStatus(InstanceStatus.Ok);
			}
			else {
				self.updateStatus(InstanceStatus.ConnectionFailure, 'Unable to read data from Roku Device.');
			}
		}
		finally {
			self.Polling = false;
		}
	},

	//fetches a query URL and returns the parsed XML, or throws
	queryXml: async function (path) {
		let self = this;

		let url = 'http://' + self.config.host + ':' + self.config.port + path;
		let response = await fetch(url, { signal: AbortSignal.timeout(5000) });

		if (!response.ok) {
			throw new Error('HTTP ' + response.status);
		}

		let xml = await response.text();
		return await xml2js.parseStringPromise(xml);
	},

	//each of these returns true on success, false on failure
	getDeviceInfo: async function () {
		let self = this;

		try {
			let result = await self.queryXml('/query/device-info');
			let info = result['device-info'];

			if (!info) {
				throw new Error('Unexpected device-info reply');
			}

			let entries = Object.entries(info);
			let newInfo = {};
			let variableObj = {};
			let variables = [{ name: 'Active App / Input', variableId: 'active-app' }];

			for (const [key, value] of entries) {
				let text = Array.isArray(value) ? value[0] : value;
				newInfo[key] = text;
				variableObj[key] = text;
				variables.push({ name: key, variableId: key });
			}

			let changed = JSON.stringify(newInfo) !== JSON.stringify(self.DEVICE_INFO);
			let newKeys = Object.keys(newInfo).join() !== Object.keys(self.DEVICE_INFO).join();
			self.DEVICE_INFO = newInfo;

			if (newKeys) {
				self.setVariableDefinitions(variables);
			}
			self.setVariableValues(variableObj);

			if (changed) {
				self.checkFeedbacks();
			}
			return true;
		}
		catch (error) {
			self.log('error', 'Error obtaining Device Info from Roku Device: ' + error.message + '. Will retry on next poll.');
			return false;
		}
	},

	getAppsInfo: async function () {
		let self = this;

		try {
			let result = await self.queryXml('/query/apps');

			let apps = [];
			let list = (result.apps && result.apps.app) || [];

			for (const app of list) {
				apps.push({ id: app['$'].id, label: app['_'] || app['$'].id });
			}

			//only rebuild actions and feedbacks when the app list actually changed
			if (JSON.stringify(apps) !== JSON.stringify(self.Apps)) {
				self.Apps = apps;
				self.initActions();
				self.initFeedbacks();
			}
			return true;
		}
		catch (error) {
			self.log('error', 'Error obtaining Apps List from Roku Device: ' + error.message + '. Will retry on next poll.');
			return false;
		}
	},

	getActiveApp: async function () {
		let self = this;

		try {
			let result = await self.queryXml('/query/active-app');
			let app = result['active-app'] && result['active-app'].app && result['active-app'].app[0];

			let nameValue = '';
			let idValue = 0;

			if (app && typeof app === 'object' && app['_']) {
				nameValue = app['_'];
				idValue = app['$'].id;
			}
			else if (typeof app === 'string') {
				nameValue = app;
			}

			self.setVariableValues({ 'active-app': nameValue });

			if (self.ActiveAppID !== idValue) {
				self.ActiveAppID = idValue;
				self.checkFeedbacks();
			}
			return true;
		}
		catch (error) {
			self.log('error', 'Error obtaining Active App from Roku Device: ' + error.message + '. Will retry on next poll.');
			return false;
		}
	},

	stopTimer: function () {
		let self = this;

		if (self.Timer) {
			clearInterval(self.Timer);
			delete self.Timer;
		}
	},

	sendCommand: async function (cmd) {
		let self = this;

		if (!self.config.host) {
			return;
		}

		try {
			let url = 'http://' + self.config.host + ':' + self.config.port + cmd;
			let response = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(5000) });

			if (!response.ok) {
				throw new Error('HTTP ' + response.status);
			}
			self.updateStatus(InstanceStatus.Ok);
		}
		catch (error) {
			self.updateStatus(InstanceStatus.ConnectionFailure, 'Error sending command to Roku Device.');
			self.log('error', 'Error sending command to Roku Device: ' + error.message);
		}
	},

	sendString: async function (literalString) {
		let self = this;

		//one character at a time, 50ms apart, in order
		for (const character of literalString) {
			await self.sendCommand('/keypress/Lit_' + encodeURIComponent(character));
			await new Promise((resolve) => setTimeout(resolve, 50));
		}
	}
}
