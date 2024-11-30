const questionsCommands = require("./questions");

/**
 * Enregistre toutes les commandes dans la CLI.
 * @param {Object} cli - Instance de Caporal CLI.
 */
function registerCommands(cli) {
  questionsCommands(cli); // Enregistre les commandes liées aux questions.
}

module.exports = { registerCommands };
