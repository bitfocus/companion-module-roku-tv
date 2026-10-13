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
				return String(self.ActiveAppID) === String(feedback.options.app);
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
					default: 'InputHDMI1',
					choices: self.CHOICES_INPUTS
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
				
				return !!selectedInput && self.ActiveAppID === selectedInput.queryid;
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
				let mode = self.DEVICE_INFO['power-mode'];
				return !!mode && String(mode).toLowerCase() === feedback.options.powermode.toLowerCase();
			}
		}

		self.setFeedbackDefinitions(feedbacks);
	}
}