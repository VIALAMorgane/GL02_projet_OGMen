const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../data/questions.json");
const examsFilePath = path.join(__dirname, "../data/exams.json");

const { parseVCard } = require("./vCardParser");

// Lit les questions à partir du fichier JSON
function readQuestions() {
  if (!fs.existsSync(dataFilePath)) {
    console.warn(
      "Fichier questions.json introuvable. Retour d'une liste vide.",
    );
    return []; // Retourne un tableau vide si le fichier JSON est inexistant.
  }
  const data = fs.readFileSync(dataFilePath, "utf-8");
  try {
    return JSON.parse(data); // Parse le contenu JSON et retourne les questions.
  } catch (error) {
    console.error("Erreur lors du parsing de questions.json :", error.message);
    return []; // Retourne un tableau vide en cas d'erreur de parsing.
  }
}

// Sauvegarde les questions dans le fichier JSON
function saveQuestions(questions) {
  const questionsWithTitles = titreQst(questions);
  try {
    // Écrit le contenu mis à jour dans le fichier JSON
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify(questionsWithTitles, null, 2),
    );
    console.log("Questions sauvegardées avec succès !");
  } catch (error) {
    console.error(
      "Erreur lors de la sauvegarde des questions :",
      error.message,
    );
  }
}

// Attribue des titres uniques aux questions
function titreQst(questions) {
  return questions.map((question, index) => {
    if (!question.title || question.title.trim() === "") {
      question.title = `Question ${index + 1}`; // Génère un titre basé sur l'index si aucun n'existe.
    }
    return question;
  });
}

// Supprime une question de la banque de questions
function deleteQuestion(title) {
  const questions = readQuestions();

  if (questions.length === 0) {
    console.warn("Aucune question disponible dans la base pour suppression.");
    return false;
  }

  console.log(`Tentative de suppression pour le titre exact : "${title}"`);
  console.log(`Questions disponibles avant suppression : ${questions.length}`);

  // Filtrer les questions qui ne correspondent pas au titre exact
  const filteredQuestions = questions.filter((q) => q.title !== title);

  // Vérifie si une suppression a eu lieu
  if (filteredQuestions.length === questions.length) {
    console.warn(`Aucune question trouvée avec le titre exact : "${title}"`);
    return false;
  }

  // Sauvegarde la nouvelle liste après suppression
  saveQuestions(filteredQuestions);
  console.log(
    `Suppression effectuée. Nombre de questions restantes : ${filteredQuestions.length}`,
  );
  return true;
}

// Sauvegarde un examen dans le fichier JSON
function saveExam(exam) {
  const exams = fs.existsSync(examsFilePath)
    ? // Vérifie si le fichier existe, puis lit et parse son contenu
      JSON.parse(fs.readFileSync(examsFilePath, "utf-8"))
    : [];
  exams.push(exam);
  // Écrit le contenu mis à jour dans le fichier JSON
  fs.writeFileSync(examsFilePath, JSON.stringify(exams, null, 2));
  console.log("Examen sauvegardé avec succès !");
}

// Supprime les questions en double de la banque de questions
function removeDuplicateQuestions() {
  const questions = readQuestions();
  // Vérifie si des questions sont disponibles pour la vérification
  if (questions.length === 0) {
    console.warn("Aucune question disponible pour vérifier les doublons.");
    return false;
  }

  console.log(
    `Vérification des doublons dans ${questions.length} questions...`,
  );

  const seenTitles = new Set();
  const uniqueQuestions = [];
  const duplicateQuestions = [];
  // Parcours toutes les questions pour identifier les doublons
  questions.forEach((question) => {
    if (seenTitles.has(question.title)) {
      duplicateQuestions.push(question);
    } else {
      seenTitles.add(question.title);
      uniqueQuestions.push(question);
    }
  });
  // Vérifie si des doublons ont été trouvés
  if (duplicateQuestions.length === 0) {
    console.log("Aucun doublon trouvé.");
    return false;
  }

  // Sauvegarder la liste de questions sans doublons
  saveQuestions(uniqueQuestions);

  console.log(
    `Suppression des doublons terminée. ${duplicateQuestions.length} doublon(s) supprimé(s).`,
  );
  return true;
}

// Fonction pour détecter le type de question à partir de son texte
function detectQuestionType(questionText) {
  if (/{T|F}/.test(questionText)) {
    return "TF"; // Retourne "TF" pour les questions Vrai/Faux
  }

  if (/{1:MC:|~/.test(questionText)) {
    return "Multiple Choice"; // Retourne "Multiple Choice" pour les questions à choix multiples
  }

  if (/{#/.test(questionText)) {
    return "Numeric"; // Retourne "Numeric" pour les questions numériques
  }

  if (/{=/.test(questionText)) {
    return "Fill"; // Retourne "Fill" pour les questions à compléter
  }

  if (/{.*->.*}/.test(questionText)) {
    return "Matching"; // Retourne "Matching" pour les questions d'association
  }

  if (questionText.length > 150) {
    return "Essay"; // Retourne "Essay" pour les questions longues
  }

  if (/{1:SA:/.test(questionText)) {
    return "Short Answer"; // Retourne "Short Answer" pour les questions à réponse courte
  }

  return "Unknown"; // Si aucun type ne correspond, retourne "Unknown"
}

//fonction de création de fichier vcf à partir d'un objet contact
function createNewContact(contactInfo) {
  const { firstName, lastName, phone, email } = contactInfo;

  //vérification de la présence des informations nécessaires
  if (!firstName || !lastName) {
    console.error("Le prénom et le nom sont requis pour créer un contact.");
    return false;
  }

  //mise en forme d l'objet contact en format vCard
  const vCardContent = `BEGIN:VCARD
VERSION:3.0
FN:${firstName} ${lastName}
N:${lastName};${firstName};;;
TEL;TYPE=HOME,VOICE:${phone || ""}
EMAIL;TYPE=HOME,INTERNET:${email || ""}
END:VCARD`;

  //définition du nom et du chemin du fichier
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(__dirname, "../data/contacts", fileName);

  //sauvegarde du fichier vcf dans @src/data/contacts en prenant en compte les erreurs
  try {
    fs.writeFileSync(filePath, vCardContent, "utf-8");
    console.log(`Contact sauvegardé avec succès dans ${fileName}`);
    return true;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du contact :", error.message);
    return false;
  }
}

//Fonction de recherche de contacts dans les fichiers vcf
function findContact(contactName) {
  //Mise en forme des informations du contact pour la recherche
  const { firstName, lastName } = contactName;

  //définition dunom et du chemin du fichier en prenant en compte le nom et le prénom du contact
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);

  // Vérifier si le fichier existe et retourner un booléen
  return fs.existsSync(filePath);
}

//Fonction de suppression de contact
const deleteContact = (contactName) => {
  //Recherche du contact dans les fichiers vcf
  const { firstName, lastName } = contactName;
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);

  if (findContact(contactName)) {
    // Si le contact est trouvé, suppression du fichier, renvoi d'un booléen en fonction du succès
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    //Renvoi d'un message d'erreur si le fichier n'existe pas
    console.warn(`Le fichiers ${fileName} n'existe pas.`);
    return false;
  }
};

//Foction d'affichage des informations de contact
function displayContactInfos(contactName) {
  //Recherche du contact dans les fichiers
  const { firstName, lastName } = contactName;
  const contactsDirPath = path.join(__dirname, "../data/contacts");
  const fileName = `${firstName}_${lastName}.vcf`;
  const filePath = path.join(contactsDirPath, fileName);
  if (findContact(contactName)) {
    //Affichage des informations du contact si le fichier est trouvé
    const vCardContent = fs.readFileSync(filePath, "utf-8");
    const contactInfos = parseVCard(vCardContent);
    console.log(`Informations du contact ${firstName} ${lastName} :`);
    console.log(`Prénom : ${contactInfos.firstName}`);
    console.log(`Nom : ${contactInfos.lastName}`);
    console.log(`Téléphone : ${contactInfos.phone}`);
    console.log(`Email : ${contactInfos.email}`);
  } else {
    //Affichage d'un message d'erreur si le fichier n'est pas trouvé
    console.log(`Aucun contact trouvé avec le nom ${firstName} ${lastName}.`);
  }
}

function searchQuestionById(Id) {
  const questionsPath = path.join(__dirname, "../data/questions.json");
  try {
    // Lire le contenu du fichier JSON
    const data = fs.readFileSync(questionsPath, "utf-8");

    // Parser le contenu JSON en un tableau d'objets
    const questions = JSON.parse(data);

    // Vérifier si l'ID est valide
    if (Id >= 0 && Id < questions.length) {
      // Retourner l'objet question correspondant à l'ID
      return questions[Id];
    } else {
      console.warn(`ID invalide : ${Id}`);
      return null;
    }
  } catch (error) {
    console.error(
      `Erreur lors de la lecture du fichier questions.json : ${error.message}`,
    );
    return null;
  }
}

function readExams() {
  const examsPath = path.join(__dirname, "../data/exams.json");
  try {
    const data = fs.readFileSync(examsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(
      `Erreur lors de la lecture du fichier exams.json : ${error.message}`,
    );
    return [];
  }
}

function searchExamById(examId) {
  const exams = readExams();
  const examTitle = "exam_" + examId;
  return exams.find((exam) => exam.id === examTitle) || null;
}

function searchExamsByDate(date) {
  const exams = readExams();
  const targetDate = new Date(date);
  return exams.filter((exam) => {
    const examDate = new Date(exam.date.split("T")[0]);
    return examDate > targetDate;
  });
}

// Exporte les fonctions pour les rendre accessibles aux autres modules
module.exports = {
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
  searchQuestionById,
  searchExamById,
  searchExamsByDate,
};
