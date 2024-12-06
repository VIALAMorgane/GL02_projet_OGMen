# GL02_projet_OGMen

## Description du projet

Ce projet a été réalisé dans le cadre du cours GL02. L'objectif était de répondre au cahier des charges fourni, en développant une application CLI (Command Line Interface) permettant de gérer une banque de questions et d'examens. L'application permet d'importer des questions depuis des fichiers GIFT, de les manipuler (ajout, suppression, recherche, etc.), et de générer des examens.

## Fonctionnalités

- Importation automatique des questions depuis des fichiers GIFT.
- Gestion des questions : ajout, suppression, recherche, déduplication.
- Génération d'examens contenant entre 15 et 20 questions.
- Exportation des examens au format GIFT.
- Visualisation des questions et des examens.
- Gestion des contacts : création, modification, suppression, recherche.
- Génération de graphiques HTML pour visualiser la distribution des types de questions.

## Prérequis

- Node.js 
- npm 

## Installation

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/GL02_projet_OGMen.git
   cd GL02_projet_OGMen
2. Installez les dépendances :
   ```bash
   npm install

## Utilisation

Pour lancer l'application CLI, exécutez la commande suivante :

node everywhereCli.js

## Commandes disponibles

Voici un résumé des commandes disponibles dans l'application CLI :

1. `questions list` - Affiche toutes les questions de la banque.
2. `questions import` - Importe les questions depuis le répertoire `./data`.
3. `questions delete --title <title>` - Supprime une question par titre exact.
4. `questions add --text <text> --type <type>` - Ajoute une nouvelle question.
5. `questions chart` - Génère un fichier HTML avec un graphique des types de questions.
6. `exam generate` - Génère un examen contenant entre 15 et 20 questions.
7. `exam export --id <id>` - Exporte un examen au format GIFT.
8. `questions deduplicate` - Supprime les doublons dans les titres des questions.
9. `contact create` - Crée un nouveau contact.
10. `contact update` - Modifie un contact.
11. `contact read` - Lit les informations à propos d'un contact.
12. `contact delete` - Supprime un contact.
13. `visualize exam` - Permet de visualiser un examen avec un diagramme en barre.
14. `visualizeExamTheme` - Permet de visualiser un profil d'examen par theme en créant un diagramme en barre.
14. `search contact` - Rechercher un contact par Nom.
15. `search question` - Rechercher une question par ID.
16. `search exam` - Rechercher un examen par ID ou date.

## Roadmap

- [x] FS1: Manage questions - Permet aux utilisateurs autorisés de gérer les questions avec les opérations CRUD.
- [x] FS2: Chart of questions - Visualise la distribution des questions dans la banque de données sous forme de graphiques.
- [x] FS3: Generate an exam - Permet aux utilisateurs de préparer des examens en sélectionnant des questions.
- [x] FS4: Export an exam - Permet aux utilisateurs d'exporter des examens au format ".GIFT".
- [ ] FS5: Simulate an exam - Permet aux utilisateurs de simuler un examen pour collecter des données.
- [x] FS6: Manage Contact File - Permet aux enseignants de créer et gérer leur fichier de contact au format V-Card.
- [x] FS7: Visualize G.I.F.T. exam profile - Génère une distribution graphique des types de questions pour illustrer les examens.
- [x] FS8: Global Search - Fournit un outil de recherche pour permettre aux utilisateurs de rechercher des informations dans la base de données.


## Contributeurs

- **Lakhdar Berache** - [GitHub](https://github.com/aminssutt)
- **Maxime Monterin** - [GitHub](https://github.com/maximeMonterin)
- **Mathieu Halliez** - [GitHub](https://github.com/mathieuHalliez)
- **Robinson Rocher** - [GitHub](https://github.com/robinsonrcr)
