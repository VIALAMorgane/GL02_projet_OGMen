const fs = require("fs");
const path = require("path");

const dataFilePath = path.join(__dirname, "../data/questions.json");
const examsFilePath = path.join(__dirname, "../data/exams.json");

const { parseVCard } = require("./vCardParser");

/**
 * Lit la banque de questions depuis le fichier JSON.
 * @returns {Array} - Tableau de questions stockées dans le fichier JSON.
 */
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

/**
 * Sauvegarde la banque de questions dans le fichier JSON, tout en attribuant des titres uniques.
 * @param {Array} questions - Tableau de questions à sauvegarder.
 */
function saveQuestions(questions) {
  const questionsWithTitles = assignTitlesToQuestions(questions);
  try {
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

/**
 * Attribue des titres uniques aux questions, si elles n'en possèdent pas déjà.
 * @param {Array} questions - Tableau de questions.
 * @returns {Array} - Tableau de questions avec des titres uniques attribués.
 */
function assignTitlesToQuestions(questions) {
  return questions.map((question, index) => {
    if (!question.title || question.title.trim() === "") {
      question.title = `Question ${index + 1}`; // Génère un titre basé sur l'index si aucun n'existe.
    }
    return question;
  });
}

/**
 * Supprime une question spécifique de la banque en se basant sur son titre exact.
 * @param {string} title - Titre exact de la question à supprimer.
 * @returns {boolean} - Retourne true si au moins une question a été supprimée, sinon false.
 */
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

/**
 * Sauvegarde un examen nouvellement créé dans le fichier exams.json.
 * @param {Object} exam - Objet représentant un examen à sauvegarder.
 */
function saveExam(exam) {
  const exams = fs.existsSync(examsFilePath)
    ? JSON.parse(fs.readFileSync(examsFilePath, "utf-8"))
    : [];
  exams.push(exam);
  fs.writeFileSync(examsFilePath, JSON.stringify(exams, null, 2));
  console.log("Examen sauvegardé avec succès !");
}

/**
 * Supprime les doublons de questions dans la banque, en se basant sur leurs titres.
 * @returns {boolean} - Retourne true si des doublons ont été supprimés, sinon false.
 */
function removeDuplicateQuestions() {
  const questions = readQuestions();

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

  questions.forEach((question) => {
    if (seenTitles.has(question.title)) {
      duplicateQuestions.push(question);
    } else {
      seenTitles.add(question.title);
      uniqueQuestions.push(question);
    }
  });

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

/**
 * Détecte le type d'une question à partir de son texte.
 * @param {string} questionText
 * @returns {string}
 */
function detectQuestionType(questionText) {
  if (/{1:MC:|~/.test(questionText)) {
    return "Multiple Choice"; // Retourne le type Multiple Choice si les patterns spécifiques sont détectés.
  }
  if (/{1:SA:|=/.test(questionText) && !/{#/.test(questionText)) {
    return "Short Answer"; // Retourne Short Answer pour les questions à réponse courte.
  }
  if (/{#/.test(questionText)) {
    return "Matching"; // Retourne Matching pour les questions de type association.
  }
  if (questionText.length > 150) {
    return "Essay"; // Retourne Essay pour les questions longues.
  }
  return "Unknown"; // Retourne "Unknown" si aucun type ne correspond.
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
};
