const cli = require("@caporal/core").default;
const { parseGiftDirectory } = require("./utils/parser");
const {
  readQuestions,
  saveQuestions,
  deleteQuestion,
  saveExam,
  removeDuplicateQuestions,
  detectQuestionType,
  createNewContact,
  findContact,
  deleteContact,
  displayContactInfos,
} = require("./utils/fileManager"); // importe les fonctions des autres fichiers utiles pour le CLI

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Importation automatique des questions avec détection des types
function importAllQuestions() {
  try {
    const dataPath = path.resolve(__dirname, "./data");
    if (!fs.existsSync(dataPath)) {
      console.error( // debug au cas ou le repertoire n'est pas trouvé
        "Le répertoire './data' est introuvable. Assurez-vous qu'il existe.",
      );
      return;
    }

    console.log("Importation des questions en cours...");

    // Lis les fichiers GIFT dans le répertoire
    const importedQuestions = parseGiftDirectory(dataPath);

    // Lis les questions existantes dans questions.json
    const existingQuestions = readQuestions();

    // Ajoute le type détecté pour chaque question
    const enrichedQuestions = importedQuestions.map((q) => ({
      ...q,
      type: detectQuestionType(q.text), // Détecte le type de question
    }));

    // Fusionne les questions en évitant les doublons
    const uniqueQuestions = [
      ...existingQuestions,
      ...enrichedQuestions.filter(
        (q) => !existingQuestions.some((eq) => eq.text === q.text),
      ),
    ];

    // Sauvegarder les questions dans questions.json
    saveQuestions(uniqueQuestions);

    console.log(
      `${uniqueQuestions.length - existingQuestions.length} nouvelles questions importées.`,
    );
  } catch (err) {
    console.error( // debug 
      `Erreur lors de l'importation automatique des questions : ${err.message}`,
    );
  }
}
 // Message de bienvenue avec la liste des commandes disponibles
function messageDebut() {
  console.log("Bienvenue dans Everywhere CLI !");
  console.log("Voici les commandes disponibles :");
  console.log(`
    1. questions list              - Affiche toutes les questions de la banque
    2. questions import            - Importe les questions depuis le répertoire ./data
    3. questions delete <title>    - Supprime une question par titre exact
    4. questions add --text <text> --type <type> - Ajoute une nouvelle question
    5. questions chart             - Génère un fichier HTML avec un graphique des types de questions
    6. exam generate               - Génère un examen contenant entre 15 et 20 questions
    7. exam export --id <id>       - Exporte un examen au format GIFT
    8. questions deduplicate       - Supprime les doublons dans les titres des questions
    9. contact create              - Créer votre carte contact
    10. contact update             - Modifier votre carte contact
    11. contact read               - Lire les informations à propos d'un contact
    12. contact delete             - Supprimer votre contact
    13. visualize exam             - Permet de visualiser un examen avec un diagrame en barre
    `);
}
// Enregistre les commandes CLI
function registerQuestionCommands(cli) {
  // COMMANDE QUESTION LIST POUR AFFICHER TOUTES LES QUESTIONS
  cli
    .command("questions list", "Affiche toutes les questions de la banque")
    .action(({ logger }) => {
      const questions = readQuestions();
      if (questions.length === 0) {
        logger.info("Aucune question trouvée.");
      } else { // Affiche les questions
        logger.info(`Nombre total de questions : ${questions.length}`);
        questions.forEach((question, index) => {
          logger.info(`${question.title}`); 
          logger.info(`   Texte : ${question.text}`);
        });
      }
    });
    // COMMANDE QUESTION IMPORT POUR IMPORTER LES QUESTIONS
  cli
    .command(
      "questions import",
      "Importe les questions depuis le répertoire ./data",
    )
    .action(({ logger }) => {
      try {
        importAllQuestions(); // utilise la fonction d'importation automatique
        logger.info("Importation des questions terminée.");
      } catch (err) {
        logger.error(
          `Erreur lors de l'importation des questions : ${err.message}`,
        );
      }
    });
// COMMANDE QUESTION DELETE POUR SUPPRIMER UNE QUESTION
    cli.command("questions delete", "Supprime une question de la banque par titre exact")
    .option("--title <title>", "Titre de la question à supprimer", { required: true })
    .action(({ logger, options }) => {
        const { title } = options; // Extrait les titres seulement des questions

        try {
            // lecture unique des questions pour ne pas réimporter a chaque fois toutes les questions
            const questions = readQuestions();

            
            const questionIndex = questions.findIndex(q => q.title === title);

            if (questionIndex !== -1) {
                // Supprime la question
                questions.splice(questionIndex, 1);

                // Sauvegarde uniquement après suppression
                saveQuestions(questions);

                logger.info(`La question "${title}" a été supprimée avec succès.`);
            } else {
                logger.warn(`Aucune question avec le titre exact "${title}" n'a été trouvée.`);
            }
        } catch (error) { // debug
            logger.error(`Erreur lors de la suppression de la question : ${error.message}`);
        }
    });
// COMMANDE QUESTION CHART POUR GENERER UN GRAPHIQUE DES TYPES DE QUESTIONS
        const fs = require("fs");
const path = require("path");
cli
  .command("questions chart", "Génère un fichier HTML avec un graphique des types de questions")
  .action(async ({ logger }) => {
    const rl = readline.createInterface({ // Interface readline pour poser une question à l'utilisateur
      input: process.stdin,
      output: process.stdout
    });

    logger.info("Voulez-vous générer un graphique des types de questions pour un fichier spécifique ? (O/N)");
// Demande à l'utilisateur s'il veut générer un graphique
    const userResponse = await new Promise((resolve) =>
      rl.question("Réponse : ", resolve)
    );

    rl.close();

    if (userResponse.toLowerCase() !== 'o') {
      logger.info("Opération annulée.");
      return;
    }

    try {
      const questions = readQuestions();

      if (questions.length === 0) {
        logger.warn("Aucune question disponible pour générer un graphique.");
        return;
      }

      // Compter les types de questions
      const typeCounts = {};
      questions.forEach((q) => {
        const type = q.type || "Unknown"; // Mets le type de la question à "Unknown" si le type est manquant
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const labels = Object.keys(typeCounts); // Les types de questions
      const counts = Object.values(typeCounts); // Le nombre de chaque type

      // Spécification Vega-Lite
      const vegaLiteSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: "Distribution des types de questions dans la banque",
        data: {
          values: labels.map((label, index) => ({
            type: label,
            count: counts[index]
          }))
        },
        mark: "bar",
        encoding: {
          x: { field: "type", type: "nominal", axis: { title: "Type de Question" } },
          y: { field: "count", type: "quantitative", axis: { title: "Nombre de Questions" } },
          color: { field: "type", type: "nominal" }
        }
      };

      // Générer la page HTML avec Vega-Lite
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Distribution des Types de Questions</title>
    <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
    <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
</head>
<body>
    <h1>Distribution des Types de Questions</h1>
    <div id="chart"></div>
    <script type="text/javascript">
        const spec = ${JSON.stringify(vegaLiteSpec)};
        vegaEmbed('#chart', spec);
    </script>
</body>
</html>
`;

      // Sauvegarder la page HTML
      const outputFilePath = path.join(__dirname, "./cli/chart.html");
      fs.writeFileSync(outputFilePath, htmlContent);
// Message de confirmation a travers un logger
      logger.info(`Graphique généré avec succès : ${outputFilePath}`);
    } catch (error) {
      logger.error("Une erreur est survenue.");
      logger.error(error.message);
    }
  });

// COMMANDE QUESTION ADD POUR AJOUTER UNE NOUVELLE QUESTION
  cli
    .command("questions add", "Ajoute une nouvelle question à la banque")
    .option("--text <text>", "Texte de la question", { required: true })
    .option("--type <type>", "Type des réponses", { required: true }) // Correction : suppression de l'espace
    .action(({ logger, options }) => {
      const { text, type } = options; // Extraire `text` et `type` des options

      try {
        const questions = readQuestions();

        // Générer automatiquement le titre
        const newIndex = questions.length + 1;
        const title = `Question ${newIndex}`;

        // Créer la nouvelle question
        const newQuestion = { title, text, type };

        // Ajouter à la liste des questions
        questions.push(newQuestion);

        // Sauvegarder les questions
        saveQuestions(questions);

        logger.info(`La question "${title}" a été ajoutée avec succès.`);
      } catch (error) {
        logger.error(
          `Erreur lors de l'ajout de la question : ${error.message}`,
        );
      }
    });

    // COMMANDE QUESTION DEDUPLICATE POUR SUPPRIMER LES DOUBLONS
  cli
    .command("questions search <keyword>", "Recherche une question par mot-clé")
    .action(({ logger, args }) => {
      const keyword = args.keyword.toLowerCase();
      const questions = readQuestions();
      // Filtre les questions par mot-clé
      const filteredQuestions = questions.filter((q) =>
        q.text.toLowerCase().includes(keyword),
      );

      if (filteredQuestions.length === 0) {
        logger.info(
          `Aucune question trouvée contenant le mot-clé : "${keyword}".`,
        );
      } else {
        logger.info(`Questions trouvées pour le mot-clé "${keyword}" :`);
        filteredQuestions.forEach((question, index) => {
          logger.info(`Question ${index + 1} : ${question.title}`);
          logger.info(`   Texte : ${question.text}`);
        });
      }
    });
// COMMANDE EXAM GENERATE POUR GENERER UN EXAMEN
  cli
    .command(
      "exam generate",
      "Génère un examen contenant entre 15 et 20 questions",
    )
    .option("--count <count>", "Nombre de questions (entre 15 et 20)", { // ajout de l'option du nombre de questions entre 15 et 20
      required: false,
      validator: cli.NUMBER,
    })
    .option("--keyword <keyword>", "Mot-clé pour filtrer les questions", { // ajout de l'option de filtre des questions par mot-clé
      required: false,
    })
    .action(({ logger, options }) => {
      const count = options.count || 15; // Par défaut, 15 questions
      const keyword = options.keyword ? options.keyword.toLowerCase() : null;

      if (count < 15 || count > 20) {
        logger.error("Le nombre de questions doit être entre 15 et 20.");
        return;
      }

      try {
        const questions = readQuestions();

        if (questions.length < count) { // Vérifie si le nombre de questions est suffisant
          logger.error(
            `Pas assez de questions disponibles pour générer un examen. Questions disponibles : ${questions.length}`,
          );
          return;
        }

        // Filtre les questions par mot-clé, si c'est spécifié
        const filteredQuestions = keyword
          ? questions.filter((q) => q.text.toLowerCase().includes(keyword)) 
          : questions;

        if (filteredQuestions.length < count) {
          logger.error(
            `Pas assez de questions correspondant au mot-clé "${keyword}". Questions disponibles : ${filteredQuestions.length}`,
          );
          return;
        }

        // Mélange les questions pour les sélectionner aléatoirement
        const shuffledQuestions = filteredQuestions.sort(
          () => 0.5 - Math.random(),
        );
        // Sélectionne les premières questions pour l'examen
        const selectedQuestions = shuffledQuestions.slice(0, count);

        // creation de l'examen avec l'id, la date et les questions
        const exam = {
          id: `exam_${Date.now()}`,
          date: new Date().toISOString(), 
          questions: selectedQuestions,
        };

        // Sauvegarde de l'examen
        saveExam(exam);

        logger.info(`Examen généré avec succès ! ID de l'examen : ${exam.id}`);
      } catch (error) {
        logger.error(
          `Erreur lors de la génération de l'examen : ${error.message}`,
        );
      }
    });
// COMMANDE EXAM EXPORT POUR EXPORTER UN EXAMEN
  cli
    .command("exam export", "Exporte un examen spécifique au format GIFT")
    .option("--id <id>", "ID de l'examen à exporter", { required: true })
    .action(({ logger, options }) => {
      const examId = options.id;

      try {
        // Lis tous les examens
        const examsFilePath = path.join(__dirname, "./data/exams.json");
        if (!fs.existsSync(examsFilePath)) {
          logger.error(
            "Aucun fichier exams.json trouvé. Créez d'abord un examen avec 'exam generate'.",
          );
          return;
        }
        
        const exams = JSON.parse(fs.readFileSync(examsFilePath, "utf-8"));

        // Recherche l'examen par ID
        const selectedExam = exams.find((exam) => exam.id === examId);

        if (!selectedExam) {
          logger.warn(`Aucun examen trouvé avec l'ID : ${examId}`);
          return;
        }

        // Convertis les questions de l'examen en format GIFT
        const giftContent = selectedExam.questions
          .map((q) => `::${q.title}:: ${q.text} {}`)
          .join("\n\n");

            // Nomme automatiquement le fichier avec l'ID de l'examen
            const outputPath = path.join(__dirname, `./examen/${examId}.gift`);

        // Écris dans le fichier de sortie
        fs.writeFileSync(outputPath, giftContent);
        logger.info(
          `Examen exporté avec succès dans le fichier : ${outputPath}`,
        );
      } catch (error) {
        logger.error(`Erreur lors de l'exportation : ${error.message}`);
      }
    });
// COMMANDE QUESTION DEDUPLICATE POUR SUPPRIMER LES DOUBLONS
  cli
    .command(
      "questions deduplicate",
      "Supprime les doublons dans les titres des questions",
    )
    .action(({ logger }) => {
      const result = removeDuplicateQuestions(); // utilise la fonction de suppression des doublons

      if (result) {
        logger.info("Les doublons ont été supprimés avec succès.");
      } else {
        logger.warn("Aucun doublon n'a été trouvé.");
      }
    });
// COMMANDE CONTACT
  cli.command("", "Commande par défaut").action(({ logger }) => {
    logger.info("Bienvenue dans Everywhere CLI !");
    logger.info(
      "Utilisez 'questions list', 'questions import', ou 'questions search <keyword>'.",
    );
  });

  //Ajout de la commande de création de contacts
  cli
    .command("contact create", "Créer votre carte contact")
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      //Récolte des informations pour créer la vCard
      logger.info("Veuillez saisir vos informations");

      const questions = ["Prénom : ", "Nom : ", "Téléphone : ", "Email : "];

      const answers = {};

      for (const question of questions) {
        const answer = await new Promise((resolve) =>
          rl.question(question, resolve),
        );
        const key = question.split(" : ")[0].toLowerCase();
        answers[key] = answer;
      }

      rl.close();

      //mise en forme des informations pour la création de la vCard
      const contactInfo = {
        firstName: answers.prénom,
        lastName: answers.nom,
        phone: answers.téléphone,
        email: answers.email,
      };

      //creation de la vCard
      const success = createNewContact(contactInfo);

      //gestion des potentielles erreurs
      if (success) {
        logger.info("Contact créé avec succès !");
      } else {
        logger.error("Échec de la création du contact.");
      }
    });

  //Ajout de la commande de modification dee contact
  cli
    .command("contact update", "Modifier votre carte contact")
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      //Identification pour modifier la vCard
      logger.info(
        "Veuillez saisir votre prénom et votre nom pour modifier votre carte :",
      );

      const questions = ["Prénom : ", "Nom : "];

      const answers = {};

      for (const question of questions) {
        const answer = await new Promise((resolve) =>
          rl.question(question, resolve),
        );
        const key = question.split(" : ")[0].toLowerCase();
        answers[key] = answer;
      }

      rl.close();

      const contactName = {
        firstName: answers.prénom,
        lastName: answers.nom,
      };

      //Recherche du contact existant dans les fichiers
      const found = findContact(contactName);

      if (found) {
        logger.info(
          "Contact trouvé avec succès !\nSaisissez les nouvelles informations",
        );
        //Si le contact est trouvé, suppression du contact existant
        deleteContact(contactName);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        //Création d'un nouveau contact pour rentrer les noucelles informations
        const questions = ["Prénom : ", "Nom : ", "Téléphone : ", "Email : "];

        const answers = {};

        for (const question of questions) {
          const answer = await new Promise((resolve) =>
            rl.question(question, resolve),
          );
          const key = question.split(" : ")[0].toLowerCase();
          answers[key] = answer;
        }

        rl.close();

        const contactInfo = {
          firstName: answers.prénom,
          lastName: answers.nom,
          phone: answers.téléphone,
          email: answers.email,
        };

        const success = createNewContact(contactInfo);
        if (success) {
          logger.info("Contact modifié avec succès !");
        } else {
          logger.error("Échec de la modification du contact.");
        }
        //Si aucun contact n'est trouvé, renvoi d'un message d'erreur
      } else {
        logger.error("Contact non trouvé, veuillez créer votre carte");
      }
    });

  //Ajout de la commande pour obtenir les informations sur un contact
  cli
    .command("contact read", "Afficher les informations à propos d'un contact")
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      //Demande d'informations pour trouver la carte
      logger.info(
        "Veuillez saisir le prénom et le nom du contact à afficher :",
      );

      const questions = ["Prénom : ", "Nom : "];

      const answers = {};

      for (const question of questions) {
        const answer = await new Promise((resolve) =>
          rl.question(question, resolve),
        );
        const key = question.split(" : ")[0].toLowerCase();
        answers[key] = answer;
      }

      rl.close();

      const contactName = {
        firstName: answers.prénom,
        lastName: answers.nom,
      };
      //Afficahge des informations du contact depuis le fichier vcf
      displayContactInfos(contactName);
    });

  //Ajout de la commande de suppression d'un contact
  cli
    .command("contact delete", "Supprimer votre contact")
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      //Identification avant suppression
      logger.info(
        "Veuillez saisir votre prénom et votre nom pour supprimer votre carte :",
      );

      const questions = ["Prénom : ", "Nom : "];

      const answers = {};

      for (const question of questions) {
        const answer = await new Promise((resolve) =>
          rl.question(question, resolve),
        );
        const key = question.split(" : ")[0].toLowerCase();
        answers[key] = answer;
      }

      rl.close();

      const contactName = {
        firstName: answers.prénom,
        lastName: answers.nom,
      };
      //Suppression du fichier vcf
      const success = deleteContact(contactName);

      //gestion des potentielles erreurs
      if (success) {
        logger.info("Votre carte contact a bien été supprimée");
      } else {
        logger.error("Vous n'avez pas encore de carte contact");
      }
    });

// COMMANDE VISUALIZE EXAM POUR VISUALISER LES DONNEES D'UN EXAMEN
    cli
      .command("visualize exam", "Visualiser un profil d'examen GIFT")
      .action(async ({ logger }) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
    
        logger.info("Veuillez saisir l'ID de l'examen pour visualiser le profil :");
    // Demande à l'utilisateur de saisir l'ID de l'examen
        const examId = await new Promise((resolve) =>
          rl.question("ID de l'examen : ", resolve)
        );
    
        rl.close();
    // Génère un graphique des types de questions pour un examen spécifique
        try {
          const examsPath = './data/exams.json';
    
          if (!fs.existsSync(examsPath)) {
            logger.error('Fichier exams.json introuvable.');
            return;
          }
    
          const exams = JSON.parse(fs.readFileSync(examsPath, 'utf-8'));
          const selectedExam = exams.find((exam) => exam.id === examId);
    
          if (!selectedExam) {
            logger.error("Examen introuvable !");
            return;
          }
    // Compte les types de questions pour les ajouter a chaque type trouvé
          let multipleChoice = 0;
          let shortAnswer = 0;
          let essay = 0;
          let fill = 0;
          let unknown = 0;
    
          selectedExam.questions.forEach((question) => {
            const { type } = question;
    
            if (type === "Multiple Choice") multipleChoice += 1;
            else if (type === "Short Answer") shortAnswer += 1;
            else if (type === "Essay") essay += 1;
            else if (type === "Fill") fill += 1;
            else unknown += 1;
          });
    
          // Spécification Vega-Lite
          const vegaLiteSpec = {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "Profil des types de questions d'un examen",
            data: {
              values: [
                { type: "Multiple Choice", count: multipleChoice },
                { type: "Short Answer", count: shortAnswer },
                { type: "Essay", count: essay },
                { type: "Fill", count: fill },
                { type: "Unknown", count: unknown }
              ]
            },
            mark: "bar",
            encoding: {
              x: { field: "type", type: "nominal", axis: { title: "Type de Question" } },
              y: { field: "count", type: "quantitative", axis: { title: "Nombre" } },
              color: { field: "type", type: "nominal" }
            }
          };
    
          // Génére une page HTML
          const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Profil des Questions</title>
      <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
      <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
    </head>
    <body>
      <div id="chart"></div>
      <script type="text/javascript">
        const spec = ${JSON.stringify(vegaLiteSpec)};
        vegaEmbed('#chart', spec);
      </script>
    </body>
    </html>
    `;
    
          // Sauvegarde la page HTML
          const outputFilePath = path.join(__dirname, "./cli/exam-chart.html");
          fs.writeFileSync(outputFilePath, htmlContent);
    
          logger.info(`Graphique généré avec succès : ${outputFilePath}`);
        } catch (error) {
          logger.error("Une erreur est survenue.");
          logger.error(error.message);
        }
      });
    
  
}

// Importation automatique des questions au démarrage
importAllQuestions();

// Enregistre les commandes pour les questions entrées par l'utilisateur
registerQuestionCommands(cli);

// Vérifie les arguments reçus
console.log("Arguments reçus par le CLI :", process.argv);

// Lancement du CLI

const args = process.argv.slice(2);
if (args.length === 0) {
  messageDebut();
} else {
  cli.run(args).catch((err) => {
    // gestion des bugs
    console.error(`Erreur CLI : ${err.message}`);
  });
}
