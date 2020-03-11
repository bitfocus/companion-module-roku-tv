// Roku-Tv

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var Client = require('node-rest-client').Client;
var debug;
var log;

const xml2js = require('xml2js');

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	return self;
}

instance.prototype.Inputs = [
	{id: 'InputTuner', label: 'TV Tuner'},
	{id: 'InputHDMI1', label: 'HDMI 1'},
	{id: 'InputHDMI2', label: 'HDMI 2'},
	{id: 'InputHDMI3', label: 'HDMI 3'},
	{id: 'InputHDMI4', label: 'HDMI 4'},
	{id: 'InputAV1', label: 'AV 1'}
];

instance.prototype.Apps = [];

instance.prototype.SupportsFindRemote = false;

instance.prototype.Keys = [
	{id: 'Home', label: 'Home'},
	{id: 'Rev', label: 'Rewind'},
	{id: 'Fwd', label: 'Forward'},
	{id: 'Play', label: 'Play / Pause'},
	{id: 'Select', label: 'Select'},
	{id: 'Left', label: 'Left'},
	{id: 'Right', label: 'Right'},
	{id: 'Down', label: 'Down'},
	{id: 'Up', label: 'Up'},
	{id: 'Back', label: 'Back'},
	{id: 'InstantReplay', label: 'Instant Replay / Skip Back'},
	{id: 'Info', label: 'Info'},
	{id: 'Backspace', label: 'Backspace'},
	{id: 'Search', label: 'Search'},
	{id: 'Enter', label: 'Enter / OK'},
	{id: 'ChannelUp', label: 'Channel Up'},
	{id: 'ChannelDown', label: 'Channel Down'}	
];

instance.prototype.ActiveAppID = null;

instance.prototype.Timer = undefined;

instance.prototype.Variables = [
	{
		label: 'Active App / Input',
		name: 'active-app'
	}
];

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	//self.status(self.STATUS_OK);

	self.initConnection();
};

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;

	self.status(self.STATUS_OK);

	self.initConnection();
};

instance.prototype.initConnection = function () {
	var self = this;
	
	var parseString = xml2js.parseString;
	
	let url_deviceinfo = '/query/device-info';
	let url_apps = '/query/apps';
	
	if (self.config.host) {
		//get all TV device information first and then build the actions array
		self.getRest(url_deviceinfo, self.config.host, self.config.port)
		.then(function(arrResult) {
			if (arrResult[2].error) {
				//throw an error
				self.status(self.STATUS_ERROR, arrResult[2]);
				self.StopTimer();
			}
			else {
				let xml = arrResult[2];
				parseString(xml, function (err, result) {					
					let entries = Object.entries(result['device-info']);
					
					self.Variables = [
						{
							label: 'Active App / Input',
							name: 'active-app'
						}
					];
					
					for (const [key, value] of entries) {
						let variableObj = {};
						variableObj.label = key;
						variableObj.name = key;
						self.Variables.push(variableObj);
					}
					
					self.setVariableDefinitions(self.Variables);
					
					for (const [key, value] of entries) {
						self.setVariable(key, value);
					}	
				});
				
				self.status(self.STATUS_OK);
			}
		})
		.catch(function(arrResult) {
			self.status(self.STATUS_ERROR, arrResult);
			self.log('error', arrResult[0] + ':' + arrResult[1] + ' ' + arrResult[2]);
			self.StopTimer();
		});
		
		self.getRest(url_apps, self.config.host, self.config.port)
		.then(function(arrResult) {
			if (arrResult[2].error) {
				//throw an error
				self.status(self.STATUS_ERROR, arrResult[2]);
				self.StopTimer();
			}
			else {
				let xml = arrResult[2];
				parseString(xml, function (err, result) {
					self.Apps = [];
					
					for (let i = 0; i < result.apps.app.length; i++) {
						let appObj = {};
						appObj.id = result.apps.app[i]['$'].id;
						appObj.label = result.apps.app[i]['_'];
						self.Apps.push(appObj);
					}
					
					//export actions now that we have the list of apps
					self.actions();
				});
				
				self.status(self.STATUS_OK);
			}
		})
		.catch(function(arrResult) {
			self.status(self.STATUS_ERROR, arrResult);
			self.log('error', arrResult[0] + ':' + arrResult[1] + ' ' + arrResult[2]);
			self.StopTimer();
		});
		
		if (self.config.enable_feedbacks) {
			if (self.Timer === undefined) {
				self.Timer = setInterval(self.getActiveApp.bind(self), 30000);	
			}
			self.initFeedbacks();
		}
		
		self.getActiveApp();
		
		self.initPresets();
	}
};

instance.prototype.getActiveApp = function () {
	var self = this;
	
	let url_active_app = '/query/active-app';
	
	var parseString = xml2js.parseString;
	
	self.getRest(url_active_app, self.config.host, self.config.port)
	.then(function(arrResult) {
		if (arrResult[2].error) {
			//throw an error
			self.status(self.STATUS_ERROR, arrResult[2]);
			self.StopTimer();
		}
		else {
			let xml = arrResult[2];
			parseString(xml, function (err, result) {
				let nameValue = '';
				let idValue = '';
				
				if (result['active-app'].app[0]['_']) {
					nameValue = result['active-app'].app[0]['_'];
					idValue = result['active-app'].app[0]['$'].id;
				}
				else {
					value = result['active-app'].app[0];
					idValue = 0;
				}

				//save active app as variable
				self.setVariable('active-app', nameValue);
				self.ActiveAppID = idValue;
				
				self.checkFeedbacks('active-app');
				self.checkFeedbacks('active-input');
			});
			
			self.status(self.STATUS_OK);
		}
	})
	.catch(function(arrResult) {
		self.status(self.STATUS_ERROR, arrResult);
		self.log('error', arrResult[0] + ':' + arrResult[1] + ' ' + arrResult[2]);
		self.StopTimer();
	});
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will control a Roku TV using the Roku ECP protocol.'
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			default: '192.168.1.2',
			width: 6,
			regex: self.REGEX_IP
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			default: 8060,
			width: 4,
			regex: self.REGEX_PORT
		},
		{
			type: 'checkbox',
			id: 'enable_feedbacks',
			label: 'Enable Feedbacks',
			default: true,
			tooltip: 'If enabled, the module will query the device every 30 seconds for the latest data.'
		}
	]
}

instance.prototype.StopTimer = function () {
	var self = this;
	
	if (self.Timer) {
		clearInterval(self.Timer);
		delete self.Timer;
	}
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;
	
	self.StopTimer();

	debug('destroy', self.id);
}

// Set up Feedbacks
instance.prototype.initFeedbacks = function () {
	var self = this;

	// feedbacks
	var feedbacks = {};

	feedbacks['active-app'] = {
		label: 'Change Button Color If App is Active',
		description: 'If selected App is active, set the button to this color.',
		options: [
			{
				type: 'dropdown',
				label: 'Active App',
				id: 'app',
				choices: self.Apps
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,255,0)
			},
		]
	};
	
	feedbacks['active-input'] = {
		label: 'Change Button Color If Input is Active',
		description: 'If selected Input is active, set the button to this color.',
		options: [
			{
				type: 'dropdown',
				label: 'Active Input',
				id: 'input',
				choices: self.Inputs
			},
			{
				type: 'colorpicker',
				label: 'Foreground color',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background color',
				id: 'bg',
				default: self.rgb(0,255,0)
			},
		]
	};

	self.setFeedbackDefinitions(feedbacks);
}

instance.prototype.feedback = function(feedback, bank) {
	var self = this;
	
	if (feedback.type === 'active-app') {
		if (self.ActiveAppID === feedback.options.app) {
			return { color: feedback.options.fg, bgcolor: feedback.options.bg };
		}
	}
	
	if (feedback.type === 'active-input') {
		let inputTranslationArray = [
			{id: 'InputTuner', queryid: 'tvinput.dtv'},
			{id: 'InputHDMI1', queryid: 'tvinput.hdmi1'},
			{id: 'InputHDMI2', queryid: 'tvinput.hdmi2'},
			{id: 'InputHDMI3', queryid: 'tvinput.hdmi3'},
			{id: 'InputHDMI4', queryid: 'tvinput.hdmi4'},
			{id: 'InputAV1', queryid: 'tvinput.cvbs'}
		]
		
		let selectedInput = inputTranslationArray.find( ({ id }) => id === feedback.options.input);
		
		if (self.ActiveAppID === selectedInput.queryid) {
			return { color: feedback.options.fg, bgcolor: feedback.options.bg };
		}
	}

	return {};
}

instance.prototype.initPresets = function () {
	var self = this;
	var presets = [];

	presets.push({
		category: 'Keys',
		label: 'Home',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_HOME,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Home'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Back',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_BACK,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Back'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Instant Replay / Skip Back',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_INSTANTREPLAY,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'InstantReplay'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Options',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_INFO,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Info'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Left',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_LEFT,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Left'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Right',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_RIGHT,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Right'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Down',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_DOWN,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Down'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Up',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_UP,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Up'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Enter / OK',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_SELECT,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Enter'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Rewind',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_REW,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Rev'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Forward',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_FWD,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Fwd'
			}
		}]
	});
	
	presets.push({
		category: 'Keys',
		label: 'Play / Pause',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_PLAY,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'key',
			options:{
				keytype: 'keypress',
				keybutton: 'Play'
			}
		}]
	});
	
	presets.push({
		category: 'Volume',
		label: 'Volume Up',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_VOLUMEUP,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'volume',
			options:{
				choice: 'up'
			}
		}]
	});
	
	presets.push({
		category: 'Volume',
		label: 'Volume Down',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_VOLUMEDOWN,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'volume',
			options:{
				choice: 'down'
			}
		}]
	});
	
	presets.push({
		category: 'Volume',
		label: 'Volume Mute',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_VOLUMEMUTE,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'volume',
			options:{
				choice: 'mute'
			}
		}]
	});
	
	presets.push({
		category: 'Power',
		label: 'Power On',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_POWERON,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'power',
			options:{
				choice: 'on'
			}
		}]
	});
	
	presets.push({
		category: 'Power',
		label: 'Power Off',
		bank: {
			style: 'png',
				text: '',
				png64: self.ROKUICON_POWEROFF,
				pngalignment: 'center:center',
				size: '18',
				color: '16777215',
				bgcolor: self.rgb(0,0,0)
		},
		actions: [{
			action: 'power',
			options:{
				choice: 'off'
			}
		}]
	});

	self.setPresetDefinitions(presets);
}

instance.prototype.actions = function (system) {
	var self = this;
	
	let actionsArray = {
		'power': {
			label: 'Power On/Off',
			options: [
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'choice',
					default: 'on',
					choices: [
						{id: 'on', label: 'On'},
						{id: 'off', label: 'Off'}
					]
				}
			]
		},
		'input': {
			label: 'Change Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					choices: self.Inputs
				}
			]
		},
		'app': {
			label: 'Launch App',
			options: [
				{
					type: 'dropdown',
					label: 'App',
					id: 'app',
					choices: self.Apps
				}
			]
		},
		'volume': {
			label: 'Volume Up/Down',
			options: [
				{
					type: 'dropdown',
					label: 'Up/Down',
					id: 'choice',
					default: 'up',
					choices: [
						{id: 'up', label: 'Up'},
						{id: 'down', label: 'Down'},
						{id: 'mute', label: 'Mute'}
					]
				}
			]
		},
		'key': {
			label: 'Key Down/Up/Press',
			options: [
				{
					type: 'dropdown',
					label: 'Type',
					id: 'keytype',
					default: 'keypress',
					choices: [
						{id: 'keydown', label: 'Key Down'},
						{id: 'keyup', label: 'Key Up'},
						{id: 'keypress', label: 'Key Press'}
					]
				},
				{
					type: 'dropdown',
					label: 'Key',
					id: 'keybutton',
					choices: self.Keys
				}
			]
		},
		'literal': {
			label: 'Keyboard Search',
			options: [
				{
					type: 'textinput',
					label: 'String',
					id: 'literalstring',
					default: ''
				}
			]
		},
		'find_remote': {
			label: 'Find Remote'
		},
		'custom': {
			label: 'Send A Custom Command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: ''
				}
			]
		}
	};
	
	//now remove the options this device doesn't support (find_remote, inputs, channel up/down, volume, poweroff, etc.)

	self.system.emit('instance_actions', self.id, actionsArray);
}

instance.prototype.action = function (action) {
	var self = this;
	var options = action.options;
	
	var cmd = null;
	
	switch(action.action) {
		case 'power':
			if (options.choice === 'on') {
				cmd = '/keypress/PowerOn';	
			}
			else {
				cmd = '/keypress/PowerOff';
			}
			break;
		case 'input':
			cmd = '/keypress/' + options.input;
			break;
		case 'app':
			cmd = '/launch/' + options.app;
			break;
		case 'volume':
			if (options.choice === 'up') {
				cmd = '/keypress/VolumeUp';	
			}
			else if (options.choice === 'down') {
				cmd = '/keypress/VolumeDown';	
			}
			else {
				cmd = '/keypress/VolumeMute';
			}
			break;
		case 'key':
			cmd = '/' + options.keytype + '/' + options.keybutton;
			break;
		case 'find_remote':
			cmd = '/keypress/FindRemote';
			break;
		case 'custom':
			cmd = action.options.command;
			break;
		default:
			break;
	};
	
	if (cmd !== null) {
		self.system.emit('rest', 'http://' + self.config.host + ':' + self.config.port + cmd, {}, function (err, result) {
			if (err !== null) {
				self.log('error', 'Roku TV Command Failed (' + result.error.code + ')');
				self.status(self.STATUS_ERROR, result.error.code);
			}
			else {
				self.status(self.STATUS_OK);
			}
		});	
	}
	
	if (action.action === 'literal') {
		for (var i = 0; i < options.literalstring.length; i++) {
			cmd = '/keypress/Lit_' + (options.literalstring.charAt(i));
			
			self.system.emit('rest', 'http://' + self.config.host + ':' + self.config.port + cmd, {}, function (err, result) {
				if (err !== null) {
					self.log('error', 'Roku TV Command Failed (' + result.error.code + ')');
					self.status(self.STATUS_ERROR, result.error.code);
				}
				else {
					self.status(self.STATUS_OK);
				}
			});
		}
	}
}

instance.prototype.getRest = function(cmd, host, port) {
	var self = this;
	return self.doRest('GET', cmd, host, port, {});
};

instance.prototype.postRest = function(cmd, host, port, body) {
	var self = this;
	return self.doRest('POST', cmd, host, port, body);
};

instance.prototype.doRest = function(method, cmd, host, port, body) {
	var self = this;
	var url = self.makeUrl(cmd, host, port);

	return new Promise(function(resolve, reject) {

		function handleResponse(err, result) {
			if (err === null && typeof result === 'object' && result.response.statusCode === 200) {
				// A successful response

				var objJson = result.data;
				
				resolve([ host, port, objJson ]);

			} else {
				// Failure. Reject the promise.
				var message = 'Unknown error';

				if (result !== undefined) {
					if (result.response !== undefined) {
						message = result.response.statusCode + ': ' + result.response.statusMessage;
					} else if (result.error !== undefined) {
						// Get the error message from the object if present.
						message = result.error;
					}
				}

				reject([ host, port, message ]);
			}
		}

		switch(method) {
			case 'POST':
				self.system.emit('rest', url, body, function(err, result) {
					handleResponse(err, result);
				});
				break;

			case 'GET':
				self.system.emit('rest_get', url, function(err, result) {
					handleResponse(err, result);
				});
				break;

			default:
				throw new Error('Invalid method');
		}
	});
};

instance.prototype.makeUrl = function(cmd, host, port) {
	var self = this;

	if (cmd[0] !== '/') {
		throw new Error('cmd must start with a /');
	}

	return 'http://' + host + ':' + port + cmd;
};

//icons
instance.prototype.ROKUICON_HOME = "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";
instance.prototype.ROKUICON_REW = "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";
instance.prototype.ROKUICON_FWD = "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";
instance.prototype.ROKUICON_PLAY = "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";
instance.prototype.ROKUICON_SELECT = "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";
instance.prototype.ROKUICON_LEFT = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAADTUlEQVR4nO2a70tTURjHv/fulxUURNNMErHWL1ubKUQSEaFt0IsgCKvpH9LfERSFRBpFQYRIDjF6aWSJ4qvoXcTCcrnd/br3bt7txrnTmf16NHe3U5zPm23nxTj78DzPOc9zJ92+ETVRXdj3FVdeJQDyyuuP/GqNO5w2bEiy6Xvrgvy//BC7EIIIhCACIYhACCIQggiEIAIhiEAIIhCCCIQgAiGIQAgiEIIIhCACLgQZy0XoqoGiUeJgN+upu6CCbqClfTdOXzyEPft2olTkS1JdJ3951UC7vwnhwZNwuZ1o9Xnx9OYryI567mo9dYsgXTPQdsyL0EBZDkPN5GGi2iPyrVGXCNLVZfgCzei73gm3p7yFjKJi6vk7OBx8nRs1F6TnluELNuNChEVOOZfiMQXjwzPIKjqcLo7yq9Ypxk6qA4Em9F3rrMhJLal48Xge6SWNOzmoZQRZcvyNCEW61tIqqeLZrSlkU3m4G/h8UlSTXa3KCQ92VyJnMabg5ZN5S87qGo/YLiivGWg/3ojQQFdFREbRMDEyi2Q8B882vp8x2ro7o1BE21EvwoNracUKcnRkFpmEyr0c2FmkTdOE0+PAucv+ipxcWsfkozko8RycHKfV99h6ipUME9m0Xvns8jixy7sDJQ57rt9hmyBJkqwomnw4h/inlLXGIqm3P4iOnlarNv0L2BpBDqeMrKIhOjyDeKwsqWG7G739AfgCe60bNe/YflFkaZVOqBgbmkbyS8Zak2XZOtVOnGmDlitwragmN2nWjGrZAsaG3uDrQtpaY9F19lIHjnS3WCMPXqlZq8FOrVRCxfi9t1j6XJbEWotwpAsHg83Qcnym22YEbXkOwYp0Oqlh9M7rSuGWZAl9V4Pw9+znsnDXfLbAbtNqOo+JB7MVSSwFz18JWDduNn7liY0KquoUixVuJZ79qXCfCh2Gyde8bMOCqv6PVCaJFe7Ru9NY+JCw1lhEmZwZ2kwzVHVJrEiz9iN6f8Ya2C/GUnBxNhOqe7fIJOV1Ax/fx633rGjzBBfttCxLkD18dvbiySqBEEQgBBEIQQRCEIEQRCAEEQhBBEIQgRBEIAQRCEEEQhCBEEQgBBHYPYT50/x0q7PVzUzW/m4KB+AbirwKknlwgrUAAAAASUVORK5CYII=";
instance.prototype.ROKUICON_RIGHT = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAADUUlEQVR4nO2a70sUQRjHv7u3d7d7P/bu1LMsKd9F+EKMTCPoTSSRIvqqKCISKeo/6C/pdWiWBFFvykOJkBACf11mFmodSV51GSVY92NvL2auLk1pzLtd52A+cLA3t8cOH5555pmZlW5cf5jD9vmf/xbzHIK0zd+KQrGw08Xcyw1yOXbaToQgBkIQAyGIgRDEQAhiIAQxEIIYCEEMhCAGQhADIYiBEMRACGIgBDHgTlDOzCGTMmCaxe6vlQauBBE5isuBfQfCcKsKjEx2x/tU7I5iSclksjjeVY/65v2Ix75gsHcCqytJKE5HqR+V2+puKFcRJEkSwnsD9LqmrgKdl5uh+Vx0yFnAlsYwZ4KAZ5HXME2Tfg/t8qOjpxnBsM8KSeUXQWQovXnxCY/vRpFJ54WQiDp14RA8uhuZtP05ibtZzK0pmB5dxNCdKZq08UtS55UW6CEN6dJE0pZPWLisgzSvE/NTcQzeGi/MZJW7dbR1NyFQ4YFhYyRxWyi6VAWvxt5j5MEMskY+J1XV6OjoOZJP3GlLEvcGuK6kNa8Lz5/GEOkb35C49QqPVbPbOrhfaqgeJ+aiHzA8EEXye5q2hWsDOH3xMHxBrRBdVlEWazGSuGdG32F4YKqQpEnibj3fSGunXM66ZUnZLFZlRca3xOq6YeXTVciKtUf+ZSGIzFrBsBet5xrh1VXaRiLpyb1pGKksjSKr4GotthmpHwZCYS+6rh2FP6jRO4icwd5xxGYTdPhZCdeCSOVcXavjxJmGghzSRmY1UnGrHuu7z60gIsIXcKO9uwn+kIe2kcghcham7ZEDXgWlkwaq9uhou7RGTtJApN9eOeAxSZOlhV6p4eTZBgQq83JINA3dnsRC9KOtcsBbBJGij1TIXVdb4A/+GVZD/ZOYi8ahep2294kvQVkTx9oPrpPz6OYY3s4maEW9E/C1YQYJHr+bXpPFaKRvArGXCagWT+X/gqsIcigSRu7PoK6+Gkvzy1icW4bb5pzzN1wJkh0yPi+tIB77CsUp0S2PnYa7ad6hyPTDC+JklYEQxEAIYiAEMRCCGAhBDIQgBkIQAyGIgRDEQAhiIAQxEIIYCEEMhCAG3J+srmGzNxRIG3m94/dbq+R12NKdQwP4CSSUA81HSmGOAAAAAElFTkSuQmCC";
instance.prototype.ROKUICON_UP = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAENUlEQVR4nO2a/28TZRzH3/el1/bmunZzW6HU2sFSBMfYDzqJYZ384DAhMWEm/MBf4m/+F/4XijFRMTHABAWmW4A52OZkaKcGYWDX9u5638zzXEuYBh9DvLv98HklzbW7a3fPa5/n/XmuO+nD9z/zQTwTmdT8OyRIAAkSQIIEkCABJEgACRJAggSQIAEkSAAJEkCCBJAgAbtLkLQLzuFv7BpBdttF23DgeT6kXSRKjfOXMxGu68N1PKR1DbIqodWw4PuAqip8GzexCWJyPNeHZTgolHMYnyoj1aNhbXETy/M1eI4DLaXGLikWQYEcD0bTwZ6RLKqzhzFc7Of7hotZyIqMW1d+Rtt0kEjGWuTRZ1BXjtV0sHcki7dOjz2Rw0jpGt489QpemzkANSFzSXFmUqSCunJMJudAP068dwT5UiCnbdowGm3+PJnWcOzkQRytjvAp1rbikxSdIB7IgZzCaD+mZ49gqJjjuxzbxcLFdVz46CYeP2gEh0sSJqb24+jUy/Dc+CRFMsF5t3I8WC0H+0YHUJ19FUOFPr6Ptfebl+/i2vk1tOomfM/H8XcPI5PTeWhPzlTAcvrG3AaXpCWjDe7wK6jTypmc4ugApmfHMFTI8l1MxvL1e7jy6W3+uu9FHXfma7j08RLqWy3+M5ZJx05WMF4tBZVkupFWUriCuq28ZaNYYZUzhsFO5TBWb2zi2hervLpSegKKKiP9goaV+Rrmzi2hWTf5cSyT3pg5iInpMnzfR9uKTlKogpgctjpmlVM9vVPOyuImLp9bRqtuQc8k+cDZ1FFUBeneJO58t4nrX67CMmx+fCqtYfLtCiaq5eBzLSeSSxPl1PGzH4TxwSwmbMPB0L4MTpwZx+DenXLm+DQykc5owcFPn5QiQ1Yk/LbxiF967CnloCQUqAkF+VKWd8I/fq3zKSrJ4VoKrYJc20VmQMfkO5Wdcr6vcTnbj0zofcl/yGGwamILRFmWsPDVOq6eX+HrIXSmG6uk/WN5+F6QY2ESniDHR3a4B+VD+c6ogaWr9/D1Jz9ge8tET4bJefbg2MCTPJckLFxYx7ef336SSVo6gXwpx6snbEGhtXlVlfHn/SZufbOBwUIGv6w9wOLFn2A0bfRkNF4lItjgNT0B23SweOkumnULh15/Caomo/bjQ25dUsKdYqHe3cG6E8sNvVdDfcuAa3u8Kv6LnB0nKUmw2w4cx0dvLs2rythuB4JCbmehLhRZ22YLwYe/N5BIKs8lB91M0lhI+2g8Nnj2aCmFZ1TYhL6SZhecCU3mcfM8croEb5WQSgenHNVqOpJLjf9zMFF/P0Rf2gsgQQJIkAASJIAECSBBAkiQABIkgAQJIEECSJAAEiSABAkgQQJIkAASJIAECSBBAkiQABIkgAQJIEECSJCAKO+x7f5Hi23Zw3tq24X9wZTONv777QH8BfpJobXXBElLAAAAAElFTkSuQmCC";
instance.prototype.ROKUICON_DOWN = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAEK0lEQVR4nO2aaW8TRxjH/3t6feCCExBSgkybkjjUIgq0JIhbSIFWrYB+m36SfgryqurBm9qREEdVTGSUNgHsHDgygQTbYO/hPdDOrq1QtZ1UdNf7Yn7Sytasd7Tz88wzs7MP9/13PzqIBu592AAs/7MHD4Db9cn55VwYdy1GRA78Bgv+ERn4KN1MFGGCKDBBFJggCkwQBSaIAhNEgQmiwARRYIIoMEEUmCAKTBAFJogCE0SBCaLABFFggigwQRSYIApMEAUmiAITRCE0QRznHf9nfWEQiiDbdqC2TWiqSV6gfkjjOI6DZdlQ212YXXsPV3wYgQtyHIc0av+hBFL749BUC13DImX/FfcavdMlL6mHDqcgyQIsM1hJgb56duU4toPs5EFMnf8YpmFj6cE6VkqbgGNCUkRyfi+4OjtvDcSTEqYvfYIjx4bxstZCqfAM7aYOQQrmvw5WkOWQYDH66RBGx4ZJ2cGRNJLpGEqFCpEjJySqJLfnuBLSGQWzX+WQn8kSY4ezGVSW6mhuq4EJCnSIcTxHGl9few1D7ZKyZFrBmS8ncfLyGCzTIUPG/d0/V8Kh3dKxL6Pg/PXPkJ/N9vM6qkt1NF60IYjBRezABXE88Kxcx/3by9BVg5TLiojZqxM4eWWMBPCubv59TOKATlPHvgMKLtzMY+LUaP/Uy80m7v+0jNZ2B4IUXEJI4EGaF3kSSB8WqnhwewW635PkuISZuXFMnTsKjcxI7wdu97v2xsBHQ3FPzvRI/5wrp3irjK3nLRLHgpzxg5/mHUCOieAFDqVilfQkze9JsbiE03PjyH0+AvWNDsu0/PUSh05LRyIdw7kbx9+XU2uiOF/GxpNtyHGv3iAJJYHKIZIEGJqFUqEK27Fx5moOsbhMYtKFG3mSXrbyew3xlIyuYUMQecxcG8f41F/k3PLkxJKSJyfg/LjQVtJEkiKAF4DF4hru/rwMreP1pHQmgYs388h9MYrmqw4pO/vNJI6fzvYD+FatgUJPTkKEEIIchJ2C5/jDzdBNLC6sktgxMzcBJSkjfSCBs19PEiGZQymybhL94Lv1vInCfBm1JzuIJd1hxZO6wiD0HMXdkh4trHoz2rWct9oeTuHytyfItN2Xs/EahfnHqD3dgRKyHAwqibMnSVdNPCpWyEg5dWmMxCQ3BvWor+2QnlOvNAYiB4Pc7vBikkgeOH/75Snu/PBHPya5vNjYwa/zZWxWGqEPq90MPA3YlWRoJh7fW4dt2Tg2PQKtbWBxoYr6apM8e7mz1SDkIAqC+j3JtPDnwxrWV17BNh2oHQMxf50zKDmISiK5K0AUBViWg7cNjcxk7lZG79wgiUymvSuC5zmyOg5jfbNXorcnHSE5YJv2dJggCkwQBSaIAhNEgQmiwARRYIIoMEEUmCAKTBAFJogCE/RvAHgH1PCHNRh4IBIAAAAASUVORK5CYII=";
instance.prototype.ROKUICON_BACK = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAEyElEQVR4nO2aW2gcVRzGv9mZndlN9oI1BUlMtTdqBC0KQrGgAfuiD94eBVEIqBiIiFYfYttoejE1qE99sIK+iaCGVhT60GAfxQoVHwRBTNuAKIhmd5NsdiczcnY729nZM3PO7JyZDHI+WJKdOTv/b37zP9c5yn0Hxm1I+Soj0QRLAmJIAmJIAmJIAmIoNYAUu/1Jm7Q0+HGD8YNkK4nZ6dKWA2JlDTlt2zf+8f42gfzfUkDccPzOW+ghp2TEptqWAYoK52YpzxGLryHjBZk4IDFgQK9zIeQG2UKlUIDZdrKA4sqaKOp4ogS2k8ygtMHh8WMlAYhnbMPXbCQDxwHjKFZAqa5SPpEsz7HYRhL/BziIK4NYcNbW6zA3N5HLGdBUPwvJtTebAeeEZhBrPkW61n9WKnjqicdw9swH2HnHDjSaTVpJoZ6C5A+nPXwXBohlxNq08G+1ionnnsGx6Tcw/tBBjO3bg0aj0WMqCU82E05bQqoYC07TtFBbX8Mrky9g8qUJaFo7rGmazjAtFe0NzUdkQCw49YaJZrOB6cNTmHj+WS5TcXriyRq3+gbEM75Z32hA1TS8e3QaTz/5eChjoj2FyRq3YunFSLjV+gZKA3mcmj2CQ4+MU8uR9qe2ugaFNg9iRMhmdejZm/bjgIM4AJFw5Ka3D92K0yeO4uCDB+jlbGDP7l149NDDMHJGqBiqquLatWX8fn0ZWkYVWqW86vvFodeU87VaW8XOO0fx3skZ7L/3nsBrmE0Tlm2FzqCMquKjs59g/sMzKBeL1DJRssYtIRnUCqcQOGu4+669mJ+bxd7du9jBs/2H91tlhEA4EAHImTLU6xt44P79mD/1DoaHb4t6Waby+Zyvn6hwMq6MjgTIPZ8iI+LRkeFE4LRiW70YosLJeKo6WXXseyRNlijck81SoYCFby7g5Nz7ntFxPFJcK/bOqJgOh2907sAhUJwPRM/F8oaBjz/9DG8dO45KpSLy0j3K3mi/RFYp2jq10G6eBCoWB/H5wtdYqVRx/O1pbB8a8i3/5cJ5LC1dhZbN0gv43F9W03Dlp59h5HOxwoH4cZANEmdbuYwLi5dQrdUwd2IGo7ePUEtfXLyEL859i2JxoNc4/FODHNYNA7quUz2EVdAbDkGAek3dUirh+8tXMDn1egvS2Ni+njKkJyqXiigMdgOKa1TslbdRppYJdcWQpkqFQfzy6294ceo1/HD5R66rJQWnE4/xfiwiILYpkh1//vU3Xp46jIuL3/mWYy62ReylvOLJHkQDxG9qIGegtl7Hq28ewVfnzneOk3Uhy7a5Frb84fQvnrerib0Xy+l6azA5M3say8t/YMfoCJauXkferweLqUqFVd+TVd534F6RjFmpVmGZFsqFQeiGTr1WcJWKrgwUKGqKMsgRqfvbiqXOdxqcqEsUTA9kZs25gJCqzQtxVamuBtlurzykcndHDxyPb1B6DYtvq0dgr9SCYYM7a9xKBFAXGMekc0Pdf1qyXWlEe9Dup+9UUWZG9Lmvqv9Fe48hv0a7A8cNhnUvXWkUXFj0jjKvhGUQDVh7Y5JTgL9hTJNiq2JxP9mkJDeSMyQBMSQBMSQBMSQBMSQBMSQBMSQBMSQBMSQBMSQBMSQBBQnAfzRasHEcQrw/AAAAAElFTkSuQmCC";
instance.prototype.ROKUICON_INSTANTREPLAY = "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";
instance.prototype.ROKUICON_INFO = "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";

instance.prototype.ROKUICON_VOLUMEUP = "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";
instance.prototype.ROKUICON_VOLUMEDOWN = "iVBORw0KGgoAAAANSUhEUgAAAEgAAAA6CAYAAAATBx+NAAAEpUlEQVR4nO2b208UVxzHvzOzF8CUvlaU6ltDbZs2fVEriAZFRAk0WCVuqqm2pIggiEsFAok20aRJfWj/h9ZG2pq26Y3G2kghlSqiYKnatKX1kogPFWTZy0xzZtl1gZk5M+zZmSE5n4Rk5/Y7M5/9nesswkurixVwdBG5GmO4IApcEAUuiAIXRIELosAFUeCCKHBBFDyuvjtGKPL8yYIgCqaCu0rQyy++gOqq7RgcuobT3WczWlaqNFWVoCFMUdwjaNOGInR2tGJJTg5KN5fg8uBV/H7rj4yXKyQ8KfOzTHFLBpWXlqCj7Qj8Pl9yX27uExktU6BM0clh2Q2CqraX4WiwGR5P5m6FtDezqpSBnISYBI4K2lldiSNNByGK8ztT0WQjahUrcuBkN79756u6cqwimYhBsshIuZYcOCUoUFON5sZ6QzmCVq+iQ0yW4fN56deQ4xqnxHTkwIkqtjewCw0HapnHDYcjJgTNSCLt0UxVi+meHD/B1gzavzeQlhyvl54lpjKPNNoCXQ7sFPR6zQ7U1e5LK0YkElGHAnoSFI2xjD4CtPuB2TGYVrHsLD+8Xh9kRYFEGkVBgChJqNxWhvq337QUS09CaHoaHsmDaCyqeZxIIpfSXAkiGU0LKUK0L2AmaEvJBtTXvYUsv08tivQZcUEinszNtRyPZEv+sjy0HDqgPuzX3/Xg255z6jEih8TWzxhhRhI9o0S1SdI/j5mgN/YEkLf0KVbh8GgqhEDNayhct1bdLipci8JXVuPdk++rWWT08PEsordF8SwyPodZG+T1e1mFUpE8EkZv3IAsP36CrVs2o721ydT11tojfZgJUmTKV2GRJdnZ+PTsVzgc7MDV4ZHkxeVlpVi/bg3Tsoxw/YLZ+d4+7Ks9iOGR68l9lRXltpW/KFYUozEZH53uTm7nL19manqxUETSucz8LZoVxfvj48nPHkliEnPuSqM4p2En87dFI6hkY3Hy852799T5FwsSXXxCztylWNdWsdRuekdVBSq2bU1u9/b1px0/NXv05MDNi/bhcBhPL8/DiWOdKCh4Jrn/77F/cOazL9OKnZBDssdIDlgKIsN/loSmw9gT2DVLzv3xB+g8dkIdKC6E1KxJHT0bveFgVsV+vTTIVJAkSbg4cBnRaFSddpz/qRd1DS0YujZi4mo6iV6KBrOv/b1TH2L4+ij8/viShCCI6vILmaxuLC7Cc6sKLMXLyc7CNz3nMPbvbUQjUYzevJX2PZp9F5YKM0GPQiGc+fwLzWNkRPzBqZN4ftWzpuMlpgpEupPY0ov99/Ah6hqDGLwy5OjDLgTbuvnJyUk0tLRjYOCSXUUywdZx0MTEBJqPdqGv/6KdxaaF7QNFIinYtngkOTKSnpyaQlNrh6EkRss5aePYVIOMlBtb2nDh5z7N46wWvNLF0bkYWVs+/E6XpiQrLw4zieOTVTJKbg524vsffpy1X5b131rZiStm8yST2ruO4+NPujEdDqP/lwH8NnrTBXcGuO6fWVauyMftO/fUNsoNuG6548+/xlxwF4/hv3KlwAVR4IIocEEUuCAKXBAFLogCF0SBC6LABVHggowA8D+qi3XuYKouDQAAAABJRU5ErkJggg==";
instance.prototype.ROKUICON_VOLUMEMUTE = "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";

instance.prototype.ROKUICON_POWERON = "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";
instance.prototype.ROKUICON_POWEROFF = "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";

instance_skel.extendedBy(instance);
exports = module.exports = instance;
