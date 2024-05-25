const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module will control a Roku TV using the Roku ECP protocol.'
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				default: '',
				width: 6,
				regex: Regex.IP
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				default: 8060,
				width: 6,
				regex: Regex.Port
			},
			{
				type: 'checkbox',
				id: 'enable_feedbacks',
				label: 'Enable Feedbacks',
				default: true,
				width: 4,
				tooltip: 'If enabled, the module will query the device for the latest data.'
			},
			{
				type: 'number',
				id: 'poll_interval',
				label: 'Poll Interval (ms)',
				default: 30000,
				width: 4,
				min: 100,
				max: 60000,
				isVisible: config => config.enable_feedbacks
			}
		]
	},
}