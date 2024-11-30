const fs = require('fs');
const path = require('path');

/**
 * Classe représentant une question au format GIFT.
 */
class Question {
    constructor(title, text) {
        this.title = title;
        this.text = text;
    }

    /**
     * Représente la question sous forme de chaîne de caractères.
     * @returns {string}
     */
    toString() {
        return `Title: ${this.title}\nQuestion: ${this.text}\n`;
    }
}

/**
 * Parse un fichier GIFT et retourne un tableau d'objets Question.
 * @param {string} filePath - Chemin du fichier GIFT.
 * @param {number} startIndex - Index de départ pour attribuer des titres automatiques.
 * @returns {Array<Question>} - Liste des questions extraites.
 */
function parseGiftFile(filePath, startIndex = 1) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Regex pour capturer les questions en format GIFT
    const questionPattern = /(::.*?::)?(.*?{.*?})/gs;
    const matches = Array.from(content.matchAll(questionPattern));

    const questions = matches.map((match, index) => {
        const title = match[1] 
            ? match[1].replace(/::/g, '').trim() 
            : `Question ${startIndex + index}`;
        const text = match[2].trim();
        return new Question(title, text);
    });

    return questions;
}

/**
 * Parse un répertoire contenant plusieurs fichiers GIFT.
 * @param {string} directoryPath - Chemin du répertoire contenant les fichiers GIFT.
 * @returns {Array<Question>} - Liste combinée des questions de tous les fichiers.
 */
function parseGiftDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.gift'));
    let allQuestions = [];
    let questionIndex = 1;

    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const questions = parseGiftFile(filePath, questionIndex);
        allQuestions = allQuestions.concat(questions);
        questionIndex += questions.length; // Met à jour l'index pour les titres automatiques
    });

    return allQuestions;
}

/**
 * Exemple d'utilisation
 */
if (require.main === module) {
    const directoryPath = path.join(__dirname, 'data'); // Remplacer 'data' par le chemin de votre répertoire
    try {
        const questions = parseGiftDirectory(directoryPath);
        console.log(`Nombre total de questions extraites : ${questions.length}`);
        questions.forEach((q, index) => {
            console.log(`Question ${index + 1}:`);
            console.log(q.toString());
        });
    } catch (error) {
        console.error('Erreur lors du parsing des fichiers GIFT :', error.message);
    }
}

module.exports = { parseGiftFile, parseGiftDirectory, Question };
