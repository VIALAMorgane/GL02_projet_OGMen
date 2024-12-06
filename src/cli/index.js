const questionsCommands = require("./questions");

// Enregistre les commandes liées aux questions.
function registerCommands(cli) {
  questionsCommands(cli); // Enregistre les commandes liées aux questions.
}

module.exports = { registerCommands };
