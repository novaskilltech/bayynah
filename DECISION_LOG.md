# TABAYYUN Decision Log

## 2026-09-23 - Compteur de visites agrégé

- Compteur global affiché dans le pied de page FR/AR.
- Une visite est comptée par session de navigation, avec déduplication dans `sessionStorage`.
- Incrémentation PostgreSQL atomique via `upsert` ; aucune IP, aucun user-agent et aucun identifiant visiteur n'est persisté.
- L'IP n'est utilisée que comme clé éphémère de limitation de débit.
- Le compteur se masque sans bloquer le site lorsque l'infrastructure est indisponible.

Ce fichier consigne les décisions techniques, produit, sécurité et éditoriales qui affectent le lancement pilote de TABAYYUN.

## 2026-09-22 - Clôture technique du pilote et stabilisation production

### Statut

Accepté et déployé.

- Branche : `main`
- URL de production : https://bayynah-two.vercel.app
- Clôture pilote : `1296fbb`
- Protection Vercel : `088b612`
- Métadonnées sociales : `2bd8cab`
- Réparation progression et pages blanches : `6bb5ee8`
- Dernière CI vérifiée : GitHub Actions `35722523681`, entièrement verte

### Contexte

La Phase 8.1 avait livré le lexique sous Integrity Gate, 11 événements pédagogiques typés, les sessions pilotes signées, le funnel et une politique de rétention annoncée à 90 jours.

Quatre écarts empêchaient encore le lancement du panel :

1. Le secret HMAC pilote pouvait retomber sur `CSRF_SECRET`, `AUTH_SECRET` ou un secret codé en dur.
2. La purge à 90 jours existait mais n'était pas planifiée.
3. Plusieurs identifiants de ressources restaient insuffisamment contraints.
4. La notice arabe qualifiait les données d'anonymes au lieu de pseudonymisées.

Un audit navigateur ultérieur a également identifié six pages qui perdaient leur contenu pendant l'hydratation React :

- `/fr/parcours`
- `/ar/parcours`
- `/fr/progression`
- `/ar/progression`
- `/fr/revision`
- `/ar/revision`

### Décision 1 - Secret dédié à la télémétrie pilote

Statut : accepté.

- `PILOT_TELEMETRY_SECRET` est le seul secret utilisé pour signer les sessions pilotes.
- En production, son absence provoque une erreur explicite.
- Le fallback `dev-only-pilot-secret` est limité aux environnements hors production.
- `CSRF_SECRET` et `AUTH_SECRET` ne sont jamais réutilisés pour la télémétrie.
- Le format des identifiants et signatures est validé strictement.

### Décision 2 - Rétention automatique à 90 jours

Statut : accepté.

- Route : `/api/cron/purge-pedagogical-metrics`
- Protection : `Authorization: Bearer ${CRON_SECRET}`
- Planification Vercel : chaque jour à `03:00 UTC`
- Fonction exécutée : `purgeOldPedagogicalMetrics(90)`
- Réponse : `{ "success": true, "deleted": number }`
- La route n'expose jamais les événements supprimés.
- La purge est testée comme idempotente.
- Les données de plus de 90 jours sont supprimées.
- Les données situées exactement à la limite ou plus récentes sont conservées.
- Aucun fallback de développement n'est accepté pour `CRON_SECRET`.

### Décision 3 - Contrats de télémétrie sans texte libre

Statut : accepté.

- Les 11 événements sont des objets Zod stricts.
- Les propriétés racine inconnues sont rejetées au lieu d'être silencieusement supprimées.
- Les métadonnées sont strictes.
- Les identifiants de leçons, enquêtes et termes proviennent de contrats canoniques.
- Les écoles autorisées sont `CRITIQUE`, `HADITH`, `FIQH` et `AQIDA`.
- Les niveaux de certitude utilisent l'enum canonique.
- La provenance d'un terme de lexique doit associer un type et un identifiant compatibles.
- `metadata.termId` doit correspondre à `resourceId`.
- Les listes canoniques sont comparées automatiquement aux 20 leçons, 10 enquêtes et 25 termes publiés.
- Sept anciens slugs d'enquêtes incorrects ont été remplacés par les slugs réellement publiés.

### Décision 4 - Notice de pseudonymisation

Statut : accepté.

La notice arabe utilise désormais une formulation équivalente à :

> بيانات بيداغوجية مؤقتة مرتبطة بمعرّف مستعار

La notice FR/AR conserve explicitement :

- rétention maximale de 90 jours ;
- aucune adresse IP persistée ;
- aucun texte libre ;
- aucun lien avec le compte utilisateur ;
- possibilité de désactivation.

### Décision 5 - Test navigateur réel

Statut : accepté.

Le test simulé sous Node a été remplacé par Playwright Chromium.

Le scénario est exécuté en français et en arabe :

1. ouverture du diagnostic ;
2. émission de `DIAGNOSTIC_STARTED` ;
3. réponse aux 14 situations ;
4. émission de `DIAGNOSTIC_COMPLETED` ;
5. ouverture et validation d'une leçon ;
6. émission de `LESSON_OPENED` et `LESSON_COMPLETED` ;
7. réalisation des 10 étapes d'une enquête ;
8. émission de `INQUIRY_STARTED`, `INQUIRY_STEP_ANSWERED` et `INQUIRY_COMPLETED` ;
9. ouverture d'un terme du lexique ;
10. émission de `GLOSSARY_OPENED` ;
11. désactivation de la mesure et vérification qu'aucun événement n'est envoyé ;
12. réactivation et création d'une nouvelle session pilote ;
13. ouverture de `/parcours`, `/progression` et `/revision` sans erreur d'hydratation.

La validité cryptographique HMAC reste couverte par les tests unitaires. Le navigateur utilise une session synthétique conforme au contrat afin d'éviter une dépendance à l'infrastructure de production pendant la CI.

### Décision 6 - Métadonnées sociales et icônes

Statut : accepté et déployé.

- Métadonnées FR et AR générées depuis le layout localisé.
- Open Graph configuré avec titre, description, locale, image et dimensions.
- Carte Twitter : `summary_large_image`.
- Miniatures FR/AR : 1200 x 630 en PNG.
- Favicon : 64 x 64 en PNG.
- Apple Touch Icon : 180 x 180 en PNG.
- Routes :
  - `/{locale}/opengraph-image`
  - `/{locale}/twitter-image`
  - `/icon`
  - `/apple-icon`
- Le proxy exclut explicitement les routes d'icônes de la redirection de locale.
- Les cartes arabes utilisent des métadonnées arabes et une translittération latine dans l'image pour éviter une incompatibilité de ligatures avec Satori.

### Décision 7 - Réparation des pages blanches React

Statut : accepté et déployé.

Cause racine : les callbacks `getSnapshot` de `useSyncExternalStore` construisaient un nouveau tableau ou objet à chaque lecture. React 19 entrait dans une boucle de rendu et levait l'erreur de profondeur maximale.

Correction :

- snapshot sérialisé primitif et stable ;
- parsing mémorisé ;
- abonnement à l'événement navigateur `storage` ;
- événement même onglet `tabayyun-progress-updated` ;
- profil méthodologique recalculé uniquement lorsque les données brutes changent.

Vérification production Chromium :

```text
/fr/parcours      200  fr/ltr  crash=false
/ar/parcours      200  ar/rtl  crash=false
/fr/progression   200  fr/ltr  crash=false
/ar/progression   200  ar/rtl  crash=false
/fr/revision      200  fr/ltr  crash=false
/ar/revision      200  ar/rtl  crash=false
```

### Décision 8 - Progression locale canonique

Statut : accepté.

- Une leçon est marquée terminée lorsque tous ses quiz sont validés.
- Une enquête est marquée terminée lorsque sa conclusion est débloquée.
- Le diagnostic est persisté comme `DiagnosticAttempt`.
- L'évaluation finale est persistée comme `FinalAssessmentAttempt`.
- Les quiz de leçons alimentent les compétences définies dans `LESSON_SKILLS_MAP`.
- Les étapes d'enquêtes alimentent les compétences définies dans `INQUIRY_STEP_SKILLS_MAP`.
- Les résultats sont conservés localement en mode invité.
- Le parcours, le tableau de progression, la révision et l'éligibilité aux attestations consomment les mêmes clés canoniques.

### Décision 9 - Routes de leçons canoniques

Statut : accepté.

Les anciens liens omettaient le segment école :

```text
/{locale}/ecoles/{lessonSlug}
```

Le format canonique est maintenant :

```text
/{locale}/ecoles/{school}/{lessonSlug}
```

La construction est centralisée et couverte par des tests.

### Décision 10 - États de récupération et pages secondaires

Statut : accepté.

- Ajout d'un état de chargement localisé.
- Ajout d'une frontière d'erreur localisée avec bouton de nouvelle tentative.
- Ajout d'une page 404 FR/AR avec accès vers l'accueil, les leçons et les enquêtes.
- Le lexique est accessible depuis la navigation et le pied de page.
- La bibliothèque ne reste plus vide : elle redirige vers les références déjà validées dans les leçons, enquêtes et termes du lexique.
- Aucun ouvrage ou contenu scientifique n'a été inventé pour remplir la bibliothèque.
- Le CTA `Tester mon esprit critique` ouvre désormais le diagnostic.

### Décision 11 - Dégradation explicite du service de comptes

Statut : accepté.

Le projet Vercel a été déployé sans infrastructure de comptes à la demande du propriétaire.

Lorsque le service est indisponible :

- `/api/auth/me` retourne un JSON `503` explicite au lieu d'un `500` vide ;
- la page compte explique que la synchronisation est indisponible ;
- le mode invité local reste utilisable ;
- l'utilisateur peut continuer son parcours sans perdre sa progression locale ;
- la connexion ne tente pas un POST sans jeton CSRF valide.

## Walkthrough de validation fonctionnelle

Durée cible : 30 à 35 minutes.

### 1. Accueil

Ouvrir `/fr` puis `/ar`.

Vérifier :

- navigation visible ;
- français en LTR et arabe en RTL ;
- favicon ;
- accès au lexique ;
- accès à la bibliothèque depuis le pied de page ;
- le CTA de test ouvre `/diagnostic`.

### 2. Diagnostic

Ouvrir `/{locale}/diagnostic`, répondre aux 14 situations et terminer.

Vérifier :

- feedback après chaque réponse ;
- résultat global ;
- points forts et priorités ;
- persistance après navigation ;
- diagnostic reconnu sur `/progression`.

### 3. Parcours

Ouvrir `/{locale}/parcours`.

Vérifier :

- cinq niveaux visibles ;
- aucune page blanche ;
- liens de leçons valides ;
- liens d'enquêtes valides ;
- compteurs de progression persistants.

Après une leçon et une enquête du premier niveau, le compteur attendu est `2 / 7`.

### 4. Leçon

Exemple :

```text
/fr/ecoles/critique/critique-01-affirmation-vs-preuve
/ar/ecoles/critique/critique-01-affirmation-vs-preuve
```

Répondre d'abord incorrectement, lire le feedback, corriger puis terminer le quiz.

Vérifier :

- validation du quiz ;
- leçon terminée ;
- compétences mises à jour ;
- progression conservée après rechargement.

### 5. Enquête

Exemple :

```text
/fr/laboratoire/ablutions-viande-chameau
/ar/laboratoire/ablutions-viande-chameau
```

Effectuer les dix étapes et consulter la conclusion.

Vérifier :

- feedback à chaque étape ;
- preuves débloquées ;
- conclusion visible ;
- enquête terminée ;
- compétences mises à jour ;
- liens de prérequis valides.

### 6. Lexique

Ouvrir `/{locale}/lexique#dalala`.

Vérifier :

- recherche ;
- filtres ;
- définitions FR/AR ;
- analogie et piège méthodologique ;
- ancre du terme.

### 7. Progression et révision

Ouvrir :

```text
/{locale}/progression
/{locale}/revision
```

Vérifier :

- absence de page blanche ;
- score global ;
- compétences évaluées ;
- recommandations de révision ;
- liens valides ;
- stabilité après changement de langue et rechargement.

### 8. Évaluation finale

Ouvrir `/{locale}/evaluation-finale`, répondre aux huit situations et terminer.

Vérifier :

- résultat final ;
- persistance de la tentative ;
- mise à jour du profil ;
- calcul de l'éligibilité.

L'attestation immédiate reste un résultat local tant que le service serveur de comptes et de signature n'est pas configuré.

### 9. Partage social

Vérifier pour `/fr` et `/ar` :

- `og:title` ;
- `og:description` ;
- `og:image` ;
- `og:image:width=1200` ;
- `og:image:height=630` ;
- `twitter:card=summary_large_image` ;
- `twitter:title` ;
- `twitter:description` ;
- `twitter:image` ;
- favicon et Apple Touch Icon.

## Validation réalisée

La chaîne suivante est verte :

```text
validate-content
prisma validate
prisma generate
skills tests
progress-sync tests
security tests
scientific-governance tests
github-workflow tests
pedagogical-telemetry tests
pilot-funnel tests
Playwright FR/AR
eslint
Next.js production build
```

## Limitations et décisions différées

### Infrastructure de production

Statut : bloqué par configuration externe.

Variables requises avant activation complète :

```text
DATABASE_URL
CSRF_SECRET
PILOT_TELEMETRY_SECRET
CRON_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
ATTESTATION_KEY_V1
ATTESTATION_ACTIVE_KEY_VERSION
```

Sans elles :

- le contenu pédagogique et la progression locale fonctionnent ;
- les comptes et la synchronisation restent indisponibles ;
- la télémétrie pilote n'est pas enregistrée ;
- la purge cron ne peut pas accéder à la base ;
- les attestations serveur ne peuvent pas être signées.

### Traductions arabes des leçons

Statut : différé vers une phase éditoriale et scientifique.

- Les titres, résumés, principes, citations et quiz des 20 leçons sont disponibles en arabe.
- Les corps complets des 20 leçons restent en français sur les routes arabes.
- Une notice arabe explicite ce fallback temporaire.
- La traduction ne doit pas être générée automatiquement sans relecture scientifique.

### Autres écarts arabes identifiés

Statut : backlog éditorial/localisation.

- certains libellés secondaires et métadonnées techniques restent bilingues ;
- les sources de conclusion des enquêtes contiennent parfois des connecteurs français ;
- certains slugs restent visibles comme titres dans les recommandations ;
- plusieurs écrans administratifs sont partiellement français ;
- les erreurs API d'authentification doivent être entièrement localisées lorsque le service sera activé.

### Routes de découverte

Statut : backlog technique.

- ajouter un vrai `robots.txt` ;
- ajouter un sitemap FR/AR des contenus publiés ;
- exclure les routes compte, connexion, administration et API de l'indexation.

## Critère de lancement du panel

Le code et le parcours local sont techniquement prêts.

Le panel instrumenté ne doit commencer qu'après :

1. configuration des variables Vercel ;
2. vérification de la création d'une session pilote en production ;
3. vérification d'une insertion de métrique en base ;
4. vérification de l'exécution autorisée du cron ;
5. confirmation que les comptes restent désactivés ou deviennent réellement fonctionnels.

Après ces vérifications, arrêter le développement fonctionnel et lancer 5 à 10 testeurs pour une session de 30 à 35 minutes par personne.
