/**
 * Dictionnaire Canonique du Lexique Méthodologique — TABAYYUN
 * Uṣūl al-Ḥadīth, Uṣūl al-Fiqh, Épistémologie & Gouvernance Scientifique
 */

export type GlossaryCategory = "hadith" | "usul" | "epistemology" | "governance";

export interface GlossaryTerm {
  id: string;
  termFr: string;
  termAr: string;
  category: GlossaryCategory;
  shortDefinitionFr: string;
  shortDefinitionAr: string;
  analogyFr: string;
  trapFr: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "dalala",
    termFr: "Dalāla (Signification / Portée du texte)",
    termAr: "دَلَالَة",
    category: "usul",
    shortDefinitionFr: "La manière dont un texte indique un sens. On distingue la portée univoque et absolue (qaṭ'ī) de la portée sujette à interprétation (ẓannī).",
    shortDefinitionAr: "كيفية دلالة اللفظ على المعنى، وتنقسم إلى قطعية وظنية.",
    analogyFr: "Comme un panneau routier indiquant une direction claire (sens univoque) par opposition à une signalisation ambiguë.",
    trapFr: "Confondre l'authenticité d'un texte (son attribution) avec sa portée (ce qu'il implique réellement). Un hadith peut être authentique mais sa portée générale est restreinte.",
  },
  {
    id: "takrij",
    termFr: "Takhrīj (Traçabilité & Référencement des sources)",
    termAr: "تَخْرِيج",
    category: "hadith",
    shortDefinitionFr: "L'art d'identifier l'origine exacte d'un énoncé, ses chaînes de transmission originales dans les corpus premiers et les jugements des maîtres du hadith.",
    shortDefinitionAr: "عزو الحديث إلى مصادره الأصلية المسندة وبيان حال طرقه ورجاله.",
    analogyFr: "L'enquête généalogique et bibliographique d'une citation pour retrouver le document d'archive initial.",
    trapFr: "Se contenter de dire « rapporté par un tel » sans vérifier si le texte cité est dans l'ouvrage original ou s'il s'agit d'une paraphrase tardive.",
  },
  {
    id: "jam",
    termFr: "Jam' (Conciliation préalable des textes)",
    termAr: "جَمْع",
    category: "usul",
    shortDefinitionFr: "La démarche méthodique visant à réconcilier deux textes apparemment contradictoires en délimitant leurs contextes respectifs, avant tout rejet ou abrogation.",
    shortDefinitionAr: "التوفيق بين النصوص التي ظاهرها التعارض بتخصيص العام أو تقييد المطلق.",
    analogyFr: "Deux consignes médicales qui semblent s'opposer, mais qui s'appliquent en réalité l'une au repos et l'autre à l'effort.",
    trapFr: "Décréter une contradiction ou une abrogation immédiate sans avoir exploré la possibilité que les deux règles coexistent dans des champs différents.",
  },
  {
    id: "tarjih",
    termFr: "Tarjīḥ (Prépondérance méthodologique)",
    termAr: "تَرْجِيح",
    category: "usul",
    shortDefinitionFr: "L'évaluation comparative de deux arguments concurrents pour déterminer rationnellement lequel possède la force probante supérieure.",
    shortDefinitionAr: "تقديم أحد الدليلين المتعارضين لوجود مزية معتبرة تجعل العمل به أولى.",
    analogyFr: "Le critère du faisceau de preuves scientifiques le plus robuste et le mieux répliqué face à une étude isolée.",
    trapFr: "Choisir un avis par simple affinité personnelle ou habitude culturelle, au lieu de s'appuyer sur des critères objectifs d'évaluation des preuves.",
  },
  {
    id: "tawaqquf",
    termFr: "Tawaqquf (Suspension du jugement)",
    termAr: "تَوَقُّف",
    category: "epistemology",
    shortDefinitionFr: "L'attitude épistémologique consistant à s'abstenir de trancher tant que les preuves disponibles demeurent équivoques ou insuffisantes.",
    shortDefinitionAr: "الإمساك عن الحكم عند تكافؤ الأدلة أو غموضها حتى يتبين الرجحان.",
    analogyFr: "Le principe de précaution intellectuelle : refuser de poser un diagnostic médical tant que les analyses biologiques ne sont pas conclues.",
    trapFr: "Considérer le doute méthodique ou la suspension du jugement comme une faiblesse, alors qu'il s'agit d'un devoir d'honnêteté intellectuelle.",
  },
  {
    id: "ijma",
    termFr: "Ijmā' (Consensus normatif)",
    termAr: "إِجْمَاع",
    category: "usul",
    shortDefinitionFr: "L'accord unanime des juristes-savants qualifiés d'une époque donnée sur un jugement légal déterminé.",
    shortDefinitionAr: "اتفاق مجتهدي الأمة بعد وفاة النبي ﷺ في عصر من الأعصار على حكم شرعي.",
    analogyFr: "Le consensus scientifique unanime établi et documenté par la communauté des spécialistes d'une discipline.",
    trapFr: "Prétendre l'existence d'un consensus sur une question qui fait l'objet de divergences historiques réelles et documentées.",
  },
  {
    id: "isnad",
    termFr: "Isnād (Chaîne de transmission)",
    termAr: "إِسْنَاد",
    category: "hadith",
    shortDefinitionFr: "La chaîne ininterrompue des transmetteurs rapportant un énoncé depuis sa source première jusqu'à l'auteur du recueil.",
    shortDefinitionAr: "سلسلة الرواة الموصلة إلى متن الحديث.",
    analogyFr: "La chaîne de traçabilité d'un témoignage dans une enquête judiciaire, de témoin direct en témoin direct.",
    trapFr: "Valider une chaîne de transmission uniquement parce que ses transmetteurs sont célèbres, sans vérifier la continuité historique de leur rencontre.",
  },
  {
    id: "matn",
    termFr: "Matn (Énoncé / Contenu textuel)",
    termAr: "مَتْن",
    category: "hadith",
    shortDefinitionFr: "Le contenu textuel et substantiel transmis au bout de la chaîne de transmission.",
    shortDefinitionAr: "ألفاظ الحديث التي تتقوم بها المعاني وتنتهي إليها سلسلة الإسناد.",
    analogyFr: "Le texte même d'un contrat ou d'une déclaration officielle, distinct du cachet du notaire qui l'authentifie.",
    trapFr: "Examiner uniquement la chaîne de transmission sans analyser la cohérence interne du texte et sa compatibilité avec les principes établis.",
  },
  {
    id: "qat-i",
    termFr: "Qaṭ'ī (Catégorique / Certain)",
    termAr: "قَطْعِي",
    category: "usul",
    shortDefinitionFr: "Un énoncé ou une preuve dont l'authenticité ou la signification ne laisse place à aucun doute raisonnable.",
    shortDefinitionAr: "ما لا يحتمل الشك ولا يقبل التأويل من حيث ثبوته أو دلالته.",
    analogyFr: "Une constante mathématique ou un enregistrement direct haute fidélité vérifié par de multiples capteurs indépendants.",
    trapFr: "Traiter une déduction probable (ẓannī) comme une vérité absolue et indiscutable (qaṭ'ī).",
  },
  {
    id: "zanni",
    termFr: "Ẓannī (Probable / Interprétable)",
    termAr: "ظَنِّي",
    category: "usul",
    shortDefinitionFr: "Une preuve qui repose sur une probabilité prépondérante, ouverte à une pluralité d'interprétations légitimes.",
    shortDefinitionAr: "ما يحتمل الدلالة على أكثر من معنى باحتمال راجح مع بقاء الاحتمال الآخر.",
    analogyFr: "Un indice solide et plausible lors d'une expertise, qui emporte la conviction sans exclure mathématiquement une nuance.",
    trapFr: "Rejeter un argument sous prétexte qu'il n'est pas certain à 100%, alors que la plupart des règles pratiques reposent sur la vraisemblance prépondérante.",
  },
  {
    id: "tawatur",
    termFr: "Tawātur (Transmission multiple concordante)",
    termAr: "تَوَاتُر",
    category: "hadith",
    shortDefinitionFr: "Transmission collective par un nombre si élevé de témoins indépendants qu'il est rationnellement impossible qu'ils se soient concertés pour mentir.",
    shortDefinitionAr: "رواية جمع عن جمع تحيل العادة تواطؤهم على الكذب من أول السند إلى منتهاه.",
    analogyFr: "Une information d'actualité majeure filmée et confirmée simultanément par des centaines de journalistes indépendants dans le monde.",
    trapFr: "Confondre un hadith très répandu dans le public (mustafīḍ) avec un hadith formellement mutawātir répondant aux critères stricts de la science.",
  },
  {
    id: "ahad",
    termFr: "Āḥād (Transmission isolée / singulière)",
    termAr: "آحَاد",
    category: "hadith",
    shortDefinitionFr: "Tout récit qui ne remplit pas les conditions du tawātur, reposant sur un ou quelques rapporteurs à chaque génération.",
    shortDefinitionAr: "ما لم يجمع شروط التواتر، سواء كان غريباً أو عزيزاً أو مشهوراً.",
    analogyFr: "Un rapport d'expertise validé par deux ou trois spécialistes réputés, mais n'ayant pas été cosigné par une assemblée entière.",
    trapFr: "Rejeter un hadith āḥād authentifié au prétexte qu'il n'est pas mutawātir, ou à l'inverse lui attribuer la force de certitude absolue d'un texte mutawātir.",
  },
  {
    id: "shadh",
    termFr: "Shādh (Anomalie / Déviation)",
    termAr: "شَاذّ",
    category: "hadith",
    shortDefinitionFr: "Un hadith rapporté par un transmetteur digne de confiance, mais qui contredit la version transmise par des rapporteurs encore plus nombreux ou plus fiables.",
    shortDefinitionAr: "رواية الثقة مخالفاً لمن هو أوثق منه أو أكثر عدداً.",
    analogyFr: "Un compte-rendu d'accident établi par un témoin honnête, mais contredit sur un détail critique par cinq autres témoins tout aussi crédibles.",
    trapFr: "Valider une variante de texte inhabituelle sous prétexte que le transmetteur est sincère, sans comparer sa version à l'ensemble des autres chaînes.",
  },
  {
    id: "mu-allal",
    termFr: "Mu'allal (Récit porteur d'un vice caché)",
    termAr: "مُعَلَّل",
    category: "hadith",
    shortDefinitionFr: "Un hadith qui semble sain et authentique en apparence, mais dans lequel un critique expert découvre un défaut subtil invalidant.",
    shortDefinitionAr: "حديث ظاهره السلامة اطّلع فيه الناقد بعد التفتيش على علة قادحة خفية.",
    analogyFr: "Un vêtement d'orfèvre impeccable à l'œil nu mais qui comporte une micro-déchirure structurelle décelable uniquement par un expert sous microscope.",
    trapFr: "Se fier à l'apparence correcte d'une chaîne sans examiner les concordances croisées qui révèlent les inversions de noms ou les coupures masquées.",
  },
  {
    id: "illah",
    termFr: "'Illah (Cause déterminante / Vice caché)",
    termAr: "عِلَّة",
    category: "usul",
    shortDefinitionFr: "En uṣūl al-fiqh : le motif rationnel et objectif qui justifie une règle. En sciences du hadith : le vice caché qui altère la validité d'une chaîne.",
    shortDefinitionAr: "في الأصول: الوصف الظاهر المنضبط المناط به الحكم. وفي الحديث: سبب خفي قادح.",
    analogyFr: "La cause biomécanique racine d'une panne mécanique, qui explique pourquoi le système a dévié de son fonctionnement normal.",
    trapFr: "Confondre la sagesse générale (ḥikmah) — souvent subjective — avec la cause légale déterminante ('illah) qui doit être objective et vérifiable.",
  },
  {
    id: "qiyas",
    termFr: "Qiyās (Raisonnement par analogie normée)",
    termAr: "قِيَاس",
    category: "usul",
    shortDefinitionFr: "L'application d'un jugement établi pour un cas source (aṣl) à un cas nouveau (far') en raison d'une cause déterminante ('illah) commune.",
    shortDefinitionAr: "إلحاق فرع بأصل في حكم لعلة جامعة بينهما.",
    analogyFr: "Le raisonnement par jurisprudence en droit : appliquer une règle sur les stupéfiants connus à une nouvelle molécule synthétique partageant le même effet toxique.",
    trapFr: "Faire une fausse analogie (qiyās ma'a al-fāriq) en négligeant une différence fondamentale entre les deux situations comparées.",
  },
  {
    id: "ihtimal",
    termFr: "Iḥtimāl (Hypothèse / Éventualité plausible)",
    termAr: "احْتِمَال",
    category: "epistemology",
    shortDefinitionFr: "La présence d'une explication alternative crédible qui empêche de tirer une conclusion définitive d'une seule observation.",
    shortDefinitionAr: "ورود معنى آخر ممكن ومحتمل في الدليل يمنع من الجزم بالحكم الأولي.",
    analogyFr: "Une trace de pas dans la neige qui peut être celle d'un randonneur ou celle d'un garde forestier : tant que l'alternative existe, on ne peut trancher.",
    trapFr: "Tirer une certitude d'un indice alors qu'un contre-scénario tout aussi vraisemblable n'a pas été réfuté (« idhā jā'a al-iḥtimāl baṭala al-istidlāl »).",
  },
  {
    id: "istidlal",
    termFr: "Istidlāl (Démarche d'inférence / Argumentation)",
    termAr: "اسْتِدْلَال",
    category: "epistemology",
    shortDefinitionFr: "Le cheminement logique qui relie rigoureusement une preuve reconnue à la conclusion revendiquée.",
    shortDefinitionAr: "طلب الدليل أو الانتقال من الدليل إلى المدلول برابطة عقلية أو لغوية صحيحة.",
    analogyFr: "Le pont suspendu qui relie les fondations solides (les faits vérifiés) au bâtiment final (la sentence judiciaire).",
    trapFr: "Citer un verset ou un hadith authentique sans démontrer en quoi il prouve précisément la thèse avancée.",
  },
  {
    id: "muhkam",
    termFr: "Muḥkam (Texte clair et univoque)",
    termAr: "مُحْكَم",
    category: "usul",
    shortDefinitionFr: "Un énoncé limpide, explicite et protégé de toute ambiguïté, qui sert de référence pour éclairer les passages plus complexes.",
    shortDefinitionAr: "ما وضح معناه واستغنى عن البيان ولم يتطرق إليه احتمال التأويل.",
    analogyFr: "Une règle fondamentale gravée dans la constitution, qui prévaut sur les circulaires d'application dérivées.",
    trapFr: "Utiliser un texte équivoque pour contredire un principe fondamental solidement établi par de multiples textes muḥkam.",
  },
  {
    id: "mutashabih",
    termFr: "Mutashābih (Texte équivoque / Polysémique)",
    termAr: "مُتَشَابِه",
    category: "usul",
    shortDefinitionFr: "Un texte dont le sens profond prête à plusieurs interprétations et qui doit obligatoirement être lu à la lumière des textes clairs (muḥkam).",
    shortDefinitionAr: "ما استأثر الله بعلمه أو احتمل عدة معان لا ترجيح لواحد منها إلا بدليل خارجي.",
    analogyFr: "Un relevé météo complexe qui exige une station d'étalonnage pour être interprété correctement.",
    trapFr: "Fonder une doctrine entière ou une condamnation péremptoire sur une formulation métaphorique ou polysémique.",
  },
  {
    id: "to-be-checked",
    termFr: "TO_BE_CHECKED (À Collationner / Non Vérifié)",
    termAr: "قَيْدُ التَّوْثِيقِ",
    category: "governance",
    shortDefinitionFr: "Statut critique d'une preuve scientifique dont la citation, l'édition ou la traduction n'a pas encore été collationnée mot à mot avec l'ouvrage source de référence.",
    shortDefinitionAr: "حالة الدليل العلمي الذي يحتاج إلى تدقيق ومقابلة لفظية مع الأصل المطبوع المعتمد.",
    analogyFr: "Une pièce à conviction déposée sous scellé provisoire qui attend l'expertise médicolégale avant d'être admise au dossier.",
    trapFr: "Publier ou exploiter une preuve à ce statut. Dans TABAYYUN, un dossier contenant une seule preuve TO_BE_CHECKED ne peut jamais être publié.",
  },
  {
    id: "verified-verbatim",
    termFr: "VERIFIED_VERBATIM (Vérifié au Mot-à-Mot)",
    termAr: "مُحَقَّقٌ لَفْظِيّاً",
    category: "governance",
    shortDefinitionFr: "Statut d'une preuve dont le texte arabe original a été collationné lettre par lettre sur une édition critique reconnue, avec tome, page et numéro vérifiés.",
    shortDefinitionAr: "حالة النص الذي تمت مقابلته حرفياً مع نسخة محققة معتمدة مع استيفاء بيانات العزو.",
    analogyFr: "Un document d'archive certifié conforme à l'original par un conservateur assermenté.",
    trapFr: "Modifier ne serait-ce qu'un mot ou une traduction sans révoquer automatiquement ce statut pour réexamen.",
  },
  {
    id: "verified-paraphrase",
    termFr: "VERIFIED_PARAPHRASE (Paraphrase Validée)",
    termAr: "مَفْهُومٌ مُوَثَّقٌ",
    category: "governance",
    shortDefinitionFr: "Statut indiquant que le sens global de la source est fidèlement restitué sans prétendre reproduire la formulation mot à mot de l'auteur.",
    shortDefinitionAr: "حالة النقل الذي يورد المعنى بألفاظ الناقل مع الحفاظ على الأمانة العلمية.",
    analogyFr: "La synthèse autorisée d'un rapport de recherche qui résume les conclusions sans prétendre citer l'intégralité du procès-verbal.",
    trapFr: "Présenter une paraphrase comme s'il s'agissait d'une citation directe entre guillemets.",
  },
  {
    id: "falsifiabilite",
    termFr: "Falsifiabilité (Réfutabilité méthodologique)",
    termAr: "قَابِلِيَّةُ الإِبْطَالِ",
    category: "epistemology",
    shortDefinitionFr: "Critère selon lequel une affirmation n'a de valeur scientifique que si l'on peut concevoir une observation ou une preuve capable de l'invalider si elle est fausse.",
    shortDefinitionAr: "معيار علمي يقتضي إمكان تصور دليل أو تجربة تبطل الدعوى إن كانت غير صحيحة.",
    analogyFr: "Un modèle prédictif qui annonce qu'une réaction chimique aura lieu sous 5 minutes : si la réaction ne se produit pas, le modèle est infirmé.",
    trapFr: "Formuler des affirmations circulaires ou auto-immunisées contre toute critique, qui prétendent avoir raison quoi qu'il advienne.",
  },
  {
    id: "biais-confirmation",
    termFr: "Biais de confirmation (Tendance sélective)",
    termAr: "الانْحِيَازُ التَّأْكِيدِيُّ",
    category: "epistemology",
    shortDefinitionFr: "Tendance naturelle de l'esprit à ne rechercher, retenir et valoriser que les preuves qui confirment sa conclusion préconçue, en ignorant les contre-preuves.",
    shortDefinitionAr: "ميل الباحث إلى جمع الشواهد التي تعزز رأيه المسبق وإهمال الأدلة المعارضة.",
    analogyFr: "Un enquêteur qui ne regarde que les indices incriminant son premier suspect et jette à la poubelle ceux qui l'innocentent.",
    trapFr: "Croire que la multiplicité des textes cités prouve une thèse, alors qu'on a systématiquement ignoré les textes contraires du même corpus.",
  },
];

/**
 * Récupère un terme du glossaire par son identifiant unique
 */
export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  const normalized = id.toLowerCase().trim();
  return GLOSSARY_TERMS.find((t) => t.id === normalized);
}

/**
 * Récupère tous les termes du glossaire
 */
export function getAllGlossaryTerms(): GlossaryTerm[] {
  return [...GLOSSARY_TERMS];
}

/**
 * Recherche dans le glossaire par mot-clé (FR ou AR)
 */
export function searchGlossary(query: string): GlossaryTerm[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllGlossaryTerms();

  return GLOSSARY_TERMS.filter(
    (t) =>
      t.id.includes(q) ||
      t.termFr.toLowerCase().includes(q) ||
      t.termAr.includes(q) ||
      t.shortDefinitionFr.toLowerCase().includes(q) ||
      t.shortDefinitionAr.includes(q) ||
      t.analogyFr.toLowerCase().includes(q) ||
      t.trapFr.toLowerCase().includes(q)
  );
}

/**
 * Filtre les termes par catégorie
 */
export function getGlossaryTermsByCategory(category: GlossaryCategory): GlossaryTerm[] {
  return GLOSSARY_TERMS.filter((t) => t.category === category);
}
