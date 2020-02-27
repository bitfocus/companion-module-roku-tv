// Roku-Tv

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var Client = require('node-rest-client').Client;
var debug;
var log;

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
instance.prototype.Apps = [];
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

instance.prototype.init = function () {
	var self = this;

	debug = self.debug;
	log = self.log;

	//self.status(self.STATUS_OK);

	self.initFeedbacks();
	self.initVariables();
	self.initConnection();
};

instance.prototype.updateConfig = function (config) {
	var self = this;
	self.config = config;

	self.status(self.STATUS_OK);

	self.initFeedbacks();
	self.initVariables();
	self.initConnection();
};

instance.prototype.initConnection = function () {
	var self = this;

	//get all TV device information first and then build the actions array
	
	self.actions();
	
	setTimeout(initConnection, self.config.interval * 1000);
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
			type: 'number',
			id: 'interval',
			label: 'Update Interval',
			min: 10,
			max: 600,
			default: 60,
			tooltip: 'The interval at which the instance should fetch new data from the device.',
			required: true,
			range: true
		}
	]
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this;

	debug('destroy', self.id);
}

// Set up Feedbacks
instance.prototype.initFeedbacks = function () {
	var self = this;

	var feedbacks = {

	};

	self.setFeedbackDefinitions(feedbacks);
}

// Set up available variables
instance.prototype.initVariables = function () {
	var self = this;

	var variables = [
		
	];

	self.setVariableDefinitions(variables);
}

/**
 * Updates the dynamic variable and records the internal state of that variable.
 */
instance.prototype.updateVariable = function (name, value) {
	var self = this;

	self.setVariable(name, value);
}

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];

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
					default: 'on',
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
					id: 'key',
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
			cmd = '/keypress/' + options.input;
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
			cmd = '/' + options.keytype + '/' + options.key;
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
		self.system.emit('rest', 'http://' + self.config.host + ':' + self.config.port + cmd, body, function (err, result) {
			if (err !== null) {
				self.log('error', 'Roku TV Command Send Failed (' + result.error.code + ')');
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
			
			self.system.emit('rest', 'http://' + self.config.host + ':' + self.config.port + cmd, body, function (err, result) {
				if (err !== null) {
					self.log('error', 'Roku TV Command Send Failed (' + result.error.code + ')');
					self.status(self.STATUS_ERROR, result.error.code);
				}
				else {
					self.status(self.STATUS_OK);
				}
			});
		}
	}
}

instance_skel.extendedBy(instance);
exports = module.exports = instance;
