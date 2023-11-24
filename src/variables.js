module.exports = {
	initVariables: function () {
		let self = this;
		let variables = []

		variables.push({ variableId: 'active-app', name: 'Active App' });
		
		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		let variableObj = {};

		self.setVariableValues(variableObj);
	}
}