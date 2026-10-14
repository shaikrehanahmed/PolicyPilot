"""Complete 4-Language Localization Registry for PolicyPilot Backend (EN, TE, HI, UR).

CRITICAL GUARDRAILS:
1. Official scheme names, monetary figures (₹6,000, ₹5,00,000, ₹2,50,000, ₹1,20,000, ₹12,000),
   statutory clause numbers, and official URLs are preserved with 100% factual accuracy.
2. Provides full translations for English ('en'), Telugu ('te'), Hindi ('hi'), and Urdu ('ur').
"""
from __future__ import annotations

from typing import Any, Dict

SUPPORTED_LANGUAGES = ("en", "te", "hi", "ur")

DISCLAIMERS: Dict[str, str] = {
    "en": (
        "This guidance is grounded in official portal manuals and gazette rules. "
        "It does not constitute government approval or guarantee reversal of a rejection."
    ),
    "te": (
        "ఈ సమాచారం అధికారిక పోర్టల్ నిబంధనలు మరియు గెజిట్ ఆధారంగా అందించబడింది. "
        "ఇది ప్రభుత్వ ఆమోదానికి లేదా తిరస్కరణ రద్దుకు హామీ ఇవ్వదు."
    ),
    "hi": (
        "यह मार्गदर्शन आधिकारिक पोर्टल नियमावली और गजट नियमों पर आधारित है। "
        "यह सरकारी स्वीकृति या अस्वीकृति के पलटने की गारंटी नहीं देता है।"
    ),
    "ur": (
        "یہ رہنمائی سرکاری پورٹل کے دستور العمل اور گزٹ قواعد پر مبنی ہے۔ "
        "یہ سرکاری منظوری یا مسترد شدہ درخواست کی بحالی کی ضمانت نہیں دیتی۔"
    ),
}

ACTOR_LABELS: Dict[str, Dict[str, str]] = {
    "STUDENT_APPLICANT": {
        "en": "Action Required by Student Applicant (via NSP OTR & Applicant Portal)",
        "te": "విద్యార్థి స్వయంగా చేయవలసిన పని (NSP OTR & పోర్టల్ ద్వారా)",
        "hi": "छात्र आवेदक द्वारा की जाने वाली कार्रवाई (NSP OTR और पोर्टल के माध्यम से)",
        "ur": "طالب علم درخواست گزار کی طرف سے ضروری کارروائی (NSP OTR اور پورٹل کے ذریعے)",
    },
    "INSTITUTE_NODAL_OFFICER": {
        "en": "Action Required by College Institute Nodal Officer (INO) after Student Re-submission",
        "te": "కళాశాల నోడల్ అధికారి (INO) చేయవలసిన ధృవీకరణ (విద్యార్థి రీ-సబ్మిట్ చేసిన తర్వాత)",
        "hi": "छात्र द्वारा पुनः सबमिट करने के बाद कॉलेज नोडल अधिकारी (INO) द्वारा सत्यापन आवश्यक",
        "ur": "طالب علم کے دوبارہ جمع کرانے کے بعد کالج انسٹی ٹیوٹ نوڈل آفیسر (INO) کی طرف سے تصدیق ضروری ہے",
    },
    "BANK_OR_NPCI_DESK": {
        "en": "Action Required at Bank Branch / India Post Payments Bank (NPCI DBT Mapper Desk)",
        "te": "బ్యాంక్ బ్రాంచ్ / పోస్టాఫీసు బ్యాంక్ (NPCI DBT మ్యాపర్ డెస్క్) వద్ద చేయవలసిన పని",
        "hi": "बैंक शाखा / इंडिया पोस्ट पेमेंट्स बैंक (NPCI DBT मैपर डेस्क) पर कार्रवाई आवश्यक",
        "ur": "بینک برانچ / انڈیا پوسٹ پیمنٹس بینک (NPCI DBT میپر ڈیسک) پر کارروائی ضروری ہے",
    },
    "STATE_OR_DISTRICT_NODAL_AUTHORITY": {
        "en": "Pending with District / State Nodal Welfare Authority",
        "te": "జిల్లా / రాష్ట్ర సంక్షేమ నోడల్ అధికారి వద్ద పెండింగ్లో ఉంది",
        "hi": "जिला / राज्य नोडल कल्याण प्राधिकरण के स्तर पर लंबित",
        "ur": "ضلع / ریاستی نوڈل ویلفیئر اتھارٹی کے پاس زیر التواء",
    },
    "MEESEVA_OR_CSC_CENTRE": {
        "en": "Action Required at Authorized MeeSeva / Common Service Centre (CSC)",
        "te": "మీసేవ (MeeSeva) లేదా కామన్ సర్వీస్ సెంటర్ (CSC) వద్ద చేయవలసిన పని",
        "hi": "अधिकृत मीसेवा (MeeSeva) या कॉमन सर्विस सेंटर (CSC) पर कार्रवाई आवश्यक",
        "ur": "مجاز می سیوا (MeeSeva) یا کامن سروس سینٹر (CSC) پر کارروائی ضروری ہے",
    },
    "NO_ACTION_REQUIRED_WAIT": {
        "en": "No Citizen Action Needed Right Now (Automated Server Batch Queue)",
        "te": "ప్రస్తుతం మీరు ఏమీ చేయనవసరం లేదు (ఆటోమేటిక్ సర్వర్ బ్యాచ్ ప్రాసెసింగ్ జరుగుతోంది)",
        "hi": "अभी आपको कुछ करने की आवश्यकता नहीं है (सर्वर स्तर पर बैच सत्यापन जारी है)",
        "ur": "ابھی آپ کو کچھ کرنے کی ضرورت نہیں ہے (سرور پر خودکار بیچ تصدیق جاری ہے)",
    },
}

# Localized Scheme Metadata (Preserves official names & exact ₹ figures)
SCHEME_TRANSLATIONS: Dict[str, Dict[str, Dict[str, str]]] = {
    "pm-kisan": {
        "name": {
            "en": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
            "te": "ప్రధాన్ మంత్రి కిసాన్ సమ్మాన్ నిధి (PM-KISAN)",
            "hi": "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
            "ur": "پردھان منتری کسان سمان ندھی (PM-KISAN)",
        },
        "description": {
            "en": "Centrally sponsored income support of ₹6,000 per year in three equal installments of ₹2,000 directly via DBT to all landholding farmer families across the country, subject to statutory exclusion criteria.",
            "te": "దేశంలోని సాగు భూమి కలిగిన రైతు కుటుంబాలకు ఏడాదికి ₹6,000 ఆర్థిక సహాయం (మూడు విడతలలో ₹2,000 చొప్పున) నేరుగా బ్యాంక్ ఖాతాలోకి (DBT) జమ చేయబడుతుంది.",
            "hi": "देश भर के सभी भूमिधारक किसान परिवारों को प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से ₹2,000 की तीन समान किस्तों में ₹6,000 प्रति वर्ष की आय सहायता।",
            "ur": "ملک بھر کے تمام زمیندار کسان خاندانوں کو DBT کے ذریعے ₹2,000 کی تین مساوی قسطوں میں سالانہ ₹6,000 کی مالی امداد۔",
        },
    },
    "pm-jay": {
        "name": {
            "en": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
            "te": "ఆయుష్మాన్ భారత్ - ప్రధాన్ మంత్రి జన్ ఆరోగ్య యోజన (AB-PMJAY)",
            "hi": "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)",
            "ur": "آیوشمان بھارت - پردھان منتری جن آروگیہ یوجنا (AB-PMJAY)",
        },
        "description": {
            "en": "Health cover of ₹5,00,000 per family per year for secondary and tertiary hospitalization to vulnerable families under SECC 2011 criteria, AND universal ₹5,00,000 cover for all senior citizens aged 70+ (100% cashless).",
            "te": "అర్హులైన పేద కుటుంబాలకు మరియు 70 ఏళ్లు నిండిన సీనియర్ సిటిజన్లందరికీ కుటుంబానికి ఏడాదికి ₹5,00,000 వరకు 100% నగదు రహిత (Cashless) ఆసుపత్రి వైద్య సదుపాయం.",
            "hi": "SECC 2011 मानदंडों के तहत पात्र परिवारों और 70 वर्ष से अधिक आयु के सभी वरिष्ठ नागरिकों के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 का 100% कैशलेस स्वास्थ्य कवर।",
            "ur": "مستحق خاندانوں اور 70 سال سے زائد عمر کے تمام بزرگ شہریوں کے لیے سالانہ ₹5,00,000 تک کا 100% کیش لیس ہسپتال علاج۔",
        },
    },
    "pmay-g": {
        "name": {
            "en": "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
            "te": "ప్రధాన్ మంత్రి ఆవాస్ యోజన - గ్రామీణ (PMAY-G)",
            "hi": "प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
            "ur": "پردھان منتری آواس یوجنا - گرامین (PMAY-G)",
        },
        "description": {
            "en": "Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly areas for construction of a pucca house to rural houseless families and families living in kutcha houses.",
            "te": "గ్రామీణ ప్రాంతాల్లో ఇల్లు లేని లేదా కచ్చా ఇళ్లలో నివసించే కుటుంబాలకు పక్కా ఇంటి నిర్మాణం కోసం ₹1,20,000 (మైదాన ప్రాంతాల్లో) మరియు ₹1,30,000 (కొండ ప్రాంతాల్లో) ఆర్థిక సహాయం.",
            "hi": "ग्रामीण बेघर परिवारों और कच्चे घरों में रहने वाले परिवारों को पक्का घर बनाने के लिए मैदानी क्षेत्रों में ₹1,20,000 और पहाड़ी क्षेत्रों में ₹1,30,000 की वित्तीय सहायता।",
            "ur": "دیہی بے گھر خاندانوں اور کچے مکانوں میں رہنے والے خاندانوں کو پکا مکان بنانے کے لیے میدانی علاقوں میں ₹1,20,000 اور پہاڑی علاقوں میں ₹1,30,000 کی مالی امداد۔",
        },
    },
    "nsp-post-matric": {
        "name": {
            "en": "Post-Matric Scholarship for SC Students",
            "te": "SC విద్యార్థులకు పోస్ట్-మెట్రిక్ స్కాలర్షిప్ (NSP)",
            "hi": "अनुसूचित जाति (SC) के छात्रों के लिए पोस्ट-मैट्रिक छात्रवृत्ति (NSP)",
            "ur": "ایس سی (SC) طلباء کے لیے پوسٹ میٹرک اسکالرشپ (NSP)",
        },
        "description": {
            "en": "Centrally Sponsored Post-Matric Scholarship Scheme for SC Students studying in recognized post-matriculation or post-secondary courses with parental annual income up to ₹2,50,000, covering tuition fees and maintenance allowance.",
            "te": "గుర్తింపు పొందిన కళాశాలల్లో పోస్ట్-మెట్రిక్ కోర్సులు చదువుతున్న SC విద్యార్థులకు (తల్లిదండ్రుల వార్షిక ఆదాయం ₹2,50,000 లోపు ఉంటే) ట్యూషన్ ఫీజు రీయింబర్స్మెంట్ మరియు మెయింటెనెన్స్ అలవెన్స్.",
            "hi": "मान्यता प्राप्त संस्थानों में अध्ययनरत SC छात्रों (जिनकी पारिवारिक वार्षिक आय ₹2,50,000 तक है) के लिए पूर्ण शिक्षण शुल्क प्रतिपूर्ति और भत्ता।",
            "ur": "تسلیم شدہ تعلیمی اداروں میں زیر تعلیم SC طلباء (جن کے والدین کی سالانہ آمدنی ₹2,50,000 تک ہے) کے لیے ٹیوشن فیس اور تعلیمی الاؤنس۔",
        },
    },
    "rythu-bharosa": {
        "name": {
            "en": "Rythu Bharosa (Telangana Agriculture Investment Support)",
            "te": "రైతు భరోసా (తెలంగాణ వ్యవసాయ పెట్టుబడి సహాయం)",
            "hi": "रायथू भरोसा (तेलंगाना कृषि निवेश सहायता योजना)",
            "ur": "رعیتو بھروسہ (تلنگانہ زرعی سرمایہ کاری امداد)",
        },
        "description": {
            "en": "Agricultural investment assistance of ₹12,000 per acre annually (₹6,000 per season for Kharif and Rabi) provided by the Government of Telangana to landholding farmers possessing digital Pattadar Passbooks.",
            "te": "డిజిటల్ పట్టాదారు పాస్బుక్ కలిగిన తెలంగాణ రైతులకు పంట పెట్టుబడి సహాయంగా ఎకరానికి ఏడాదికి ₹12,000 (వానాకాలం ₹6,000 + యాసంగి ₹6,000) అందించే రాష్ట్ర ప్రభుత్వ పథకం.",
            "hi": "डिजिटल पट्टादार पासबुक रखने वाले तेलंगाना के किसानों को खरीफ और रबी सीजन के लिए ₹6,000 प्रति सीजन (₹12,000 प्रति एकड़ वार्षिक) की कृषि निवेश सहायता।",
            "ur": "ڈیجیٹل پٹہ دار پاس بک رکھنے والے تلنگانہ کے کسانوں کو خریف اور ربیع سیزن کے لیے سالانہ ₹12,000 فی ایکڑ (₹6,000 فی سیزن) زرعی امداد۔",
        },
    },
}


def normalize_lang(lang: str | None) -> str:
    clean = (lang or "en").lower().strip()[:2]
    return clean if clean in SUPPORTED_LANGUAGES else "en"


def get_localized_text(translations: Dict[str, str], lang: str = "en") -> str:
    clean_lang = normalize_lang(lang)
    return translations.get(clean_lang) or translations.get("en", "")


def get_disclaimer(lang: str = "en") -> str:
    return get_localized_text(DISCLAIMERS, lang)


def get_actor_explanation(actor_key: str, lang: str = "en") -> str:
    actor_dict = ACTOR_LABELS.get(actor_key, ACTOR_LABELS["STUDENT_APPLICANT"])
    return get_localized_text(actor_dict, lang)


def localize_scheme_dict(scheme: Dict[str, Any], lang: str = "en") -> Dict[str, Any]:
    """Attaches localized title and description while preserving official English wording."""
    clean_lang = normalize_lang(lang)
    enriched = dict(scheme)
    slug = scheme.get("slug", "")
    enriched["official_name"] = scheme.get("name", "")
    if clean_lang != "en" and slug in SCHEME_TRANSLATIONS:
        tr = SCHEME_TRANSLATIONS[slug]
        if "name" in tr:
            enriched["localized_name"] = get_localized_text(tr["name"], clean_lang)
        if "description" in tr:
            enriched["localized_description"] = get_localized_text(tr["description"], clean_lang)
    return enriched
