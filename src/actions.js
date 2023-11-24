module.exports = {
	initActions: function () {
		let self = this;

		let actions = {};

		actions.power = {
			name: 'Power On/Off',
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
			],
			callback: function (action) {
				let opt = action.options;

				if (opt.choice === 'on') {
					self.sendCommand('/keypress/PowerOn');
				}
				else {
					self.sendCommand('/keypress/PowerOff');
				}
			}
		};

		actions.input = {
			name: 'Change Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					choices: self.CHOICES_INPUTS
				}
			],
			callback: function (action) {
				let opt = action.options;

				self.sendCommand('/keypress/' + opt.input);
			}
		};

		actions.app = {
			name: 'Launch App',
			options: [
				{
					type: 'dropdown',
					label: 'App',
					id: 'app',
					choices: self.Apps
				}
			],
			callback: function (action) {
				let opt = action.options;

				self.sendCommand('/launch/' + opt.app);
			}
		};

		actions.volume = {
			name: 'Volume Up/Down',
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
			],
			callback: function (action) {
				let opt = action.options;

				if (opt.choice === 'up') {
					self.sendCommand('/keypress/VolumeUp');
				}
				else if (opt.choice === 'down') {
					self.sendCommand('/keypress/VolumeDown');
				}
				else {
					self.sendCommand('/keypress/VolumeMute');
				}
			}
		};

		actions.key = {
			name: 'Key Down/Up/Press',
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
					choices: self.CHOICES_KEYS
				}
			],
			callback: function (action) {
				let opt = action.options;

				self.sendCommand('/' + opt.keytype + '/' + opt.keybutton);
			}
		};

		actions.literal = {
			name: 'Keyboard Search',
			options: [
				{
					type: 'textinput',
					label: 'String',
					id: 'literalstring',
					default: ''
				}
			],
			callback: async function (action) {
				let opt = action.options;

				let literalString = await self.parseVariablesInString(opt.literalstring);

				if (literalString.length > 0) {
					self.sendString(literalString, 0);
				}
			}
		};

		actions.find_remote = {
			name: 'Find Remote',
			callback: function (action) {
				self.sendCommand('/keypress/FindRemote');
			}
		};

		actions.custom = {
			name: 'Send A Custom Command',
			options: [
				{
					type: 'textinput',
					label: 'Command',
					id: 'command',
					default: ''
				}
			],
			callback: function (action) {
				let opt = action.options;

				self.sendCommand(opt.command);
			}
		};

		self.setActionDefinitions(actions);
	}
}