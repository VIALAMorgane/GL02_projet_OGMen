const cli = require("@caporal/core").default;
const { parseGiftDirectory } = require("./utils/parser");
const {
  readQuestions,
  saveQuestions,
  deleteQuestion,
  saveExam,
  readExam,
  readExams,
  removeDuplicateQuestions,
  detectQuestionType,
  createNewContact,
  findContact,
  deleteContact,
  displayContactInfos,
  searchQuestionById,
  searchExamById,
  searchExamsByDate,
} = require("./utils/fileManager"); // importe les fonctions des autres fichiers utiles pour le CLI

const fs = require("fs");
const path = require("path");
const readline = require('readline');

//Pour la simulation d'examen, permet de lire des entrées dans le terminal
const reader = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


// Importation automatique des questions avec détection des types
function importAllQuestions() {
  try {
    const dataPath = path.resolve(__dirname, "./data");
    if (!fs.existsSync(dataPath)) {
      console.error(
        // debug au cas ou le repertoire n'est pas trouvé
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
    console.error(
      // debug
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
    3. questions delete --title <title>    - Supprime une question par titre exact
    4. questions add --text <text> --type <type> - Ajoute une nouvelle question
    5. questions chart             - Génère un fichier HTML avec un graphique des types de questions
    6. exam generate               - Génère un examen contenant entre 15 et 20 questions
    7. exam export --id <id>       - Exporte un examen au format GIFT
    8. questions deduplicate       - Supprime les doublons dans les titres des questions
    9. contact create              - Créer votre carte contact
    10. contact update             - Modifier votre carte contact
    11. contact delete             - Supprimer votre contact
    12. visualize exam             - Permet de visualiser un examen avec un diagramme en barre
    13. visualizeExamTheme         - Visualiser un profil d'examen par theme en creant un diagramme en barre
    14. search contact             - Rechercher un contact par Nom
    15. search question            - Rechercher une question par ID
    16. search exam                - Rechercher un examen par ID ou date,
    17. simulate exam --id <id_exam>              - Simule un examen avec résultat 
    `);
}


// FONCTION POUR AFFICHER LES QUESTIONS D'UN EXAMEN
function askQuestion(questions, index = 0, score = 0) {
    // Si on a parcouru toutes les questions, on termine
    if (index >= questions.length) {
        console.log(`Quiz terminé ! Votre score final est : ${score} / ${questions.length}`);
        reader.close();
    }

    //REGEX pour trouver les reponses correctes des questions
    const regex = /(?<==)[^ ]+(?= ~)|(?<==).*?[.]|(?<==).*?(?=[.~])|(?<==).*?(?=[.}])|(?<==).*?(?=[.])/;
    
    let text = '';
    //Question courante
    const question = questions[index];

    //Si la question attend une réponse simple alors on la supprime de l'affichage
    if(question.type === 'Short Answer'){
        for (let i = 0; i < question.text.length; ++i) {
            if(question.text[i] === '{') {
                break;
            }
            text += question.text[i];
        }
    } else {
        text = question.text.replaceAll('~', ' ').replaceAll('=', ' ');
    }

    
    let goodAnswer = [];
    let answer = '';

    if(question.type === 'Unknown'){
      goodAnswer.push('unknown');
    } else {
      // Stocke les bonnes réponses de la question en cours
      let goodAnswerMatch = question.text.match(regex);

      for (let i = 0; i < goodAnswerMatch[0].length; ++i) {
        let char = goodAnswerMatch[0][i];

        if(goodAnswerMatch[0][i])
    
        if (char === '=' || char === '~' || char === '{' || char === '}' || char === '|' || char === '\n' || char === '\r') {
            if (answer.length > 0) {
                // Ajoute le mot en cours si non vide
                goodAnswer.push(answer);
                answer = ''; // Réinitialise le mot
            }
        } else {
            // Ajoute le caractère au mot en cours
            answer += char;
        }
      }
    
      // Ajoute le dernier mot si la chaîne ne se termine pas par un caractère spécial
      if (answer.length > 0) {
          goodAnswer.push(answer);
      }
    }

    // Pose la question à l'utilisateur
    reader.question(text + '\n' + 'Entrez votre réponse ici : ', (userAnswer) => {
        // Vérifie la réponse
        if (goodAnswer.indexOf(userAnswer) != -1) {
            ++score;
            console.log("Vous avez trouvé la bonne réponse !");
        } else {
            console.log("Votre réponse n'est pas correcte.");
        }

        // Passe à la question suivante
        askQuestion(questions, index + 1, score);
    });
}


// Enregistrer les commandes CLI
function registerQuestionCommands(cli) {
    cli.command("questions list", "Affiche toutes les questions de la banque")
        .action(({ logger }) => {
            const questions = readQuestions();
            if (questions.length === 0) {
                logger.info("Aucune question trouvée.");
            } else {
                logger.info(`Nombre total de questions : ${questions.length}`);
                questions.forEach((question, index) => {
                    logger.info(`${question.title}`);
                    logger.info(`   Texte : ${question.text}`);
                });
            }
        });

    //Commande qui permet d'afficher un examen en fonction de l'id entré en paramètre
    cli.command("simulate exam", "Affiche toutes les questions dun exam")

        //Option qui gère l'id séléctionné par l'utilisateur
        .option("--id <id>", "Id de l'examen choisi", { required: true }) 

        //Comportement de la commande
        .action(({ logger, options }) => {
            const { id } = options;

            //On lit notre fichier qui contient tous les exams
            const exams = readExam();

            const questionList = [];

            /* CODEX DES REGEX
            =.*?~|=.*?}
            =.*?[.]|=.*?(?=[.~])
            (?<==).*?[.]|(?<==).*?(?=[.~])
            (?<==).*?[.]|(?<==).*?(?=[.~])|(?<==).*?(?=[.}])
            (?<==)[^ ]+(?= ~)|(?<==).*?[.]|(?<==).*?(?=[.~])|(?<==).*?(?=[.}])|(?<==).*?(?=[.])
            */

            //Si il n'existe pas d'examen, alors rien ne se passe. On renvoit juste un string
            if (exams.length === 0) {
                logger.info("Aucun examen n'a encore été créé.");
            } else {

                //En revanche si un ou des examens ont été trouvé, alors on parcours la liste de tous les examens dans le fichier
                exams.forEach((exams) => {

                    //Et si un examen possède le même id que celui entré en paramètre par l'utilisateur
                    if(exams.id === id){

                        logger.info(exams.id);

                        //Alors on affiche toutes ses données
                        logger.info(`Id de l'examen : ${exams.id}`);
                        logger.info(`Date de création : ${exams.date}`);
                        logger.info(`Questions de l'examen :`);


                        //On parcours toutes les questions présentent dans l'examen choisi
                        exams.questions.forEach((exams) => {
                            questionList.push(exams)
                        })

                        askQuestion(questionList, 0, 0);

                        //Return false permet ici de casser la boucle de parcours des examens. Every est comme un forEach sauf que c'est arrêtable à souhait
                        return false;
                    }
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
  cli
    .command(
      "questions delete",
      "Supprime une question de la banque par titre exact",
    )
    .option("--title <title>", "Titre de la question à supprimer", {
      required: true,
    })
    .action(({ logger, options }) => {
      const { title } = options; // Extrait les titres seulement des questions

      try {
        // lecture unique des questions pour ne pas réimporter a chaque fois toutes les questions
        const questions = readQuestions();

        const questionIndex = questions.findIndex((q) => q.title === title);

        if (questionIndex !== -1) {
          // Supprime la question
          questions.splice(questionIndex, 1);

          // Sauvegarde uniquement après suppression
          saveQuestions(questions);

          logger.info(`La question "${title}" a été supprimée avec succès.`);
        } else {
          logger.warn(
            `Aucune question avec le titre exact "${title}" n'a été trouvée.`,
          );
        }
      } catch (error) {
        // debug
        logger.error(
          `Erreur lors de la suppression de la question : ${error.message}`,
        );
      }
    });

  // COMMANDE QUESTION CHART POUR GENERER UN GRAPHIQUE DES TYPES DE QUESTIONS
  cli
    .command(
      "questions chart",
      "Génère un fichier HTML avec un graphique des types de questions",
    )
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        // Interface readline pour poser une question à l'utilisateur
        input: process.stdin,
        output: process.stdout,
      });

      logger.info(
        "Voulez-vous générer un graphique des types de questions pour un fichier spécifique ? (O/N)",
      );
      // Demande à l'utilisateur s'il veut générer un graphique
      const userResponse = await new Promise((resolve) =>
        rl.question("Réponse : ", resolve),
      );

      rl.close();

      if (userResponse.toLowerCase() !== "o") {
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
              count: counts[index],
            })),
          },
          mark: "bar",
          encoding: {
            x: {
              field: "type",
              type: "nominal",
              axis: { title: "Type de Question" },
            },
            y: {
              field: "count",
              type: "quantitative",
              axis: { title: "Nombre de Questions" },
            },
            color: { field: "type", type: "nominal" },
          },
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

// COMMANDE SEARCH QUESTION POUR RECHERCHER UNE QUESTION PAR ID
    cli
    .command("search question", "Rechercher une question par numéro")
    .action(async ({ logger }) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      // Demande à l'utilisateur de saisir le numéro de la question
      const question = await new Promise((resolve) =>
        rl.question("Entrez le numéro de la question : ", resolve),
      );
      rl.close();
// Recherche de la question par ID
      const questionId = parseInt(question, 10);
      const foundQuestion = searchQuestionById(questionId - 1);
// Affiche les informations de la question trouvée
      if (foundQuestion) {
        logger.info(`Question trouvée :`);
        logger.info(`Titre : ${foundQuestion.title}`);
        logger.info(`Texte : ${foundQuestion.text}`);
        logger.info(`Thème : ${foundQuestion.theme}`);
        logger.info(`Type : ${foundQuestion.type}`);
      } else {
        logger.warn(`Aucune question trouvée avec le numéro : ${questionId}`);
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
    .option("--count <count>", "Nombre de questions (entre 15 et 20)", {
      // ajout de l'option du nombre de questions entre 15 et 20
      required: false,
      validator: cli.NUMBER,
    })
    .option("--keyword <keyword>", "Mot-clé pour filtrer les questions", {
      // ajout de l'option de filtre des questions par mot-clé
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

        if (questions.length < count) {
          // Vérifie si le nombre de questions est suffisant
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
        const nbExam = readExams();
        // creation de l'examen avec l'id, la date et les questions
        const exam = {
          id: `exam_${nbExam.length + 1}`,
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

// COMMANDE EXAM SEARCH POUR RECHERCHER DES INFOS SUR DES EXAMENS
    cli
    .command(
      "search exam",
      "Rechercher un examen par ID ou afficher tous les examens créés après une certaine date",
    )
    .action(async ({ logger }) => { 
      const rl = readline.createInterface({ // Interface readline pour poser une question à l'utilisateur
        input: process.stdin,
        output: process.stdout,
      });
// Demande à l'utilisateur de choisir entre rechercher par ID ou par date
      const choice = await new Promise((resolve) =>
        rl.question(
          "Voulez-vous rechercher un examen par ID (1) ou afficher tous les examens créés après une certaine date (2) ? ",
          resolve,
        ),
      );
// Si l'utilisateur choisit 1,recherche par ID sinon recherche par date
      if (choice === "1") {
        const examId = await new Promise((resolve) =>
          rl.question("Entrez l'ID de l'examen : ", resolve),
        );
        const exam = searchExamById(examId);

        if (exam) {
          logger.info(`Examen trouvé :`);
          logger.info(`ID : ${exam.id}`);
          logger.info(`Date : ${exam.date}`);
          exam.questions.forEach((question, index) => {
            logger.info(`Question ${index + 1} :`);
            logger.info(`Titre : ${question.title}`);
            logger.info(`Texte : ${question.text}`);
          });
        } else {
          logger.warn(`Aucun examen trouvé avec l'ID : ${examId}`);
        }
      } else if (choice === "2") {
        const date = await new Promise((resolve) =>
          rl.question("Entrez la date (YYYY-MM-DD) : ", resolve),
        );
        const examsAfterDate = searchExamsByDate(date);
// Affiche les examens créés après la date spécifiée
        if (examsAfterDate.length > 0) {
          logger.info(`Examens créés après la date ${date} :`);
          examsAfterDate.forEach((exam) => {
            logger.info(`ID : ${exam.id}`);
            logger.info(`Date : ${exam.date}`);
            exam.questions.forEach((question, index) => {
              logger.info(`Question ${index + 1} :`);
              logger.info(`Titre : ${question.title}`);
              logger.info(`Texte : ${question.text}`);
            });
          });
        } else {
          logger.warn(`Aucun examen créé après la date : ${date}`);
        }
      } else {
        logger.warn("Choix invalide.");
      }

      rl.close();
    });
}

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
    .command(
      "search contact",
      "Afficher les informations à propos d'un contact",
    )
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
        output: process.stdout,
      });

      logger.info(
        "Veuillez saisir l'ID de l'examen pour visualiser le profil :",
      );
      // Demande à l'utilisateur de saisir l'ID de l'examen
      const examId = await new Promise((resolve) =>
        rl.question("ID de l'examen : ", resolve),
      );

      rl.close();
      // Génère un graphique des types de questions pour un examen spécifique
      try {
        const examsPath = "./data/exams.json";

        if (!fs.existsSync(examsPath)) {
          logger.error("Fichier exams.json introuvable.");
          return;
        }

        const exams = JSON.parse(fs.readFileSync(examsPath, "utf-8"));
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
              { type: "Unknown", count: unknown },
            ],
          },
          mark: "bar",
          encoding: {
            x: {
              field: "type",
              type: "nominal",
              axis: { title: "Type de Question" },
            },
            y: {
              field: "count",
              type: "quantitative",
              axis: { title: "Nombre" },
            },
            color: { field: "type", type: "nominal" },
          },
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

// COMMANDE VISUALIZE EXAM THEME POUR VISUALISER LES THEMES D'UN EXAMEN
cli
.command("visualizeExamTheme", "Visualiser un profil d'examen par theme")
.action(async ({ logger }) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  logger.info("Veuillez saisir l'ID de l'examen pour visualiser le profil :");

  const examId = await new Promise((resolve) =>
    rl.question("ID de l'examen : ", resolve)
  );

  rl.close();

  try {
    const examsPath = './data/exams.json';

    if (!fs.existsSync(examsPath)) {
      logger.error('Fichier exams.json introuvable.');
      return;
    }
// On recupere les données de l'examen
    const exams = JSON.parse(fs.readFileSync(examsPath, 'utf-8'));
    const selectedExam = exams.find((exam) => exam.id === examId);

    if (!selectedExam) {
      logger.error("Examen introuvable !");
      return;
    }
// on initialise les variables pour chaque theme 
    let Review = 0;
    let GraExpressionOfQuantity= 0;
    let Voc= 0;
    let GraSubjectVerbAgreement= 0;
    let Reading= 0;
    let Passive= 0;
    let a4= 0;
    let Ultimate= 0;
    let Adverbs= 0;
    let ReadingCoachella= 0;
    let GraPresentTensesHabits= 0;
    let GraIngOrInf= 0;
    let GraEdAdjectivesPrepositions= 0;
    let GRPresentPerfectVsPastSimple= 0;
    let GraPresentPerfectSimpleVsContinuous= 0;
    let GraAsLike= 0;
    let UoEHygge= 0;
    let ReadingXmen= 0;
    let Listening= 0;
    let GR1ExpressionOfQuantity= 0;
    let SubjectVerbAgreement= 0;
    let UseOfEnglish= 0;
    let ReadingTheDeathOfCooking= 0;
    let GR4PassiveReporting= 0;
    let Futureforms= 0;
    let GRFutureforms
    let FuturePerfectAndContinuous= 0;
    let VocExpressionWithGet= 0;
    let ProgressTest2= 0;
    let SoSuchTooEnough= 0;
    let RelativeClauses= 0;
    let a6= 0;
    let ItIsThereIs= 0;
    let VocLinkingWords= 0;
    let ThirdCond= 0;
    let MixedConditionals= 0;
    let unknown = 0;

    
    selectedExam.questions.forEach((question) => {
      const { theme } = question;
  // On incrémente le compteur pour chaque theme trouvé
      if (theme === "Review" || theme ==="Review-3") Review += 1;
      else if (theme === "Gra-Expression_of_quantity") GraExpressionOfQuantity += 1;
      else if (theme === "Voc") Voc += 1;
      else if (theme === "Gra-Subject_verb_agreement") GraSubjectVerbAgreement += 1;
      else if (theme === "Reading") Reading += 1;
      else if (theme === "Passive") Passive += 1;
      else if (theme === "a4") a4 += 1;
      else if (theme === "Ultimate") Ultimate += 1;
      else if (theme === "Adverbs") Adverbs += 1;
      else if (theme === "ReadingCoachella") ReadingCoachella += 1;
      else if (theme === "Gra-Present-tenses_habits") GraPresentTensesHabits += 1;
      else if (theme === "Gra-Ing_ot_inf") GraIngOrInf += 1;
      else if (theme === "gra-ed_adjectives_prepositions") GraEdAdjectivesPrepositions += 1;
      else if (theme === "GR-Present_perfect_vs_past_simple") GRPresentPerfectVsPastSimple += 1;
      else if (theme === "Gra-Present_perfect_simple_vs_continuous") GraPresentPerfectSimpleVsContinuous += 1;
      else if (theme === "Gra-As_like") GraAsLike += 1;
      else if (theme === "UoE-Hygge") UoEHygge += 1;
      else if (theme === "Reading-xmen") ReadingXmen += 1;
      else if (theme === "Listening") Listening += 1;
      else if (theme === "GR1-Expression_of_quantity") GR1ExpressionOfQuantity += 1;
      else if (theme === "Subject_verb_agreement") SubjectVerbAgreement += 1;
      else if (theme === "Use_of_English") UseOfEnglish += 1;
      else if (theme === "Reading-The_death_of_cooking") ReadingTheDeathOfCooking += 1;
      else if (theme === "GR4-Passive-reporting") GR4PassiveReporting += 1;
      else if (theme === "Future-forms") Futureforms += 1;
      else if (theme === "GR-Future_forms") GRFutureforms += 1;
      else if (theme === "Future-perfect-&-continuous") FuturePerfectAndContinuous += 1;
      else if (theme === "Voc-Expressions_with_get") VocExpressionWithGet += 1;
      else if (theme === "ProgressTest2") ProgressTest2 += 1;
      else if (theme === "So,such,too,enough") SoSuchTooEnough += 1;
      else if (theme === "Relative_clauses") RelativeClauses += 1;
      else if (theme === "6") a6 += 1;
      else if (theme === "It is,there is") ItIsThereIs += 1;
      else if (theme === "Voc-Linking_words") VocLinkingWords += 1;
      else if (theme === "Third_cond-4") ThirdCond += 1;
      else if (theme === "Mixed_conditionals") MixedConditionals += 1;
      else unknown += 1;
  });

    // Spécification Vega-Lite
    const vegaLiteSpec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: "Profil des types de questions d'un examen",
      data: {
        values: [
          { type: "Review", count: Review },
          { type: "Gra-Expression_of_quantity", count: GraExpressionOfQuantity },
          { type: "Voc", count: Voc },
          { type: "Gra-Subject_verb_agreement", count: GraSubjectVerbAgreement },
          { type: "Reading", count: Reading },
          { type: "Passive", count: Passive },
          { type: "a4", count: a4 },
          { type: "Ultimate", count: Ultimate },
          { type: "Adverbs", count: Adverbs },
          { type: "ReadingCoachella", count: ReadingCoachella },
          { type: "Gra-Present-tenses_habits", count: GraPresentTensesHabits },
          { type: "Gra-Ing_ot_inf", count: GraIngOrInf },
          { type: "gra-ed_adjectives_prepositions", count: GraEdAdjectivesPrepositions },
          { type: "GR-Present_perfect_vs_past_simple", count: GRPresentPerfectVsPastSimple },
          { type: "Gra-Present_perfect_simple_vs_continuous", count: GraPresentPerfectSimpleVsContinuous },
          { type: "Gra-As_like", count: GraAsLike },
          { type: "UoE-Hygge", count: UoEHygge },
          { type: "Reading-xmen", count: ReadingXmen },
          { type: "Listening", count: Listening },
          { type: "GR1-Expression_of_quantity", count: GR1ExpressionOfQuantity },
          { type: "Subject_verb_agreement", count: SubjectVerbAgreement },
          { type: "Use_of_English", count: UseOfEnglish },
          { type: "Reading-The_death_of_cooking", count: ReadingTheDeathOfCooking },
          { type: "GR4-Passive-reporting", count: GR4PassiveReporting },
          { type: "Future-forms", count: Futureforms },
          { type: "GR-Future_forms", count: GRFutureforms },
          { type: "Future-perfect-&-continuous", count: FuturePerfectAndContinuous },
          { type: "Voc-Expressions_with_get", count: VocExpressionWithGet },
          { type: "ProgressTest2", count: ProgressTest2 },
          { type: "So,such,too,enough", count: SoSuchTooEnough },
          { type: "Relative_clauses", count: RelativeClauses },
          { type: "6", count: a6 },
          { type: "It is,there is", count: ItIsThereIs },
          { type: "Voc-Linking_words", count: VocLinkingWords },
          { type: "Third_cond-4", count: ThirdCond },
          { type: "Mixed_conditionals", count: MixedConditionals }
        ]
      },
      mark: "bar",
      encoding: {
        x: { field: "type", type: "nominal", axis: { title: "Graphique de la proportion des themes de Question" } },
        y: { field: "count", type: "quantitative", axis: { title: "Nombre" } },
        color: { field: "type", type: "nominal" }
      }
    };

    // Générer une page HTML
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

    // Sauvegarder la page HTML
    const outputFilePath = path.join(__dirname, "./cli/exam-theme-chart.html");
    fs.writeFileSync(outputFilePath, htmlContent);

    logger.info(`Graphique généré avec succès : ${outputFilePath}`);
  } catch (error) {
    logger.error("Une erreur est survenue.");
    logger.error(error.message);
  }
});




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
