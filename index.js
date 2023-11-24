const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base');
const UpgradeScripts = require('./src/upgrades');

const config = require('./src/config');
const actions = require('./src/actions');
const feedbacks = require('./src/feedbacks');
const variables = require('./src/variables');
const presets = require('./src/presets');

const api = require('./src/api');

class rokuInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...api,
		})
		
		this.Apps = [];
		this.SupportsFindRemote = false;
		this.ActiveAppID = null;
		this.Timer = undefined;

		this.DEVICE_INFO = {};
	}

	async destroy() {
		this.stopTimer();
	}

	async init(config) {
		this.configUpdated(config);
	}

	async configUpdated(config) {
		this.config = config;
		
		this.initActions();
		this.initFeedbacks();
		this.initVariables();
		this.initPresets();

		this.updateStatus(InstanceStatus.Connecting);

		this.initConnection();
	}
}

runEntrypoint(rokuInstance, UpgradeScripts);