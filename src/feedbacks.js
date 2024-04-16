const { combineRgb } = require('@companion-module/base');

module.exports = {
	initFeedbacks: function () {
		let self = this;

		let feedbacks = {};

		feedbacks['active-app'] = {
			type: 'boolean',
			name: 'Change Button Color If App is Active',
			description: 'If selected App is active, set the button to this color.',
			defaultStyle: {
				color: combineRgb(255,255,255),
				bgcolor: combineRgb(0,255,0)
			},
			options: [
				{
					type: 'dropdown',
					label: 'Active App',
					id: 'app',
					choices: self.Apps
				}
			],
			callback: function (feedback, bank) {
				if (self.ActiveAppID === feedback.options.app) {
					return true;
				}
				else {
					return false;
				}
			}
		};

		feedbacks['active-input'] = {
			type: 'boolean',
			name: 'Change Button Color If Input is Active',
			description: 'If selected Input is active, set the button to this color.',
			defaultStyle: {
				color: combineRgb(255,255,255),
				bgcolor: combineRgb(0,255,0)
			},
			options: [
				{
					type: 'dropdown',
					label: 'Active Input',
					id: 'input',
					choices: self.Inputs
				}
			],
			callback: function (feedback, bank) {
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
					return true;
				}
				else {
					return false;
				}
			}
		};

		feedbacks.powerMode = {
			type: 'boolean',
			name: 'Change Button Color If Power Mode is X',
			description: 'If selected Power Mode is active, set the button to this color.',
			defaultStyle: {
				color: combineRgb(255,255,255),
				bgcolor: combineRgb(0,255,0)
			},
			options: [
				{
					type: 'dropdown',
					label: 'Power Mode',
					id: 'powermode',
					default: 'PowerOn',
					choices: [
						{id: 'PowerOn', label: 'On'},
						{id: 'PowerOff', label: 'Off'},
						{id: 'Standby', label: 'Standby'},
						{id: 'Ready', label: 'Ready'},
						{id: 'Suspend', label: 'Suspend'},
					]
				}
			],
			callback: function (feedback, bank) {
				if (self.DEVICE_INFO['power-mode'].toLowerCase() == feedback.options.powermode.toLowerCase()) {
					return true;
				}
				else {
					return false;
				}
			}
		}

		self.setFeedbackDefinitions(feedbacks);
	}
}