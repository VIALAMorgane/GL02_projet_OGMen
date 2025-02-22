# GL02_projet_OGMen

## Project Description
This project aims to create a Command Line Interface (CLI) application for efficiently managing a database of questions and exams.

## Features
- Import questions from GIFT files.
- Manage questions (add, delete, search, deduplicate).
- Generate exams containing 15 to 20 questions.
- Export exams in GIFT format.
- Visualize questions and exams.
- Manage contacts (create, modify, delete, search).
- Generate HTML charts to visualize the distribution of question types.

## Prerequisites
- **Node.js** (version 16 or higher)
- **npm** (version 8 or higher)

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/aminssutt/GL02_projet_OGMen.git
   cd GL02_projet_OGMen/src
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage
To launch the CLI application, run:
```bash
cd src
node everywhereCli.js
```

## Available Commands
- `questions list`: List all questions.
- `questions import`: Import questions from the `./data` directory.
- `exam generate`: Generate an exam.
- For the full documentation, see the [Wiki](https://github.com/VIALAMorgane/GL02_projet_OGMen/wiki).

## Test Plan
The **Test Plan** serves as a structured framework to document and verify the test cases for the software. It outlines the scenarios, objectives, and expected results to ensure that the implementation adheres to the defined Software Requirement Specifications (SRS). By executing these tests, we aim to identify potential issues and improve the overall quality of the software.

### Objectives
The primary objective of the test plan is to:
1. Verify that the implementation meets the defined requirements.
2. Identify discrepancies and suggest improvements for future development.
3. Ensure a high standard of software quality through systematic testing.

1. `questions list` - Affiche toutes les questions de la banque.
2. `questions import` - Importe les questions depuis le répertoire `./data`.
3. `questions delete --title <title>` - Supprime une question par titre exact. Le titre doit être écrit entre parenthèses
4. `questions add --text <text> --type <type>` - Ajoute une nouvelle question, avec son texte et son type (entre guillemets, parmis 'True/False', 'Multiple Choice', 'Matching Answers', 'Numeric', 'Fill', 'Essay').
5. `questions chart` - Génère un fichier HTML avec un graphique des types de questions.
6. `exam generate` - Génère un examen contenant entre 15 et 20 questions.
7. `exam export --id <id>` - Exporte un examen au format GIFT.
8. `questions deduplicate` - Supprime les doublons dans les titres des questions.
9. `contact create` - Crée un nouveau contact.
10. `contact update` - Modifie un contact.
11. `contact delete` - Supprime un contact.
12. `visualize exam` - Permet de visualiser un examen avec un diagramme en barre.
13. `visualizeExamTheme` - Permet de visualiser un profil d'examen par theme en créant un diagramme en barre.
14. `search contact` - Rechercher un contact par Nom.
15. `search question` - Rechercher une question par ID.
16. `search exam` - Rechercher un examen par ID ou date.
17. `simulate exam ` - Simule un exament avec les résultats.

### Technical Environment
The tests are conducted in a technical environment capable of running Node.js version 18 or higher. This includes any desktop operating systems such as Windows, Linux, or macOS.

### How to Access the Test Plan
The full test plan, including detailed scenarios, test cases, and results, is available as a shared document. You can access it via the following link:
[Complete Test Plan Document](https://1drv.ms/w/c/a76d655a7365bbf8/EdweaEHzgMZEo9kE3GjzxmYBrerO7NDwxP3NgwS3015MPQ?e=wsyO4D)

## License
This project is licensed under the MIT License. 

The MIT License allows:
- Free use, modification, and distribution of the software.
- Integration into proprietary projects while preserving credit to the original authors.

For more details, refer to the [LICENSE](./LICENSE) file in the repository.

## Authors
- **Lakhdar Berache** - [GitHub](https://github.com/aminssutt)
- **Maxime Monterin** - [GitHub](https://github.com/maximeMonterin)
- **Mathieu Halliez** - [GitHub](https://github.com/mathieuHalliez)
- **Robinson Rocher** - [GitHub](https://github.com/robinsonrcr)
- **VIALAMorgane** - [GitHub](https://github.com/VIALAMorgane)
- **Gabriel S. Guerra** - [GitHub](https://github.com/gabriel-guerra)
- **LI Zhenpeng** - [GitHub](https://github.com/LZPxka)
