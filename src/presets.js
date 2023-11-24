const { combineRgb } = require('@companion-module/base');

module.exports = {
	initPresets: function () {
		let self = this;

		let presets = [];

		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Home',
			style: {
				png64: self.ROKUICON_HOME,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Home'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Back',
			style: {
				png64: self.ROKUICON_BACK,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Back'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Instant Replay / Skip Back',
			style: {
				png64: self.ROKUICON_INSTANTREPLAY,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'InstantReplay'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Options',
			style: {
				png64: self.ROKUICON_INFO,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Info'
							}
					}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Left',
			style: {
				png64: self.ROKUICON_LEFT,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Left'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Right',
			style: {
				png64: self.ROKUICON_RIGHT,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Right'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Down',
			style: {
				png64: self.ROKUICON_DOWN,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Down'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Up',
			style: {
				png64: self.ROKUICON_UP,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Up'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Select / OK',
			style: {
				png64: self.ROKUICON_SELECT,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Select'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Rewind',
			style: {
				png64: self.ROKUICON_REW,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Rev'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Forward',
			style: {
				png64: self.ROKUICON_FWD,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Fwd'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Keys',
			name: 'Play / Pause',
			style: {
				png64: self.ROKUICON_PLAY,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'key',
							options: {
								keytype: 'keypress',
								keybutton: 'Play'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Volume',
			name: 'Volume Up',
			style: {
				png64: self.ROKUICON_VOLUMEUP,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'volume',
							options: {
								choice: 'up'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Volume',
			name: 'Volume Down',
			style: {
				png64: self.ROKUICON_VOLUMEDOWN,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'volume',
							options: {
								choice: 'down'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Volume',
			name: 'Volume Mute',
			style: {
				png64: self.ROKUICON_VOLUMEMUTE,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'volume',
							options: {
								choice: 'mute'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Power',
			name: 'Power On',
			style: {
				png64: self.ROKUICON_POWERON,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								choice: 'on'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});
		
		presets.push({
			type: 'button',
			category: 'Power',
			name: 'Power Off',
			style: {
				png64: self.ROKUICON_POWEROFF,
				pngalignment: 'center:center',
			},
			steps: [
				{
					down: [
						{
							actionId: 'power',
							options: {
								choice: 'off'
							}
						}
					],
					up: []
				}
			],
			feedbacks: []
		});

		self.setPresetDefinitions(presets);
	}
}