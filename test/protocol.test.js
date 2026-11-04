const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const api = require('../src/api');
const actions = require('../src/actions');
const constants = require('../src/constants');
const config = require('../src/config');

test('Roku HTTP queries populate app and device state and actions send ECP commands', async (t) => {
	const requests = [];
	const replies = {
		'/query/device-info': '<device-info><model-name>Test Roku</model-name><power-mode>PowerOn</power-mode></device-info>',
		'/query/apps': '<apps><app id="12">Netflix</app></apps>',
		'/query/active-app': '<active-app><app id="12">Netflix</app></active-app>',
	};
	const server = http.createServer((req, res) => {
		requests.push([req.method, req.url]);
		res.end(replies[req.url] || '');
	});
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
	t.after(() => { server.closeAllConnections(); server.close(); });
	const values = {};
	const pending = [];
	const self = {
		...api, ...actions, ...constants,
		config: { host: '127.0.0.1', port: server.address().port },
		Apps: [], DEVICE_INFO: {},
		setVariableValues: (v) => Object.assign(values, v),
		setVariableDefinitions: (v) => { self.variables = v; },
		setActionDefinitions: (v) => { self.actions = v; },
		updateStatus: (v) => { self.status = v; },
		log: (level, message) => assert.fail(`${level}: ${message}`),
	};
	await self.getDeviceInfo();
	await self.getAppsInfo();
	await self.getActiveApp();
	assert.equal(self.DEVICE_INFO['model-name'], 'Test Roku');
	assert.equal(self.ActiveAppID, '12');
	assert.equal(values['active-app'], 'Netflix');
	assert.deepEqual(self.Apps, [{ id: '12', label: 'Netflix' }]);
	assert.ok(self.variables.some((v) => v.variableId === 'power-mode'));
	const send = self.sendCommand.bind(self);
	self.sendCommand = (cmd) => { const p = send(cmd); pending.push(p); return p; };
	self.actions.power.callback({ options: { choice: 'on' } });
	self.actions.input.callback({ options: { input: 'InputHDMI1' } });
	self.actions.app.callback({ options: { app: '12' } });
	self.actions.volume.callback({ options: { choice: 'mute' } });
	self.actions.key.callback({ options: { keytype: 'keydown', keybutton: 'Home' } });
	self.actions.find_remote.callback({ options: {} });
	self.parseVariablesInString = async (s) => s.replace('$(test:key)', 'Home');
	await self.actions.custom.callback({ options: { command: '/keypress/$(test:key)' } });
	// Exercise the real keyboard action's substitution boundary without starting the
	// stable release's known recursive keyboard sender (tracked separately in PR 51).
	self.sendString = (s, pos) => assert.deepEqual([s, pos], ['Home', 0]);
	await self.actions.literal.callback({ options: { literalstring: '$(test:key)' } });
	await Promise.all(pending);
	assert.deepEqual(requests.filter(([method]) => method === 'POST').map(([, path]) => path), [
		'/keypress/PowerOn', '/keypress/InputHDMI1', '/launch/12', '/keypress/VolumeMute',
		'/keydown/Home', '/keypress/FindRemote', '/keypress/Home',
	]);
});

test('poll interval visibility follows feedback setting', () => {
	const field = config.getConfigFields().find((f) => f.id === 'poll_interval');
	assert.equal(field.isVisible({ enable_feedbacks: true }), true);
	assert.equal(field.isVisible({ enable_feedbacks: false }), false);
});
