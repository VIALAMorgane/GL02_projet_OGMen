const cli = require("@caporal/core").default;
const { parseGiftDirectory } = require("./utils/parser");
const { readQuestions, readExam, saveQuestions, deleteQuestion, saveExam, removeDuplicateQuestions,detectQuestionType } = require("./utils/fileManager");



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
            console.error("Le répertoire './data' est introuvable. Assurez-vous qu'il existe.");
            return;
        }

        console.log("Importation des questions en cours...");

        // Lire les fichiers GIFT dans le répertoire
        const importedQuestions = parseGiftDirectory(dataPath);

        // Lire les questions existantes dans questions.json
        const existingQuestions = readQuestions();

        // Ajouter le type détecté pour chaque question
        const enrichedQuestions = importedQuestions.map(q => ({
            ...q,
            type: detectQuestionType(q.text), // Détection du type de question
        }));

        // Fusionner les questions en évitant les doublons
        const uniqueQuestions = [
            ...existingQuestions,
            ...enrichedQuestions.filter(
                q => !existingQuestions.some(eq => eq.text === q.text)
            ),
        ];

        // Sauvegarder les questions dans questions.json
        saveQuestions(uniqueQuestions);

        console.log(`${uniqueQuestions.length - existingQuestions.length} nouvelles questions importées.`);
    } catch (err) {
        console.error(`Erreur lors de l'importation automatique des questions : ${err.message}`);
    }
}

function messageDebut() {
    console.log("Bienvenue dans Everywhere CLI !");
    console.log("Voici les commandes disponibles :");
    console.log(`
    1. questions list              - Affiche toutes les questions de la banque
    2. questions import            - Importe les questions depuis le répertoire ./data
    3. questions delete <title>    - Supprime une question par titre exact
    4. questions add --text <text> - Ajoute une nouvelle question
    5. questions chart             - Génère un fichier HTML avec un graphique des types de questions
    6. exam generate               - Génère un examen contenant entre 15 et 20 questions
    7. exam export --id <id>       - Exporte un examen au format GIFT
    8. questions deduplicate       - Supprime les doublons dans les titres des questions
    `);
}

function askQuestion(questions, index = 0, score) {
    // Si on a parcouru toutes les questions, on termine
    if (index >= questions.length) {
        console.log(`Quiz terminé ! Votre score final est : ${score}`);
        reader.close();
    }

    //REGEX pour trouver les reponses correctes des questions
    const regex = /(?<==)[^ ]+(?= ~)|(?<==).*?[.]|(?<==).*?(?=[.~])|(?<==).*?(?=[.}])|(?<==).*?(?=[.])/;
    
    const question = questions[index];
    // Stocke les bonnes réponses de la question en cours
    let goodAnswer = question.text.match(regex);
    // Supprime les indications de bonne ou mauvaise réponse
    let text = question.text.replaceAll('~', ' ').replaceAll('=', ' ');

    // Pose la question à l'utilisateur
    reader.question(goodAnswer + '\n' + 'Entrez votre réponse ici : ', (userAnswer) => {
        // Vérifie la réponse
        if (goodAnswer.includes(userAnswer)) {
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
    cli.command("read exam", "Affiche toutes les questions dun exam")

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
            */

            //Si il n'existe pas d'examen, alors rien ne se passe. On renvoit juste un string
            if (exams.length === 0) {
                logger.info("Aucun examen n'a encore été créé.");
            } else {

                //En revanche si un ou des examens ont été trouvé, alors on parcours la liste de tous les examens dans le fichier
                exams.every((exams) => {

                    //Et si un examen possède le même id que celui entré en paramètre par l'utilisateur
                    if(exams.id === id){

                        //Alors on affiche toutes ses données
                        logger.info(`Id de l'examen : ${exams.id}`);
                        logger.info(`Date de création : ${exams.date}`);
                        logger.info(`Questions de l'examen :`);


                        //On parcours toutes les questions présentent dans l'examen choisi
                        exams.questions.forEach((exams) => {

                            questionList.push(exams)


                            /*
                            //Stock la ou les bonnes réponses de la question en cours
                            let goodAnswer = exams.text.match(regex);
                            //Supprime l'indication d'une bonne ou mauvaise réponse, pour ne garder que les réponses simples'
                            text = exams.text.replaceAll('~', ' ');
                            text = text.replaceAll('=', ' ');

                            //Gère les interactions entre le User et le terminal
                            reader.question(text + '\n' + 'Entrez votre réponse ici : ', userAnswer => {
                                
                                //Si la réponse donnée par le User est contenu dans le string des bonnes réponses
                                if(goodAnswer.includes(userAnswer)){

                                    //Alors on incrémente son score et on le félicite
                                    ++score;
                                    logger.info("Vous avez trouvé la bonne réponse !");
                                }
                                else{

                                    //Sinon on le prévient que sa réponse est incorrecte (examen non négatif)
                                    logger.info("Votre réponse n'est pas correcte.");
                                }
                            })*/

                        })

                        //Return false permet ici de casser la boucle de parcours des examens. Every est comme un forEach sauf que c'est arrêtable à souhait
                        return false;
                    }
            });

                askQuestion(questionList, 0, 0);
                //logger.info("Votre score à l'examen " + id + " est de : " + score);

            }

        });

    cli.command("questions import", "Importe les questions depuis le répertoire ./data")
        .action(({ logger }) => {
            try {
                importAllQuestions();
                logger.info("Importation des questions terminée.");
            } catch (err) {
                logger.error(`Erreur lors de l'importation des questions : ${err.message}`);
            }
        });

        cli.command("questions delete <title>", "Supprime une question par titre exact")
        .action(({ logger, args }) => {
            const title = args.title;
            logger.info(`Suppression demandée pour : "${title}"`); // Log pour vérifier l'entrée utilisateur
    
            const result = deleteQuestion(title);
    
            if (result) {
                logger.info(`La question "${title}" a été supprimée avec succès.`);
            } else {
                logger.warn(`Aucune question avec le titre exact "${title}" n'a été trouvée.`);
            }
        });
    
        const fs = require("fs");
const path = require("path");
cli.command("questions chart", "Génère un fichier HTML avec un graphique des types de questions")
    .action(({ logger }) => {
        try {
            const questions = readQuestions();

            if (questions.length === 0) {
                logger.warn("Aucune question disponible pour générer un graphique.");
                return;
            }

            // Compter les types de questions
            const typeCounts = {};
            questions.forEach(q => {
                const type = q.type || "Unknown";
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            });

            const labels = Object.keys(typeCounts); // Les types de questions
            const counts = Object.values(typeCounts); // Le nombre de chaque type

            // Contenu HTML dynamique
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Distribution des Types de Questions</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>Distribution des Types de Questions</h1>
    <canvas id="questionsChart" width="800" height="400"></canvas>
    <script>
        const data = {
            labels: ${JSON.stringify(labels)},
            datasets: [{
                label: "Distribution des Types",
                data: ${JSON.stringify(counts)},
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        };

        const config = {
            type: 'bar', // Type par défaut, peut être modifié
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                }
            }
        };

        const ctx = document.getElementById('questionsChart').getContext('2d');
        new Chart(ctx, config);
    </script>
</body>
</html>
`;

            // Chemin de sortie
            const outputPath = path.join(__dirname, "./cli/chart.html");

            // Vérification et écriture dans le fichier
            try {
                fs.writeFileSync(outputPath, htmlContent, "utf-8");
                logger.info(`Graphique généré avec succès dans le fichier : ${outputPath}`);
            } catch (fileError) {
                logger.error(`Erreur lors de l'écriture du fichier HTML : ${fileError.message}`);
            }
        } catch (error) {
            logger.error(`Erreur lors de la génération du graphique : ${error.message}`);
        }
    });


    cli.command("questions add", "Ajoute une nouvelle question à la banque")
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
            logger.error(`Erreur lors de l'ajout de la question : ${error.message}`);
        }
    });

    cli.command("questions search <keyword>", "Recherche une question par mot-clé")
        .action(({ logger, args }) => {
            const keyword = args.keyword.toLowerCase();
            const questions = readQuestions();
            const filteredQuestions = questions.filter(q =>
                q.text.toLowerCase().includes(keyword)
            );

            if (filteredQuestions.length === 0) {
                logger.info(`Aucune question trouvée contenant le mot-clé : "${keyword}".`);
            } else {
                logger.info(`Questions trouvées pour le mot-clé "${keyword}" :`);
                filteredQuestions.forEach((question, index) => {
                    logger.info(`Question ${index + 1} : ${question.title}`);
                    logger.info(`   Texte : ${question.text}`);
                });
            }
        });

        cli.command("exam generate", "Génère un examen contenant entre 15 et 20 questions")
        .option("--count <count>", "Nombre de questions (entre 15 et 20)", { required: false, validator: cli.NUMBER })
        .option("--keyword <keyword>", "Mot-clé pour filtrer les questions", { required: false })
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
                    logger.error(`Pas assez de questions disponibles pour générer un examen. Questions disponibles : ${questions.length}`);
                    return;
                }
    
                // Filtrer les questions par mot-clé, si spécifié
                const filteredQuestions = keyword
                    ? questions.filter(q => q.text.toLowerCase().includes(keyword))
                    : questions;
    
                if (filteredQuestions.length < count) {
                    logger.error(`Pas assez de questions correspondant au mot-clé "${keyword}". Questions disponibles : ${filteredQuestions.length}`);
                    return;
                }
    
                // Mélanger et sélectionner les questions
                const shuffledQuestions = filteredQuestions.sort(() => 0.5 - Math.random());
                const selectedQuestions = shuffledQuestions.slice(0, count);
    
                // Créer l'examen
                const exam = {
                    id: `exam_${Date.now()}`,
                    date: new Date().toISOString(),
                    questions: selectedQuestions
                };
    
                // Sauvegarder l'examen
                saveExam(exam);
    
                logger.info(`Examen généré avec succès ! ID de l'examen : ${exam.id}`);
            } catch (error) {
                logger.error(`Erreur lors de la génération de l'examen : ${error.message}`);
            }
        });

        cli.command("exam export", "Exporte un examen spécifique au format GIFT")
    .option("--id <id>", "ID de l'examen à exporter", { required: true })
    .action(({ logger, options }) => {
        const examId = options.id;

        try {
            // Lire tous les examens
            const examsFilePath = path.join(__dirname, "./data/exams.json");
            if (!fs.existsSync(examsFilePath)) {
                logger.error("Aucun fichier exams.json trouvé. Créez d'abord un examen avec 'exam generate'.");
                return;
            }

            const exams = JSON.parse(fs.readFileSync(examsFilePath, "utf-8"));

            // Rechercher l'examen par ID
            const selectedExam = exams.find(exam => exam.id === examId);

            if (!selectedExam) {
                logger.warn(`Aucun examen trouvé avec l'ID : ${examId}`);
                return;
            }

            // Convertir les questions de l'examen en format GIFT
            const giftContent = selectedExam.questions
                .map(q => `::${q.title}:: ${q.text} {}`)
                .join("\n\n");

            // Nommer automatiquement le fichier avec l'ID de l'examen
            const outputPath = path.join(__dirname, `./data/${examId}.gift`);

            // Écrire dans le fichier de sortie
            fs.writeFileSync(outputPath, giftContent);
            logger.info(`Examen exporté avec succès dans le fichier : ${outputPath}`);
        } catch (error) {
            logger.error(`Erreur lors de l'exportation : ${error.message}`);
        }
    });

    cli.command("questions deduplicate", "Supprime les doublons dans les titres des questions")
    .action(({ logger }) => {
        const result = removeDuplicateQuestions();

        if (result) {
            logger.info("Les doublons ont été supprimés avec succès.");
        } else {
            logger.warn("Aucun doublon n'a été trouvé.");
        }
    });
        
    cli.command("", "Commande par défaut")
        .action(({ logger }) => {
            logger.info("Bienvenue dans Everywhere CLI !");
            logger.info("Utilisez 'questions list', 'questions import', ou 'questions search <keyword>'.");
        });
}

// Importation automatique des questions au démarrage
importAllQuestions();

// Enregistrez les commandes
registerQuestionCommands(cli);

// Vérifiez les arguments reçus
console.log("Arguments reçus par le CLI :", process.argv);

// Lancement du CLI

const args = process.argv.slice(2);
if (args.length === 0) {
    messageDebut();
} else {
    cli.run(args).catch(err => { // gestion des bugs 
        console.error(`Erreur CLI : ${err.message}`);
    });
}