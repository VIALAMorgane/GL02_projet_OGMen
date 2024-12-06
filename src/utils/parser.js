const fs = require('fs');
const path = require('path');

// Classe Question pour stocker les questions
class Question {
    constructor(title, text, theme) {
        this.title = title;
        this.text = text;
        this.theme = theme; // Ajoute le thème à chaque question
    }

   // Méthode toString pour afficher une question
    toString() {
        return `Title: ${this.title}\nQuestion: ${this.text}\nTheme: ${this.theme}\n`;
    }
}

// Extrait le thème à partir du nom du fichier
function extractThemeFromFilename(filename) {
    // Extrait la partie entre le dernier '-' et '.gift'
    const match = filename.match(/\d-(?!.*\d-)([^.]*)\.gift$/);
    return match ? match[1] : ''; // Retourne le thème ou une chaîne vide si non trouvé
}

// Parse un fichier GIFT et retourne un tableau de questions
function parseGiftFile(filePath, startIndex = 1) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Regex pour capturer les questions en format GIFT
    const questionPattern = /(::.*?::)?(.*?{.*?})/gs;
    const matches = Array.from(content.matchAll(questionPattern));

    const questions = matches.map((match, index) => {
        const title = match[1] 
            ? match[1].replace(/::/g, '').trim()  // Utilise le titre GIFT s'il existe
            : `Question ${startIndex + index}`;
        const text = match[2].trim();
        
        // Extrait le thème à partir du nom du fichier
        const theme = extractThemeFromFilename(path.basename(filePath));
        
        return new Question(title, text, theme);
    });

    return questions;
}

// Parse un répertoire contenant des fichiers GIFT et retourne un tableau de questions
function parseGiftDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath).filter(file => file.endsWith('.gift'));
    let allQuestions = [];
    let questionIndex = 1;
// Parcours tous les fichiers du répertoire
    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const questions = parseGiftFile(filePath, questionIndex);
        allQuestions = allQuestions.concat(questions); 
        questionIndex += questions.length; // Met à jour l'index pour les titres automatiques
    });

    return allQuestions;
}

// Exemple d'utilisation du module
if (require.main === module) {
    const directoryPath = path.join(__dirname, 'data'); 
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
// Exporte les fonctions et la classe pour les utiliser ailleurs
module.exports = { parseGiftFile, parseGiftDirectory, Question };
