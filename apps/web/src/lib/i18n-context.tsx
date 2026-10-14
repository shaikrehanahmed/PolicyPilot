"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { LanguageCode, Scheme } from "./types";

export const LANGUAGE_OPTIONS: {
  code: LanguageCode;
  nativeLabel: string;
  englishLabel: string;
  speechLang: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", nativeLabel: "English", englishLabel: "English", speechLang: "en-IN", dir: "ltr" },
  { code: "te", nativeLabel: "తెలుగు", englishLabel: "Telugu", speechLang: "te-IN", dir: "ltr" },
  { code: "hi", nativeLabel: "हिन्दी", englishLabel: "Hindi", speechLang: "hi-IN", dir: "ltr" },
  { code: "ur", nativeLabel: "اردو", englishLabel: "Urdu", speechLang: "ur-IN", dir: "rtl" },
];

export const UI_STRINGS: Record<string, Record<LanguageCode, string>> = {
  "announcements.badge": {
    "en": "Official Ministry Notifications & SHA-256 Change Detection",
    "te": "అధికారిక ప్రభుత్వ ప్రకటనలు & SHA-256 మార్పుల గుర్తింపు",
    "hi": "आधिकारिक मंत्रालय अधिसूचनाएं और SHA-256 परिवर्तन जांच",
    "ur": "سرکاری وزارت کے نوٹیفکیشنز اور SHA-256 تبدیلی کی شناخت"
  },
  "announcements.benefits.label": {
    "en": "Verified Benefits:",
    "te": "ధృవీకరించబడిన ప్రయోజనాలు:",
    "hi": "सत्यापित लाभ:",
    "ur": "تصدیق شدہ فوائد:"
  },
  "announcements.btn.check": {
    "en": "Run Official Source Change & Deduplication Check",
    "te": "అధికారిక మూలాల మార్పు & డూప్లికేట్ తనిఖీని రన్ చేయండి",
    "hi": "आधिकारिक स्रोत परिवर्तन और डुप्लीकेट जांच चलाएं",
    "ur": "سرکاری ذرائع کی تبدیلی اور ڈپلیکیٹ چیک چلائیں"
  },
  "announcements.deadline.label": {
    "en": "Deadlines & Window:",
    "te": "గడువు తేదీలు:",
    "hi": "अंतिम तिथि और समय-सीमा:",
    "ur": "آخری تاریخ اور مدت:"
  },
  "announcements.eligibility.label": {
    "en": "Verified Eligibility:",
    "te": "ధృవీకరించబడిన అర్హతలు:",
    "hi": "सत्यापित पात्रता:",
    "ur": "تصدیق شدہ اہلیت:"
  },
  "announcements.official.portal": {
    "en": "Official Application Portal",
    "te": "అధికారిక దరఖాస్తు పోర్టల్",
    "hi": "आधिकारिक आवेदन पोर्टल",
    "ur": "سرکاری درخواست پورٹل"
  },
  "announcements.review.section": {
    "en": "Detected Notices Awaiting Gazette Verification",
    "te": "గెజిట్ ధృవీకరణ కోసం వేచి ఉన్న ముసాయిదా ప్రకటనలు",
    "hi": "गजट सत्यापन की प्रतीक्षा कर रही संसूचित सूचनाएं",
    "ur": "گزٹ تصدیق کے منتظر مسودہ نوٹسز"
  },
  "announcements.subtitle": {
    "en": "Verified notifications anchored to official ministry portals with SHA-256 deduplication and strict separation between Verified rules and items Awaiting Review.",
    "te": "అధికారిక ప్రభుత్వ పోర్టల్ లింకులు, SHA-256 డూప్లికేట్ నివారణ మరియు ధృవీకరించబడిన నిబంధనలతో కూడిన సమాచారం.",
    "hi": "आधिकारिक मंत्रालय पोर्टलों से जुड़े सत्यापित अपडेट, SHA-256 डुप्लीकेट रोकथाम और समीक्षाधीन सूचनाओं का स्पष्ट पृथक्करण।",
    "ur": "سرکاری پورٹلز سے تصدیق شدہ اعلانات، SHA-256 ڈپلیکیٹ روک تھام اور زیرِ جائزہ معلومات کی واضح تفریق۔"
  },
  "announcements.title": {
    "en": "Official Government Scheme Announcements & Updates",
    "te": "కొత్త ప్రభుత్వ పథకాల ప్రకటనలు & అధికారిక అప్డేట్లు",
    "hi": "नई सरकारी योजना घोषणाएं और आधिकारिक अपडेट",
    "ur": "سرکاری اسکیموں کے نئے اعلانات اور اپ ڈیٹس"
  },
  "announcements.verified.section": {
    "en": "Verified Scheme Announcements & Active Policy Updates",
    "te": "ధృవీకరించబడిన ప్రభుత్వ పథకాల ప్రకటనలు & అప్డేట్లు",
    "hi": "सत्यापित योजना घोषणाएं और सक्रिय नीति अपडेट",
    "ur": "تصدیق شدہ اسکیم اعلانات اور فعال پالیسی اپ ڈیٹس"
  },
  "announcements_badge": {
    "en": "Official Ministry Notifications & SHA-256 Change Detection",
    "te": "అధికారిక ప్రభుత్వ ప్రకటనలు & SHA-256 మార్పుల గుర్తింపు",
    "hi": "आधिकारिक मंत्रालय अधिसूचनाएं और SHA-256 परिवर्तन जांच",
    "ur": "سرکاری وزارت کے نوٹیفکیشنز اور SHA-256 تبدیلی کی شناخت"
  },
  "announcements_benefits_label": {
    "en": "Verified Benefits:",
    "te": "ధృవీకరించబడిన ప్రయోజనాలు:",
    "hi": "सत्यापित लाभ:",
    "ur": "تصدیق شدہ فوائد:"
  },
  "announcements_btn_check": {
    "en": "Run Official Source Change & Deduplication Check",
    "te": "అధికారిక మూలాల మార్పు & డూప్లికేట్ తనిఖీని రన్ చేయండి",
    "hi": "आधिकारिक स्रोत परिवर्तन और डुप्लीकेट जांच चलाएं",
    "ur": "سرکاری ذرائع کی تبدیلی اور ڈپلیکیٹ چیک چلائیں"
  },
  "announcements_deadline_label": {
    "en": "Deadlines & Window:",
    "te": "గడువు తేదీలు:",
    "hi": "अंतिम तिथि और समय-सीमा:",
    "ur": "آخری تاریخ اور مدت:"
  },
  "announcements_eligibility_label": {
    "en": "Verified Eligibility:",
    "te": "ధృవీకరించబడిన అర్హతలు:",
    "hi": "सत्यापित पात्रता:",
    "ur": "تصدیق شدہ اہلیت:"
  },
  "announcements_official_portal": {
    "en": "Official Application Portal",
    "te": "అధికారిక దరఖాస్తు పోర్టల్",
    "hi": "आधिकारिक आवेदन पोर्टल",
    "ur": "سرکاری درخواست پورٹل"
  },
  "announcements_review_section": {
    "en": "Detected Notices Awaiting Gazette Verification",
    "te": "గెజిట్ ధృవీకరణ కోసం వేచి ఉన్న ముసాయిదా ప్రకటనలు",
    "hi": "गजट सत्यापन की प्रतीक्षा कर रही संसूचित सूचनाएं",
    "ur": "گزٹ تصدیق کے منتظر مسودہ نوٹسز"
  },
  "announcements_subtitle": {
    "en": "Verified notifications anchored to official ministry portals with SHA-256 deduplication and strict separation between Verified rules and items Awaiting Review.",
    "te": "అధికారిక ప్రభుత్వ పోర్టల్ లింకులు, SHA-256 డూప్లికేట్ నివారణ మరియు ధృవీకరించబడిన నిబంధనలతో కూడిన సమాచారం.",
    "hi": "आधिकारिक मंत्रालय पोर्टलों से जुड़े सत्यापित अपडेट, SHA-256 डुप्लीकेट रोकथाम और समीक्षाधीन सूचनाओं का स्पष्ट पृथक्करण।",
    "ur": "سرکاری پورٹلز سے تصدیق شدہ اعلانات، SHA-256 ڈپلیکیٹ روک تھام اور زیرِ جائزہ معلومات کی واضح تفریق۔"
  },
  "announcements_title": {
    "en": "Official Government Scheme Announcements & Updates",
    "te": "కొత్త ప్రభుత్వ పథకాల ప్రకటనలు & అధికారిక అప్డేట్లు",
    "hi": "नई सरकारी योजना घोषणाएं और आधिकारिक अपडेट",
    "ur": "سرکاری اسکیموں کے نئے اعلانات اور اپ ڈیٹس"
  },
  "announcements_verified_section": {
    "en": "Verified Scheme Announcements & Active Policy Updates",
    "te": "ధృవీకరించబడిన ప్రభుత్వ పథకాల ప్రకటనలు & అప్డేట్లు",
    "hi": "सत्यापित योजना घोषणाएं और सक्रिय नीति अपडेट",
    "ur": "تصدیق شدہ اسکیم اعلانات اور فعال پالیسی اپ ڈیٹس"
  },
  "brand.tagline": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "brand_tagline": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "btn.back": {
    "en": "Back",
    "te": "వెనుకకు",
    "hi": "वापस जाएं",
    "ur": "واپس جائیں"
  },
  "btn.close": {
    "en": "Close",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "btn_back": {
    "en": "Back",
    "te": "వెనుకకు",
    "hi": "वापस जाएं",
    "ur": "واپس جائیں"
  },
  "btn_close": {
    "en": "Close",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "common.back": {
    "en": "Back",
    "te": "వెనుకకు",
    "hi": "वापस जाएं",
    "ur": "واپس جائیں"
  },
  "common.close": {
    "en": "Close",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "common.income": {
    "en": "Annual Income",
    "te": "వార్షిక ఆదాయం",
    "hi": "वार्षिक आय",
    "ur": "سالانہ آمدنی"
  },
  "common.landholding": {
    "en": "Landholding",
    "te": "భూమి విస్తీర్ణం",
    "hi": "भूमि स्वामित्व",
    "ur": "زرعی اراضی"
  },
  "common.loading": {
    "en": "Loading...",
    "te": "లోడ్ అవుతోంది...",
    "hi": "लोड हो रहा है...",
    "ur": "لوڈ ہو رہا ہے..."
  },
  "common.occupation": {
    "en": "Occupation",
    "te": "వృత్తి",
    "hi": "व्यवसाय",
    "ur": "پیشہ"
  },
  "common.officialPortal": {
    "en": "Official Portal",
    "te": "అధికారిక పోర్టల్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹل"
  },
  "common.retry": {
    "en": "Retry",
    "te": "మళ్లీ ప్రయత్నించండి",
    "hi": "पुनः प्रयास करें",
    "ur": "دوبارہ کوشش کریں"
  },
  "common.state": {
    "en": "State",
    "te": "రాష్ట్రం",
    "hi": "राज्य",
    "ur": "ریاست"
  },
  "common_back": {
    "en": "Back",
    "te": "వెనుకకు",
    "hi": "वापस जाएं",
    "ur": "واپس جائیں"
  },
  "common_close": {
    "en": "Close",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "common_income": {
    "en": "Annual Income",
    "te": "వార్షిక ఆదాయం",
    "hi": "वार्षिक आय",
    "ur": "سالانہ آمدنی"
  },
  "common_landholding": {
    "en": "Landholding",
    "te": "భూమి విస్తీర్ణం",
    "hi": "भूमि स्वामित्व",
    "ur": "زرعی اراضی"
  },
  "common_loading": {
    "en": "Loading...",
    "te": "లోడ్ అవుతోంది...",
    "hi": "लोड हो रहा है...",
    "ur": "لوڈ ہو رہا ہے..."
  },
  "common_occupation": {
    "en": "Occupation",
    "te": "వృత్తి",
    "hi": "व्यवसाय",
    "ur": "پیشہ"
  },
  "common_officialPortal": {
    "en": "Official Portal",
    "te": "అధికారిక పోర్టల్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹل"
  },
  "common_retry": {
    "en": "Retry",
    "te": "మళ్లీ ప్రయత్నించండి",
    "hi": "पुनः प्रयास करें",
    "ur": "دوبارہ کوشش کریں"
  },
  "common_state": {
    "en": "State",
    "te": "రాష్ట్రం",
    "hi": "राज्य",
    "ur": "ریاست"
  },
  "detail.actionPlan": {
    "en": "Personalized Action Roadmap",
    "te": "దశలవారీ దరఖాస్తు ప్రణాళిక",
    "hi": "व्यक्तिगत आवेदन कार्ययोजना",
    "ur": "مرحلہ وار درخواست کا منصوبہ"
  },
  "detail.actionPlanDesc": {
    "en": "Step-by-step roadmap to successfully prepare and apply for this scheme.",
    "te": "ఈ పథకానికి విజయవంతంగా దరఖాస్తు చేసుకోవడానికి దశలవారీ మార్గదర్శకం.",
    "hi": "इस योजना के लिए सफलतापूर्वक तैयारी और आवेदन करने हेतु चरणबद्ध रोडमैप।",
    "ur": "اس اسکیم کے لیے کامیابی سے تیاری اور درخواست دینے کا مرحلہ وار روڈ میپ۔"
  },
  "detail.actionPlanTitle": {
    "en": "Personalized Application Action Plan",
    "te": "వ్యక్తిగతీకరించిన దరఖాస్తు కార్యాచరణ ప్రణాళిక",
    "hi": "व्यक्तिगत आवेदन कार्य योजना",
    "ur": "ذاتی نوعیت کا درخواست ایکشن پلان"
  },
  "detail.activeProfile": {
    "en": "Active Evaluation Profile",
    "te": "యాక్టివ్ మూల్యాంకన ప్రొఫైల్",
    "hi": "सक्रिय मूल्यांकन प्रोफ़ाइल",
    "ur": "فعال تشخیصی پروفائل"
  },
  "detail.agentWorkflow": {
    "en": "Run LangGraph Agent",
    "te": "లాంగ్‌గ్రాఫ్ ఏజెంట్‌ని ప్రారంభించండి",
    "hi": "लैंगग्राफ एजेंट चलाएं",
    "ur": "لینگ گراف ایجنٹ چلائیں"
  },
  "detail.back": {
    "en": "Back to Schemes",
    "te": "పథకాల జాబితాకు తిరిగి వెళ్లండి",
    "hi": "योजनाओं पर वापस जाएं",
    "ur": "اسکیموں پر واپس جائیں"
  },
  "detail.clauseInGazette": {
    "en": "Clause in Gazette",
    "te": "గెజిట్‌లోని నిబంధన",
    "hi": "राजपत्र में खंड",
    "ur": "گزٹ کی شق"
  },
  "detail.closeCitation": {
    "en": "Close Citation",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "detail.closeTrace": {
    "en": "Close Trace",
    "te": "ట్రేస్ మూసివేయి",
    "hi": "ट्रेस बंद करें",
    "ur": "ٹریس بند کریں"
  },
  "detail.conditionHeader": {
    "en": "Rule Condition",
    "te": "నిబంధన షరతు",
    "hi": "नियम शर्त",
    "ur": "قاعدے کی شرط"
  },
  "detail.criteriaChecklist": {
    "en": "Eligibility Criteria Breakdown",
    "te": "అర్హత నిబంధనల వివరాలు",
    "hi": "पात्रता शर्तों का विवरण",
    "ur": "اہلیت کے قواعد کی تفصیلات"
  },
  "detail.criterionHeader": {
    "en": "Criterion & Description",
    "te": "నిబంధన & వివరణ",
    "hi": "मानदंड और विवरण",
    "ur": "معیار اور وضاحت"
  },
  "detail.documentsChecklistDesc": {
    "en": "Verify you have these documents ready prior to online portal submission.",
    "te": "ఆన్‌లైన్ పోర్టల్‌లో సమర్పించే ముందు ఈ పత్రాలు మీ వద్ద ఉన్నాయని నిర్ధారించుకోండి.",
    "hi": "ऑनलाइन पोर्टल पर जमा करने से पहले सुनिश्चित करें कि ये दस्तावेज तैयार हैं।",
    "ur": "آن لائن پورٹل پر جمع کرانے سے پہلے یقینی بنائیں کہ یہ دستاویزات تیار ہیں۔"
  },
  "detail.documentsChecklistTitle": {
    "en": "Required Documents Checklist",
    "te": "అవసరమైన పత్రాల జాబితా",
    "hi": "आवश्यक दस्तावेजों की चेकलिस्ट",
    "ur": "ضروری دستاویزات کی فہرست"
  },
  "detail.editProfile": {
    "en": "Edit Demographic Profile →",
    "te": "డెమోగ్రాఫిక్ ప్రొఫైల్‌ను సవరించండి →",
    "hi": "जनसांख्यिकीय प्रोफ़ाइल संपादित करें →",
    "ur": "آبادیاتی پروفائل میں ترمیم کریں ←"
  },
  "detail.evalMatrix": {
    "en": "Criterion-by-Criterion Evaluation Matrix",
    "te": "ప్రతి నిబంధన యొక్క మూల్యాంకన పట్టిక",
    "hi": "मानदंड-दर-मानदंड मूल्यांकन मैट्रिक्स",
    "ur": "معیار بہ معیار تشخیصی میٹرکس"
  },
  "detail.evalMatrixDesc": {
    "en": "Every rule is deterministically tested against your profile attributes. Zero LLM hallucinations.",
    "te": "ప్రతి నిబంధన మీ ప్రొఫైల్ వివరాల ఆధారంగా కచ్చితంగా పరీక్షించబడుతుంది. తప్పుడు సమాచారానికి తావులేదు.",
    "hi": "प्रत्येक नियम का आपकी प्रोफ़ाइल विशेषताओं के साथ सटीक परीक्षण किया जाता है। शून्य भ्रम।",
    "ur": "ہر اصول کو آپ کے پروفائل کی خصوصیات کے مطابق جانچا جاتا ہے۔ صفر غلط بیانی۔"
  },
  "detail.evaluationCompleteness": {
    "en": "Evaluation",
    "te": "మూల్యాంకనం",
    "hi": "मूल्यांकन",
    "ur": "تشخیص"
  },
  "detail.evaluationSummary": {
    "en": "Deterministic Rules Evaluation",
    "te": "ఖచ్చితమైన అర్హత నిబంధనల ఫలితం",
    "hi": "नियम-आधारित पात्रता मूल्यांकन",
    "ur": "اہلیت کے ضوابط کا تجزیہ"
  },
  "detail.evidence": {
    "en": "Official Gazette Evidence & Citations",
    "te": "అధికారిక గెజిట్ ఆధారాలు",
    "hi": "आधिकारिक गजट प्रमाण और संदर्भ",
    "ur": "سرکاری گزٹ کے حوالہ جات"
  },
  "detail.evidenceHeader": {
    "en": "Official Citation & Evidence",
    "te": "అధికారిక ఆధారాలు & కొటేషన్",
    "hi": "आधिकारिक साक्ष्य और उद्धरण",
    "ur": "سرکاری ثبوت اور حوالہ"
  },
  "detail.loadFailed": {
    "en": "Failed to load scheme details",
    "te": "పథకం వివరాలను లోడ్ చేయడంలో విఫలమైంది",
    "hi": "योजना का विवरण लोड करने में विफल",
    "ur": "اسکیم کی تفصیلات لوڈ کرنے میں ناکامی"
  },
  "detail.met": {
    "en": "MET",
    "te": "సరిపోయింది",
    "hi": "संतुष्ट",
    "ur": "پورا ہوا"
  },
  "detail.missingAttribute": {
    "en": "Missing attribute",
    "te": "విలువ నమోదు చేయలేదు",
    "hi": "विवरण अनुपलब्ध",
    "ur": "معلومات درج نہیں"
  },
  "detail.needsVerification": {
    "en": "NEEDS VERIFICATION",
    "te": "ధృవీకరణ అవసరం",
    "hi": "सत्यापन आवश्यक",
    "ur": "تصدیق درکار ہے"
  },
  "detail.nodalAuthority": {
    "en": "Nodal Authority",
    "te": "నోడల్ అథారిటీ",
    "hi": "नोडल प्राधिकरण",
    "ur": "نوڈل اتھارٹی"
  },
  "detail.notFound": {
    "en": "Scheme Not Found",
    "te": "పథకం కనుగొనబడలేదు",
    "hi": "योजना नहीं मिली",
    "ur": "اسکیم نہیں ملی"
  },
  "detail.notFoundDesc": {
    "en": "The requested scheme could not be located in the repository.",
    "te": "అభ్యర్థించిన పథకం రిపోజిటరీలో కనుగొనబడలేదు.",
    "hi": "अनुरोधित योजना रिपॉजिटरी में नहीं मिली।",
    "ur": "درخواست کردہ اسکیم ڈیٹا بیس میں نہیں مل سکی۔"
  },
  "detail.notMet": {
    "en": "NOT MET",
    "te": "సరిపోలేదు",
    "hi": "असंतुष्ट",
    "ur": "پورا نہیں ہوا"
  },
  "detail.officialPortal": {
    "en": "Official Portal",
    "te": "అధికారిక పోర్టల్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹل"
  },
  "detail.officialQuote": {
    "en": "Official Excerpt Quote:",
    "te": "అధికారిక ఉల్లేఖనం:",
    "hi": "आधिकारिक उद्धरण:",
    "ur": "سرکاری اقتباس:"
  },
  "detail.officialRules": {
    "en": "Official Rules",
    "te": "అధికారిక నిబంధనలు",
    "hi": "आधिकारिक नियम",
    "ur": "سرکاری قواعد"
  },
  "detail.plainSynthesis": {
    "en": "Plain-Language Synthesis",
    "te": "సరళమైన భాషా వివరణ",
    "hi": "सरल भाषा संश्लेषण",
    "ur": "آسان زبان کا تجزیہ"
  },
  "detail.profileValueHeader": {
    "en": "Your Profile Value",
    "te": "మీ ప్రొఫైల్ విలువ",
    "hi": "आपकी प्रोफ़ाइल मान",
    "ur": "آپ کا پروفائل ڈیٹا"
  },
  "detail.referencedClause": {
    "en": "Referenced Clause:",
    "te": "సూచించబడిన నిబంధన:",
    "hi": "संदर्भित खंड:",
    "ur": "حوالہ شدہ شق:"
  },
  "detail.requiredDocs": {
    "en": "Required Official Documents",
    "te": "అవసరమైన అధికారిక సర్టిఫికెట్లు",
    "hi": "आवश्यक आधिकारिक दस्तावेज",
    "ur": "مطلوبہ سرکاری دستاویزات"
  },
  "detail.resultStateHeader": {
    "en": "Result State",
    "te": "ఫలిత స్థితి",
    "hi": "परिणाम स्थिति",
    "ur": "نتیجہ کی کیفیت"
  },
  "detail.sourceCitation": {
    "en": "Official Source Citation",
    "te": "అధికారిక మూల ఉల్లేఖనం",
    "hi": "आधिकारिक स्रोत उद्धरण",
    "ur": "سرکاری ماخذ کا حوالہ"
  },
  "detail.unknown": {
    "en": "UNKNOWN",
    "te": "తెలియదు",
    "hi": "अज्ञात",
    "ur": "نامعلوم"
  },
  "detail.visitPortal": {
    "en": "Visit Official Application Portal",
    "te": "అధికారిక దరఖాస్తు పోర్టల్‌ను సందర్శించండి",
    "hi": "आधिकारिक आवेदन पोर्टल पर जाएं",
    "ur": "سرکاری درخواست پورٹل دیکھیں"
  },
  "detail_actionPlan": {
    "en": "Personalized Action Roadmap",
    "te": "దశలవారీ దరఖాస్తు ప్రణాళిక",
    "hi": "व्यक्तिगत आवेदन कार्ययोजना",
    "ur": "مرحلہ وار درخواست کا منصوبہ"
  },
  "detail_actionPlanDesc": {
    "en": "Step-by-step roadmap to successfully prepare and apply for this scheme.",
    "te": "ఈ పథకానికి విజయవంతంగా దరఖాస్తు చేసుకోవడానికి దశలవారీ మార్గదర్శకం.",
    "hi": "इस योजना के लिए सफलतापूर्वक तैयारी और आवेदन करने हेतु चरणबद्ध रोडमैप।",
    "ur": "اس اسکیم کے لیے کامیابی سے تیاری اور درخواست دینے کا مرحلہ وار روڈ میپ۔"
  },
  "detail_actionPlanTitle": {
    "en": "Personalized Application Action Plan",
    "te": "వ్యక్తిగతీకరించిన దరఖాస్తు కార్యాచరణ ప్రణాళిక",
    "hi": "व्यक्तिगत आवेदन कार्य योजना",
    "ur": "ذاتی نوعیت کا درخواست ایکشن پلان"
  },
  "detail_activeProfile": {
    "en": "Active Evaluation Profile",
    "te": "యాక్టివ్ మూల్యాంకన ప్రొఫైల్",
    "hi": "सक्रिय मूल्यांकन प्रोफ़ाइल",
    "ur": "فعال تشخیصی پروفائل"
  },
  "detail_agentWorkflow": {
    "en": "Run LangGraph Agent",
    "te": "లాంగ్‌గ్రాఫ్ ఏజెంట్‌ని ప్రారంభించండి",
    "hi": "लैंगग्राफ एजेंट चलाएं",
    "ur": "لینگ گراف ایجنٹ چلائیں"
  },
  "detail_back": {
    "en": "Back to Schemes",
    "te": "పథకాల జాబితాకు తిరిగి వెళ్లండి",
    "hi": "योजनाओं पर वापस जाएं",
    "ur": "اسکیموں پر واپس جائیں"
  },
  "detail_clauseInGazette": {
    "en": "Clause in Gazette",
    "te": "గెజిట్‌లోని నిబంధన",
    "hi": "राजपत्र में खंड",
    "ur": "گزٹ کی شق"
  },
  "detail_closeCitation": {
    "en": "Close Citation",
    "te": "మూసివేయి",
    "hi": "बंद करें",
    "ur": "بند کریں"
  },
  "detail_closeTrace": {
    "en": "Close Trace",
    "te": "ట్రేస్ మూసివేయి",
    "hi": "ट्रेस बंद करें",
    "ur": "ٹریس بند کریں"
  },
  "detail_conditionHeader": {
    "en": "Rule Condition",
    "te": "నిబంధన షరతు",
    "hi": "नियम शर्त",
    "ur": "قاعدے کی شرط"
  },
  "detail_criteriaChecklist": {
    "en": "Eligibility Criteria Breakdown",
    "te": "అర్హత నిబంధనల వివరాలు",
    "hi": "पात्रता शर्तों का विवरण",
    "ur": "اہلیت کے قواعد کی تفصیلات"
  },
  "detail_criterionHeader": {
    "en": "Criterion & Description",
    "te": "నిబంధన & వివరణ",
    "hi": "मानदंड और विवरण",
    "ur": "معیار اور وضاحت"
  },
  "detail_documentsChecklistDesc": {
    "en": "Verify you have these documents ready prior to online portal submission.",
    "te": "ఆన్‌లైన్ పోర్టల్‌లో సమర్పించే ముందు ఈ పత్రాలు మీ వద్ద ఉన్నాయని నిర్ధారించుకోండి.",
    "hi": "ऑनलाइन पोर्टल पर जमा करने से पहले सुनिश्चित करें कि ये दस्तावेज तैयार हैं।",
    "ur": "آن لائن پورٹل پر جمع کرانے سے پہلے یقینی بنائیں کہ یہ دستاویزات تیار ہیں۔"
  },
  "detail_documentsChecklistTitle": {
    "en": "Required Documents Checklist",
    "te": "అవసరమైన పత్రాల జాబితా",
    "hi": "आवश्यक दस्तावेजों की चेकलिस्ट",
    "ur": "ضروری دستاویزات کی فہرست"
  },
  "detail_editProfile": {
    "en": "Edit Demographic Profile →",
    "te": "డెమోగ్రాఫిక్ ప్రొఫైల్‌ను సవరించండి →",
    "hi": "जनसांख्यिकीय प्रोफ़ाइल संपादित करें →",
    "ur": "آبادیاتی پروفائل میں ترمیم کریں ←"
  },
  "detail_evalMatrix": {
    "en": "Criterion-by-Criterion Evaluation Matrix",
    "te": "ప్రతి నిబంధన యొక్క మూల్యాంకన పట్టిక",
    "hi": "मानदंड-दर-मानदंड मूल्यांकन मैट्रिक्स",
    "ur": "معیار بہ معیار تشخیصی میٹرکس"
  },
  "detail_evalMatrixDesc": {
    "en": "Every rule is deterministically tested against your profile attributes. Zero LLM hallucinations.",
    "te": "ప్రతి నిబంధన మీ ప్రొఫైల్ వివరాల ఆధారంగా కచ్చితంగా పరీక్షించబడుతుంది. తప్పుడు సమాచారానికి తావులేదు.",
    "hi": "प्रत्येक नियम का आपकी प्रोफ़ाइल विशेषताओं के साथ सटीक परीक्षण किया जाता है। शून्य भ्रम।",
    "ur": "ہر اصول کو آپ کے پروفائل کی خصوصیات کے مطابق جانچا جاتا ہے۔ صفر غلط بیانی۔"
  },
  "detail_evaluationCompleteness": {
    "en": "Evaluation",
    "te": "మూల్యాంకనం",
    "hi": "मूल्यांकन",
    "ur": "تشخیص"
  },
  "detail_evaluationSummary": {
    "en": "Deterministic Rules Evaluation",
    "te": "ఖచ్చితమైన అర్హత నిబంధనల ఫలితం",
    "hi": "नियम-आधारित पात्रता मूल्यांकन",
    "ur": "اہلیت کے ضوابط کا تجزیہ"
  },
  "detail_evidence": {
    "en": "Official Gazette Evidence & Citations",
    "te": "అధికారిక గెజిట్ ఆధారాలు",
    "hi": "आधिकारिक गजट प्रमाण और संदर्भ",
    "ur": "سرکاری گزٹ کے حوالہ جات"
  },
  "detail_evidenceHeader": {
    "en": "Official Citation & Evidence",
    "te": "అధికారిక ఆధారాలు & కొటేషన్",
    "hi": "आधिकारिक साक्ष्य और उद्धरण",
    "ur": "سرکاری ثبوت اور حوالہ"
  },
  "detail_loadFailed": {
    "en": "Failed to load scheme details",
    "te": "పథకం వివరాలను లోడ్ చేయడంలో విఫలమైంది",
    "hi": "योजना का विवरण लोड करने में विफल",
    "ur": "اسکیم کی تفصیلات لوڈ کرنے میں ناکامی"
  },
  "detail_met": {
    "en": "MET",
    "te": "సరిపోయింది",
    "hi": "संतुष्ट",
    "ur": "پورا ہوا"
  },
  "detail_missingAttribute": {
    "en": "Missing attribute",
    "te": "విలువ నమోదు చేయలేదు",
    "hi": "विवरण अनुपलब्ध",
    "ur": "معلومات درج نہیں"
  },
  "detail_needsVerification": {
    "en": "NEEDS VERIFICATION",
    "te": "ధృవీకరణ అవసరం",
    "hi": "सत्यापन आवश्यक",
    "ur": "تصدیق درکار ہے"
  },
  "detail_nodalAuthority": {
    "en": "Nodal Authority",
    "te": "నోడల్ అథారిటీ",
    "hi": "नोडल प्राधिकरण",
    "ur": "نوڈل اتھارٹی"
  },
  "detail_notFound": {
    "en": "Scheme Not Found",
    "te": "పథకం కనుగొనబడలేదు",
    "hi": "योजना नहीं मिली",
    "ur": "اسکیم نہیں ملی"
  },
  "detail_notFoundDesc": {
    "en": "The requested scheme could not be located in the repository.",
    "te": "అభ్యర్థించిన పథకం రిపోజిటరీలో కనుగొనబడలేదు.",
    "hi": "अनुरोधित योजना रिपॉजिटरी में नहीं मिली।",
    "ur": "درخواست کردہ اسکیم ڈیٹا بیس میں نہیں مل سکی۔"
  },
  "detail_notMet": {
    "en": "NOT MET",
    "te": "సరిపోలేదు",
    "hi": "असंतुष्ट",
    "ur": "پورا نہیں ہوا"
  },
  "detail_officialPortal": {
    "en": "Official Portal",
    "te": "అధికారిక పోర్టల్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹل"
  },
  "detail_officialQuote": {
    "en": "Official Excerpt Quote:",
    "te": "అధికారిక ఉల్లేఖనం:",
    "hi": "आधिकारिक उद्धरण:",
    "ur": "سرکاری اقتباس:"
  },
  "detail_officialRules": {
    "en": "Official Rules",
    "te": "అధికారిక నిబంధనలు",
    "hi": "आधिकारिक नियम",
    "ur": "سرکاری قواعد"
  },
  "detail_plainSynthesis": {
    "en": "Plain-Language Synthesis",
    "te": "సరళమైన భాషా వివరణ",
    "hi": "सरल भाषा संश्लेषण",
    "ur": "آسان زبان کا تجزیہ"
  },
  "detail_profileValueHeader": {
    "en": "Your Profile Value",
    "te": "మీ ప్రొఫైల్ విలువ",
    "hi": "आपकी प्रोफ़ाइल मान",
    "ur": "آپ کا پروفائل ڈیٹا"
  },
  "detail_referencedClause": {
    "en": "Referenced Clause:",
    "te": "సూచించబడిన నిబంధన:",
    "hi": "संदर्भित खंड:",
    "ur": "حوالہ شدہ شق:"
  },
  "detail_requiredDocs": {
    "en": "Required Official Documents",
    "te": "అవసరమైన అధికారిక సర్టిఫికెట్లు",
    "hi": "आवश्यक आधिकारिक दस्तावेज",
    "ur": "مطلوبہ سرکاری دستاویزات"
  },
  "detail_resultStateHeader": {
    "en": "Result State",
    "te": "ఫలిత స్థితి",
    "hi": "परिणाम स्थिति",
    "ur": "نتیجہ کی کیفیت"
  },
  "detail_sourceCitation": {
    "en": "Official Source Citation",
    "te": "అధికారిక మూల ఉల్లేఖనం",
    "hi": "आधिकारिक स्रोत उद्धरण",
    "ur": "سرکاری ماخذ کا حوالہ"
  },
  "detail_unknown": {
    "en": "UNKNOWN",
    "te": "తెలియదు",
    "hi": "अज्ञात",
    "ur": "نامعلوم"
  },
  "detail_visitPortal": {
    "en": "Visit Official Application Portal",
    "te": "అధికారిక దరఖాస్తు పోర్టల్‌ను సందర్శించండి",
    "hi": "आधिकारिक आवेदन पोर्टल पर जाएं",
    "ur": "سرکاری درخواست پورٹل دیکھیں"
  },
  "footer.disclaimerText": {
    "en": "PolicyPilot is an evidence-grounded policy navigation platform. All eligibility evaluations are deterministic and referenced against official gazette rules. Always verify requirements with the official nodal department prior to filing.",
    "te": "పాలసీపైలట్ అనేది అధికారిక ఆధారాలతో కూడిన ప్రభుత్వ విధాన నావిగేషన్ ప్లాట్‌ఫామ్. అన్ని అర్హత మూల్యాంకనాలు అధికారిక గెజిట్ నిబంధనల ప్రకారం ఖచ్చితంగా నిర్ణయించబడతాయి. దరఖాస్తు చేయడానికి ముందు అధికారిక నోడల్ విభాగంలో వివరాలను ధృవీకరించుకోండి.",
    "hi": "पॉलिसीपायलट एक साक्ष्य-आधारित नीति नेविगेशन प्लेटफॉर्म है। सभी पात्रता मूल्यांकन आधिकारिक राजपत्र नियमों के अनुसार सटीक रूप से निर्धारित होते हैं। आवेदन करने से पहले हमेशा संबंधित विभाग के साथ सत्यापन करें।",
    "ur": "پالیسی پائلٹ ایک شواہد پر مبنی سرکاری پالیسی نیویگیشن پلیٹ فارم ہے۔ تمام اہلیت کے جائزے سرکاری گزٹ کے قواعد کے مطابق حتمی ہیں۔ درخواست دینے سے پہلے متعلقہ محکمے سے تصدیق ضرور کریں۔"
  },
  "footer.disclaimerTitle": {
    "en": "Policy Guidance & Verification Disclaimer",
    "te": "విధాన మార్గదర్శకత్వం & ధృవీకరణ నిరాకరణ",
    "hi": "नीति मार्गदर्शन और सत्यापन अस्वीकरण",
    "ur": "پالیسی رہنمائی اور تصدیق کی تردید"
  },
  "footer.mission": {
    "en": "Navigating citizens through complex welfare policies with verified government sources, deterministic rules engines, and zero hallucinations.",
    "te": "ధృవీకరించబడిన ప్రభుత్వ వనరులు మరియు స్పష్టమైన నిబంధనలతో పౌరులను సంక్షేమ పథకాల వైపు నడిపిస్తుంది.",
    "hi": "सत्यापित सरकारी स्रोतों और सटीक नियम इंजनों के साथ नागरिकों को कल्याणकारी योजनाओं की सही जानकारी प्रदान करना।",
    "ur": "تصدیق شدہ سرکاری ذرائع اور حتمی قواعد انجنوں کے ذریعے شہریوں کو فلاحی اسکیموں کی درست رہنمائی فراہم کرنا۔"
  },
  "footer.modules": {
    "en": "Core Modules",
    "te": "ప్రధాన విభాగాలు",
    "hi": "प्रमुख मॉड्यूल",
    "ur": "اہم ماڈیولز"
  },
  "footer.portals": {
    "en": "Official Portals",
    "te": "అధికారిక పోర్టల్స్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹلز"
  },
  "footer.team": {
    "en": "Built for India",
    "te": "భారతీయ పౌరుల కోసం పారదర్శక ప్రజా పాలన మరియు విశ్వసనీయతతో నిర్మించబడింది.",
    "hi": "गहरे विश्वास और पारदर्शी शासन के साथ भारत के नागरिकों के कल्याण के लिए निर्मित।",
    "ur": "بھارت کے شہریوں کے لیے شفاف طرز حکمرانی اور مکمل اعتماد کے ساتھ تیار کردہ۔"
  },
  "footer_disclaimerText": {
    "en": "PolicyPilot is an evidence-grounded policy navigation platform. All eligibility evaluations are deterministic and referenced against official gazette rules. Always verify requirements with the official nodal department prior to filing.",
    "te": "పాలసీపైలట్ అనేది అధికారిక ఆధారాలతో కూడిన ప్రభుత్వ విధాన నావిగేషన్ ప్లాట్‌ఫామ్. అన్ని అర్హత మూల్యాంకనాలు అధికారిక గెజిట్ నిబంధనల ప్రకారం ఖచ్చితంగా నిర్ణయించబడతాయి. దరఖాస్తు చేయడానికి ముందు అధికారిక నోడల్ విభాగంలో వివరాలను ధృవీకరించుకోండి.",
    "hi": "पॉलिसीपायलट एक साक्ष्य-आधारित नीति नेविगेशन प्लेटफॉर्म है। सभी पात्रता मूल्यांकन आधिकारिक राजपत्र नियमों के अनुसार सटीक रूप से निर्धारित होते हैं। आवेदन करने से पहले हमेशा संबंधित विभाग के साथ सत्यापन करें।",
    "ur": "پالیسی پائلٹ ایک شواہد پر مبنی سرکاری پالیسی نیویگیشن پلیٹ فارم ہے۔ تمام اہلیت کے جائزے سرکاری گزٹ کے قواعد کے مطابق حتمی ہیں۔ درخواست دینے سے پہلے متعلقہ محکمے سے تصدیق ضرور کریں۔"
  },
  "footer_disclaimerTitle": {
    "en": "Policy Guidance & Verification Disclaimer",
    "te": "విధాన మార్గదర్శకత్వం & ధృవీకరణ నిరాకరణ",
    "hi": "नीति मार्गदर्शन और सत्यापन अस्वीकरण",
    "ur": "پالیسی رہنمائی اور تصدیق کی تردید"
  },
  "footer_mission": {
    "en": "Navigating citizens through complex welfare policies with verified government sources, deterministic rules engines, and zero hallucinations.",
    "te": "ధృవీకరించబడిన ప్రభుత్వ వనరులు మరియు స్పష్టమైన నిబంధనలతో పౌరులను సంక్షేమ పథకాల వైపు నడిపిస్తుంది.",
    "hi": "सत्यापित सरकारी स्रोतों और सटीक नियम इंजनों के साथ नागरिकों को कल्याणकारी योजनाओं की सही जानकारी प्रदान करना।",
    "ur": "تصدیق شدہ سرکاری ذرائع اور حتمی قواعد انجنوں کے ذریعے شہریوں کو فلاحی اسکیموں کی درست رہنمائی فراہم کرنا۔"
  },
  "footer_modules": {
    "en": "Core Modules",
    "te": "ప్రధాన విభాగాలు",
    "hi": "प्रमुख मॉड्यूल",
    "ur": "اہم ماڈیولز"
  },
  "footer_portals": {
    "en": "Official Portals",
    "te": "అధికారిక పోర్టల్స్",
    "hi": "आधिकारिक पोर्टल",
    "ur": "سرکاری پورٹلز"
  },
  "footer_team": {
    "en": "Built for India",
    "te": "భారతీయ పౌరుల కోసం పారదర్శక ప్రజా పాలన మరియు విశ్వసనీయతతో నిర్మించబడింది.",
    "hi": "गहरे विश्वास और पारदर्शी शासन के साथ भारत के नागरिकों के कल्याण के लिए निर्मित।",
    "ur": "بھارت کے شہریوں کے لیے شفاف طرز حکمرانی اور مکمل اعتماد کے ساتھ تیار کردہ۔"
  },
  "home.activeSession": {
    "en": "Active Citizen Session",
    "te": "ప్రస్తుత పౌరుని వివరాలు",
    "hi": "सक्रिय नागरिक सत्र",
    "ur": "فعال شہری سیشن"
  },
  "home.aiDesc": {
    "en": "AI translates verified evaluation results into respectful, clear guidance in your language, citing exact Gazette clauses and preparing personalized document preparation checklists.",
    "te": "AI వ్యవస్థ అర్హత ఫలితాలను మీ మాతృభాషలో సులభంగా అర్థమయ్యేలా వివరిస్తుంది, అధికారిక గెజిట్ ఆధారాలను చూపుతుంది మరియు అవసరమైన సర్టిఫికెట్ల జాబితాను అందిస్తుంది.",
    "hi": "एआई सत्यापन परिणामों को आपकी भाषा में सरल और सम्मानजनक तरीके से समझाता है, सटीक सरकारी संदर्भ देता है और आवश्यक दस्तावेजों की सूची तैयार करता है।",
    "ur": "اے آئی تصدیقی نتائج کو آپ کی مادری زبان میں آسان انداز میں بیان کرتا ہے، سرکاری حوالہ جات پیش کرتا ہے اور دستاویزات کی فہرست تیار کرتا ہے۔"
  },
  "home.aiSubtitle": {
    "en": "Gemini AI • Strict Source Guardrails",
    "te": "అధికారిక ఆధారాలతో కూడిన సహాయకుడు",
    "hi": "सख्त स्रोत सीमाओं के साथ सहायक",
    "ur": "مستند حوالہ جات کے ساتھ معاون"
  },
  "home.aiTitle": {
    "en": "Grounded AI Explanations",
    "te": "ఆధారాలతో కూడిన AI వివరణ",
    "hi": "प्रमाण-आधारित एआई मार्गदर्शन",
    "ur": "شواہد پر مبنی اے آئی رہنمائی"
  },
  "home.annualIncome": {
    "en": "Annual Income",
    "te": "వార్షిక ఆదాయం",
    "hi": "वार्षिक आय",
    "ur": "سالانہ آمدنی"
  },
  "home.assessEligibility": {
    "en": "Assess Eligibility →",
    "te": "అర్హతను పరీక్షించండి →",
    "hi": "पात्रता जांचें →",
    "ur": "اہلیت دیکھیں ←"
  },
  "home.assistanceGoal": {
    "en": "Assistance Goal",
    "te": "లక్ష్యం",
    "hi": "सहायता लक्ष्य",
    "ur": "امداد کا مقصد"
  },
  "home.badge": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "home.exploreSchemes": {
    "en": "Explore All Schemes",
    "te": "అన్ని పథకాలను చూడండి",
    "hi": "सभी योजनाएं देखें",
    "ur": "تمام اسکیمیں دیکھیں"
  },
  "home.flowTag": {
    "en": "The Citizen Navigation Flow",
    "te": "పౌరుల సేవా ప్రయాణం",
    "hi": "नागरिक सेवा प्रवाह",
    "ur": "شہری خدمات کا عمل"
  },
  "home.flowTitle": {
    "en": "From Profile to Verified Application",
    "te": "వివరాల నమోదు నుండి అధికారిక దరఖాస్తు వరకు",
    "hi": "प्रोफ़ाइल से सत्यापित आवेदन तक",
    "ur": "پروفائل سے تصدیق شدہ درخواست تک"
  },
  "home.heroDesc": {
    "en": "Deterministic rule engine matching citizens to verified welfare schemes. Real Gazettes, official citations, personalized document roadmaps, and zero AI hallucination.",
    "te": "పౌరుల వివరాలను అధికారిక ప్రభుత్వ పథకాలతో సరిపోల్చే నమ్మకమైన నిబంధనల వ్యవస్థ. గెజిట్ ఆధారాలు, అవసరమైన పత్రాల జాబితా మరియు 100% కచ్చితమైన సమాచారం.",
    "hi": "नागरिकों को सत्यापित कल्याणकारी योजनाओं से जोड़ने वाला नियम-आधारित इंजन। वास्तविक गजट, आधिकारिक संदर्भ, व्यक्तिगत दस्तावेज योजना और 100% विश्वसनीय परिणाम।",
    "ur": "شہریوں کو تصدیق شدہ فلاحی اسکیموں سے مربوط کرنے والا قابل اعتماد نظام۔ مستند گزٹ، سرکاری حوالہ جات، ضروری دستاویزات کی فہرست اور 100% درست معلومات۔"
  },
  "home.heroTitle1": {
    "en": "Know What You Deserve.",
    "te": "మీకు రావలసిన పథకాలను తెలుసుకోండి.",
    "hi": "जानें आपका अधिकार क्या है।",
    "ur": "جانیں کہ آپ کا کیا حق ہے۔"
  },
  "home.heroTitle2": {
    "en": "Backed by Verified Government Gazette Rules.",
    "te": "అధికారిక ప్రభుత్వ గెజిట్ నిబంధనల ఆధారంగా.",
    "hi": "सत्यापित सरकारी गजट नियमों द्वारा समर्थित।",
    "ur": "تصدیق شدہ سرکاری گزٹ کے قواعد پر مبنی۔"
  },
  "home.landholding": {
    "en": "Landholding",
    "te": "భూమి వివరాలు",
    "hi": "भूमि स्वामित्व",
    "ur": "زمین کی ملکیت"
  },
  "home.matchSchemesBtn": {
    "en": "Match Schemes for this Profile →",
    "te": "ఈ ప్రొఫైల్కు సరిపోయే పథకాలు →",
    "hi": "इस प्रोफ़ाइल के लिए योजनाएं खोजें →",
    "ur": "اس پروفائل کے لیے اسکیمیں دیکھیں ←"
  },
  "home.occupation": {
    "en": "Occupation",
    "te": "వృత్తి",
    "hi": "व्यवसाय",
    "ur": "پیشہ"
  },
  "home.presetsLabel": {
    "en": "Evaluator Quick Presets (Click to switch citizen profile):",
    "te": "డెమో ప్రొఫైల్స్ (పౌరుని వివరాలను మార్చడానికి నొక్కండి):",
    "hi": "त्वरित डेमो प्रोफ़ाइल (नागरिक विवरण बदलने के लिए क्लिक करें):",
    "ur": "فوری ڈیمو پروفائلز (شہری کی تفصیلات تبدیل کرنے کے لیے کلک کریں):"
  },
  "home.rescueMode": {
    "en": "Scholarship Rescue Mode",
    "te": "స్కాలర్షిప్ రెస్క్యూ మోడ్",
    "hi": "छात्रवृत्ति सहायता (Rescue Mode)",
    "ur": "اسکالرشپ ریسکیو موڈ"
  },
  "home.rulesDesc": {
    "en": "Scheme eligibility conditions are executed strictly as deterministic boolean and numeric operators. Missing profile attributes never silently pass.",
    "te": "ప్రభుత్వ పథకాల అర్హత నిబంధనలు ఖచ్చితమైన గణిత మరియు చట్టబద్ధమైన పద్ధతుల్లో లెక్కించబడతాయి. సరైన వివరాలు లేకపోతే స్పష్టంగా తెలియజేయబడుతుంది.",
    "hi": "योजना की पात्रता शर्तें पूरी तरह से गणितीय और वैधानिक नियमों पर जांची जाती हैं। आवश्यक विवरण न होने पर स्पष्ट रूप से सूचित किया जाता है।",
    "ur": "اہلیت کے تمام ضوابط کا مکمل اور باقاعدہ جانچ کیا جاتا ہے۔ نامکمل معلومات کو بغیر تصدیق کے قبول نہیں کیا جاتا۔"
  },
  "home.rulesSubtitle": {
    "en": "100% Python Code • Zero LLM Hallucination",
    "te": "100% ప్రభుత్వ నిబంధనలు • కచ్చితమైన లెక్కలు",
    "hi": "100% सरकारी नियम • शून्य भ्रामक जानकारी",
    "ur": "100% مستند قواعد • مکمل درست نتائج"
  },
  "home.rulesTitle": {
    "en": "Deterministic Rule Engine",
    "te": "ఖచ్చితమైన నిబంధనల ఇంజిన్",
    "hi": "नियम-आधारित सत्यापन इंजन",
    "ur": "قواعد پر مبنی تصدیقی انجن"
  },
  "home.schemeUpdates": {
    "en": "Scheme Updates",
    "te": "కొత్త పథకాల ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیٹس"
  },
  "home.verifiedSchemesDesc": {
    "en": "Traceable to official Gazettes and departmental implementation guidelines.",
    "te": "అధికారిక గెజిట్లు మరియు ప్రభుత్వ మార్గదర్శకాల ఆధారంగా రూపొందించబడింది.",
    "hi": "आधिकारिक गजट और विभागीय दिशानिर्देशों द्वारा सत्यापित।",
    "ur": "سرکاری گزٹ اور محکمانہ قواعد کے مطابق تصدیق شدہ۔"
  },
  "home.verifiedSchemesTitle": {
    "en": "Verified Government Schemes",
    "te": "ధృవీకరించబడిన ప్రభుత్వ పథకాలు",
    "hi": "सत्यापित सरकारी योजनाएं",
    "ur": "تصدیق شدہ سرکاری اسکیمیں"
  },
  "home.viewAllSchemes": {
    "en": "View All Schemes",
    "te": "అన్ని పథకాలను చూడండి",
    "hi": "सभी योजनाएं देखें",
    "ur": "تمام اسکیمیں دیکھیں"
  },
  "home_activeSession": {
    "en": "Active Citizen Session",
    "te": "ప్రస్తుత పౌరుని వివరాలు",
    "hi": "सक्रिय नागरिक सत्र",
    "ur": "فعال شہری سیشن"
  },
  "home_aiDesc": {
    "en": "AI translates verified evaluation results into respectful, clear guidance in your language, citing exact Gazette clauses and preparing personalized document preparation checklists.",
    "te": "AI వ్యవస్థ అర్హత ఫలితాలను మీ మాతృభాషలో సులభంగా అర్థమయ్యేలా వివరిస్తుంది, అధికారిక గెజిట్ ఆధారాలను చూపుతుంది మరియు అవసరమైన సర్టిఫికెట్ల జాబితాను అందిస్తుంది.",
    "hi": "एआई सत्यापन परिणामों को आपकी भाषा में सरल और सम्मानजनक तरीके से समझाता है, सटीक सरकारी संदर्भ देता है और आवश्यक दस्तावेजों की सूची तैयार करता है।",
    "ur": "اے آئی تصدیقی نتائج کو آپ کی مادری زبان میں آسان انداز میں بیان کرتا ہے، سرکاری حوالہ جات پیش کرتا ہے اور دستاویزات کی فہرست تیار کرتا ہے۔"
  },
  "home_aiSubtitle": {
    "en": "Gemini AI • Strict Source Guardrails",
    "te": "అధికారిక ఆధారాలతో కూడిన సహాయకుడు",
    "hi": "सख्त स्रोत सीमाओं के साथ सहायक",
    "ur": "مستند حوالہ جات کے ساتھ معاون"
  },
  "home_aiTitle": {
    "en": "Grounded AI Explanations",
    "te": "ఆధారాలతో కూడిన AI వివరణ",
    "hi": "प्रमाण-आधारित एआई मार्गदर्शन",
    "ur": "شواہد پر مبنی اے آئی رہنمائی"
  },
  "home_annualIncome": {
    "en": "Annual Income",
    "te": "వార్షిక ఆదాయం",
    "hi": "वार्षिक आय",
    "ur": "سالانہ آمدنی"
  },
  "home_assessEligibility": {
    "en": "Assess Eligibility →",
    "te": "అర్హతను పరీక్షించండి →",
    "hi": "पात्रता जांचें →",
    "ur": "اہلیت دیکھیں ←"
  },
  "home_assistanceGoal": {
    "en": "Assistance Goal",
    "te": "లక్ష్యం",
    "hi": "सहायता लक्ष्य",
    "ur": "امداد کا مقصد"
  },
  "home_badge": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "home_exploreSchemes": {
    "en": "Explore All Schemes",
    "te": "అన్ని పథకాలను చూడండి",
    "hi": "सभी योजनाएं देखें",
    "ur": "تمام اسکیمیں دیکھیں"
  },
  "home_flowTag": {
    "en": "The Citizen Navigation Flow",
    "te": "పౌరుల సేవా ప్రయాణం",
    "hi": "नागरिक सेवा प्रवाह",
    "ur": "شہری خدمات کا عمل"
  },
  "home_flowTitle": {
    "en": "From Profile to Verified Application",
    "te": "వివరాల నమోదు నుండి అధికారిక దరఖాస్తు వరకు",
    "hi": "प्रोफ़ाइल से सत्यापित आवेदन तक",
    "ur": "پروفائل سے تصدیق شدہ درخواست تک"
  },
  "home_heroDesc": {
    "en": "Deterministic rule engine matching citizens to verified welfare schemes. Real Gazettes, official citations, personalized document roadmaps, and zero AI hallucination.",
    "te": "పౌరుల వివరాలను అధికారిక ప్రభుత్వ పథకాలతో సరిపోల్చే నమ్మకమైన నిబంధనల వ్యవస్థ. గెజిట్ ఆధారాలు, అవసరమైన పత్రాల జాబితా మరియు 100% కచ్చితమైన సమాచారం.",
    "hi": "नागरिकों को सत्यापित कल्याणकारी योजनाओं से जोड़ने वाला नियम-आधारित इंजन। वास्तविक गजट, आधिकारिक संदर्भ, व्यक्तिगत दस्तावेज योजना और 100% विश्वसनीय परिणाम।",
    "ur": "شہریوں کو تصدیق شدہ فلاحی اسکیموں سے مربوط کرنے والا قابل اعتماد نظام۔ مستند گزٹ، سرکاری حوالہ جات، ضروری دستاویزات کی فہرست اور 100% درست معلومات۔"
  },
  "home_heroTitle1": {
    "en": "Know What You Deserve.",
    "te": "మీకు రావలసిన పథకాలను తెలుసుకోండి.",
    "hi": "जानें आपका अधिकार क्या है।",
    "ur": "جانیں کہ آپ کا کیا حق ہے۔"
  },
  "home_heroTitle2": {
    "en": "Backed by Verified Government Gazette Rules.",
    "te": "అధికారిక ప్రభుత్వ గెజిట్ నిబంధనల ఆధారంగా.",
    "hi": "सत्यापित सरकारी गजट नियमों द्वारा समर्थित।",
    "ur": "تصدیق شدہ سرکاری گزٹ کے قواعد پر مبنی۔"
  },
  "home_landholding": {
    "en": "Landholding",
    "te": "భూమి వివరాలు",
    "hi": "भूमि स्वामित्व",
    "ur": "زمین کی ملکیت"
  },
  "home_matchSchemesBtn": {
    "en": "Match Schemes for this Profile →",
    "te": "ఈ ప్రొఫైల్కు సరిపోయే పథకాలు →",
    "hi": "इस प्रोफ़ाइल के लिए योजनाएं खोजें →",
    "ur": "اس پروفائل کے لیے اسکیمیں دیکھیں ←"
  },
  "home_occupation": {
    "en": "Occupation",
    "te": "వృత్తి",
    "hi": "व्यवसाय",
    "ur": "پیشہ"
  },
  "home_presetsLabel": {
    "en": "Evaluator Quick Presets (Click to switch citizen profile):",
    "te": "డెమో ప్రొఫైల్స్ (పౌరుని వివరాలను మార్చడానికి నొక్కండి):",
    "hi": "त्वरित डेमो प्रोफ़ाइल (नागरिक विवरण बदलने के लिए क्लिक करें):",
    "ur": "فوری ڈیمو پروفائلز (شہری کی تفصیلات تبدیل کرنے کے لیے کلک کریں):"
  },
  "home_rescueMode": {
    "en": "Scholarship Rescue Mode",
    "te": "స్కాలర్షిప్ రెస్క్యూ మోడ్",
    "hi": "छात्रवृत्ति सहायता (Rescue Mode)",
    "ur": "اسکالرشپ ریسکیو موڈ"
  },
  "home_rulesDesc": {
    "en": "Scheme eligibility conditions are executed strictly as deterministic boolean and numeric operators. Missing profile attributes never silently pass.",
    "te": "ప్రభుత్వ పథకాల అర్హత నిబంధనలు ఖచ్చితమైన గణిత మరియు చట్టబద్ధమైన పద్ధతుల్లో లెక్కించబడతాయి. సరైన వివరాలు లేకపోతే స్పష్టంగా తెలియజేయబడుతుంది.",
    "hi": "योजना की पात्रता शर्तें पूरी तरह से गणितीय और वैधानिक नियमों पर जांची जाती हैं। आवश्यक विवरण न होने पर स्पष्ट रूप से सूचित किया जाता है।",
    "ur": "اہلیت کے تمام ضوابط کا مکمل اور باقاعدہ جانچ کیا جاتا ہے۔ نامکمل معلومات کو بغیر تصدیق کے قبول نہیں کیا جاتا۔"
  },
  "home_rulesSubtitle": {
    "en": "100% Python Code • Zero LLM Hallucination",
    "te": "100% ప్రభుత్వ నిబంధనలు • కచ్చితమైన లెక్కలు",
    "hi": "100% सरकारी नियम • शून्य भ्रामक जानकारी",
    "ur": "100% مستند قواعد • مکمل درست نتائج"
  },
  "home_rulesTitle": {
    "en": "Deterministic Rule Engine",
    "te": "ఖచ్చితమైన నిబంధనల ఇంజిన్",
    "hi": "नियम-आधारित सत्यापन इंजन",
    "ur": "قواعد پر مبنی تصدیقی انجن"
  },
  "home_schemeUpdates": {
    "en": "Scheme Updates",
    "te": "కొత్త పథకాల ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیٹس"
  },
  "home_verifiedSchemesDesc": {
    "en": "Traceable to official Gazettes and departmental implementation guidelines.",
    "te": "అధికారిక గెజిట్లు మరియు ప్రభుత్వ మార్గదర్శకాల ఆధారంగా రూపొందించబడింది.",
    "hi": "आधिकारिक गजट और विभागीय दिशानिर्देशों द्वारा सत्यापित।",
    "ur": "سرکاری گزٹ اور محکمانہ قواعد کے مطابق تصدیق شدہ۔"
  },
  "home_verifiedSchemesTitle": {
    "en": "Verified Government Schemes",
    "te": "ధృవీకరించబడిన ప్రభుత్వ పథకాలు",
    "hi": "सत्यापित सरकारी योजनाएं",
    "ur": "تصدیق شدہ سرکاری اسکیمیں"
  },
  "home_viewAllSchemes": {
    "en": "View All Schemes",
    "te": "అన్ని పథకాలను చూడండి",
    "hi": "सभी योजनाएं देखें",
    "ur": "تمام اسکیمیں دیکھیں"
  },
  "nav.aiProvider": {
    "en": "AI Guidance",
    "te": "AI మార్గదర్శకత్వం",
    "hi": "एआई मार्गदर्शन",
    "ur": "اے آئی رہنمائی"
  },
  "nav.announcements": {
    "en": "Scheme Updates",
    "te": "కొత్త ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیట్స్"
  },
  "nav.check.eligibility": {
    "en": "Check Eligibility",
    "te": "అర్హతను తనిఖీ చేయండి",
    "hi": "पात्रता जांचें",
    "ur": "اہلیت چیک کریں"
  },
  "nav.checkEligibility": {
    "en": "Check Eligibility",
    "te": "అర్హతను తనిఖీ చేయండి",
    "hi": "पात्रता जांचें",
    "ur": "اہلیت چیک کریں"
  },
  "nav.database": {
    "en": "Database",
    "te": "డేటాబేస్",
    "hi": "डेटाबेस",
    "ur": "ڈیٹا بیس"
  },
  "nav.demoProfile": {
    "en": "Demo Persona",
    "te": "డెమో ప్రొఫైల్",
    "hi": "डेमो प्रोफ़ाइल",
    "ur": "ڈیمو پروفائل"
  },
  "nav.demoStatus": {
    "en": "Demo Mode (Mock DB & Deterministic AI)",
    "te": "డెమో మోడ్ (నిబంధనల ఇంజిన్ & AI)",
    "hi": "डेमो मोड (नियम इंजन और एआई)",
    "ur": "ڈیمو موڈ (قواعد انجن اور اے آئی)"
  },
  "nav.profile": {
    "en": "Citizen Profile",
    "te": "పౌరుని వివరాలు",
    "hi": "नागरिक प्रोफ़ाइल",
    "ur": "شہری پروفائل"
  },
  "nav.rescue": {
    "en": "Scholarship Rescue",
    "te": "స్కాలర్షిప్ రెస్క్యూ",
    "hi": "छात्रवृत्ति सहायता (Rescue)",
    "ur": "اسکالرشپ ریسکیو"
  },
  "nav.retrieval": {
    "en": "Retrieval",
    "te": "సమాచార సేకరణ",
    "hi": "जानकारी पुनर्प्राप्ति",
    "ur": "معلومات کی بازیابی"
  },
  "nav.rulesEngine": {
    "en": "Rules Engine",
    "te": "నిబంధనల ఇంజిన్",
    "hi": "नियम इंजन",
    "ur": "قواعد انجن"
  },
  "nav.schemes": {
    "en": "Schemes Discovery",
    "te": "పథకాల అన్వేషణ",
    "hi": "योजना खोज",
    "ur": "اسکیموں کی تلاش"
  },
  "nav.selectLanguage": {
    "en": "Select Language",
    "te": "భాషను ఎంచుకోండి",
    "hi": "भाषा चुनें",
    "ur": "زبان منتخب کریں"
  },
  "nav.sources": {
    "en": "Official Sources",
    "te": "అధికారిక ఆధారాలు",
    "hi": "आधिकारिक स्रोत",
    "ur": "سرکاری ذرائع"
  },
  "nav.systemStatus": {
    "en": "PolicyPilot System Status",
    "te": "PolicyPilot సిస్టమ్ స్థితి",
    "hi": "PolicyPilot सिस्टम स्थिति",
    "ur": "PolicyPilot سسٹم کی کیفیت"
  },
  "nav.tagline": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "nav.updates": {
    "en": "Scheme Updates",
    "te": "కొత్త ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیٹس"
  },
  "nav.voiceAssistant": {
    "en": "Ask Assistant",
    "te": "వాయిస్ సహాయకుడు",
    "hi": "वॉयस सहायक",
    "ur": "وائس اسسٹنٹ"
  },
  "nav_aiProvider": {
    "en": "AI Guidance",
    "te": "AI మార్గదర్శకత్వం",
    "hi": "एआई मार्गदर्शन",
    "ur": "اے آئی رہنمائی"
  },
  "nav_announcements": {
    "en": "Scheme Updates",
    "te": "కొత్త ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیట్స్"
  },
  "nav_checkEligibility": {
    "en": "Check Eligibility",
    "te": "అర్హతను తనిఖీ చేయండి",
    "hi": "पात्रता जांचें",
    "ur": "اہلیت چیک کریں"
  },
  "nav_check_eligibility": {
    "en": "Check Eligibility",
    "te": "అర్హతను తనిఖీ చేయండి",
    "hi": "पात्रता जांचें",
    "ur": "اہلیت چیک کریں"
  },
  "nav_database": {
    "en": "Database",
    "te": "డేటాబేస్",
    "hi": "डेटाबेस",
    "ur": "ڈیٹا بیس"
  },
  "nav_demoProfile": {
    "en": "Demo Persona",
    "te": "డెమో ప్రొఫైల్",
    "hi": "डेमो प्रोफ़ाइल",
    "ur": "ڈیمو پروفائل"
  },
  "nav_demoStatus": {
    "en": "Demo Mode (Mock DB & Deterministic AI)",
    "te": "డెమో మోడ్ (నిబంధనల ఇంజిన్ & AI)",
    "hi": "डेमो मोड (नियम इंजन और एआई)",
    "ur": "ڈیمو موڈ (قواعد انجن اور اے آئی)"
  },
  "nav_profile": {
    "en": "Citizen Profile",
    "te": "పౌరుని వివరాలు",
    "hi": "नागरिक प्रोफ़ाइल",
    "ur": "شہری پروفائل"
  },
  "nav_rescue": {
    "en": "Scholarship Rescue",
    "te": "స్కాలర్షిప్ రెస్క్యూ",
    "hi": "छात्रवृत्ति सहायता (Rescue)",
    "ur": "اسکالرشپ ریسکیو"
  },
  "nav_retrieval": {
    "en": "Retrieval",
    "te": "సమాచార సేకరణ",
    "hi": "जानकारी पुनर्प्राप्ति",
    "ur": "معلومات کی بازیابی"
  },
  "nav_rulesEngine": {
    "en": "Rules Engine",
    "te": "నిబంధనల ఇంజిన్",
    "hi": "नियम इंजन",
    "ur": "قواعد انجن"
  },
  "nav_schemes": {
    "en": "Schemes Discovery",
    "te": "పథకాల అన్వేషణ",
    "hi": "योजना खोज",
    "ur": "اسکیموں کی تلاش"
  },
  "nav_selectLanguage": {
    "en": "Select Language",
    "te": "భాషను ఎంచుకోండి",
    "hi": "भाषा चुनें",
    "ur": "زبان منتخب کریں"
  },
  "nav_sources": {
    "en": "Official Sources",
    "te": "అధికారిక ఆధారాలు",
    "hi": "आधिकारिक स्रोत",
    "ur": "سرکاری ذرائع"
  },
  "nav_systemStatus": {
    "en": "PolicyPilot System Status",
    "te": "PolicyPilot సిస్టమ్ స్థితి",
    "hi": "PolicyPilot सिस्टम स्थिति",
    "ur": "PolicyPilot سسٹم کی کیفیت"
  },
  "nav_tagline": {
    "en": "Evidence-Grounded Policy Nav",
    "te": "ఆధారాలతో కూడిన ప్రభుత్వ పథకాల మార్గదర్శి",
    "hi": "प्रमाण-आधारित सरकारी योजना मार्गदर्शक",
    "ur": "شواہد پر مبنی سرکاری پالیسی رہنمائی"
  },
  "nav_updates": {
    "en": "Scheme Updates",
    "te": "కొత్త ప్రకటనలు",
    "hi": "योजना अपडेट",
    "ur": "اسکیم اپ ڈیట్స్"
  },
  "nav_voiceAssistant": {
    "en": "Ask Assistant",
    "te": "వాయిస్ సహాయకుడు",
    "hi": "वॉयस सहायक",
    "ur": "وائس اسسٹنٹ"
  },
  "persona.label": {
    "en": "Demo Persona",
    "te": "డెమో ప్రొఫైల్",
    "hi": "डेमो प्रोफ़ाइल",
    "ur": "ڈیمو پروفائل"
  },
  "persona_label": {
    "en": "Demo Persona",
    "te": "డెమో ప్రొఫైల్",
    "hi": "डेमो प्रोफ़ाइल",
    "ur": "ڈیمو پروفائل"
  },
  "profile.category": {
    "en": "Social Category",
    "te": "సామాజిక వర్గం (కేటగిరీ)",
    "hi": "सामाजिक श्रेणी",
    "ur": "سماجی زمرہ"
  },
  "profile.goal": {
    "en": "Assistance Goal / Interest",
    "te": "సహాయం కోరే విభాగం",
    "hi": "सहायता का लक्ष्य / रुचि",
    "ur": "امداد کا شعبہ / مقصد"
  },
  "profile.income": {
    "en": "Annual Household Income (INR)",
    "te": "వార్షిక కుటుంబ ఆదాయం (రూపాయలు)",
    "hi": "वार्षिक पारिवारिक आय (INR)",
    "ur": "سالانہ خاندانی آمدنی (روپے)"
  },
  "profile.landholding": {
    "en": "Agricultural Landholding (Acres)",
    "te": "వ్యవసాయ భూమి (ఎకరాలు)",
    "hi": "कृषि भूमि स्वामित्व (एकड़)",
    "ur": "زرعی زمین کی ملکیت (ایکڑ)"
  },
  "profile.occupation": {
    "en": "Primary Occupation",
    "te": "ప్రధాన వృత్తి",
    "hi": "मुख्य व्यवसाय",
    "ur": "بنیادی پیشہ"
  },
  "profile.presetsTitle": {
    "en": "Quick Citizen Persona Presets",
    "te": "త్వరిత పౌర ప్రొఫైల్ నమూనాలు",
    "hi": "त्वरित नागरिक प्रोफ़ाइल प्रीसेट",
    "ur": "فوری شہری پروفائل نمونے"
  },
  "profile.saveBtn": {
    "en": "Save & Discover Schemes",
    "te": "భద్రపరిచి పథకాలను అన్వేషించండి",
    "hi": "सहेजें और योजनाएं खोजें",
    "ur": "محفوظ کریں اور اسکیمیں تلاش کریں"
  },
  "profile.state": {
    "en": "State / Union Territory",
    "te": "రాష్ట్రం / కేంద్రపాలిత ప్రాంతం",
    "hi": "राज्य / केंद्र शासित प्रदेश",
    "ur": "ریاست / مرکز کے زیر انتظام علاقہ"
  },
  "profile.subtitle": {
    "en": "Configure your household attributes to automatically evaluate eligibility across all central and state welfare schemes.",
    "te": "కేంద్ర మరియు రాష్ట్ర సంక్షేమ పథకాలలో మీ అర్హతను స్వయంచాలకంగా అంచనా వేయడానికి మీ కుటుంబ వివరాలను పూరించండి.",
    "hi": "सभी केंद्रीय और राज्य कल्याणकारी योजनाओं में पात्रता का स्वतः मूल्यांकन करने के लिए अपने परिवार का विवरण दर्ज करें।",
    "ur": "تمام مرکزی اور ریاستی فلاحی اسکیموں میں اپنی اہلیت جانچنے کے لیے اپنے خاندان کی تفصیلات درج کریں۔"
  },
  "profile.title": {
    "en": "Citizen Demographic Profile",
    "te": "పౌరుడి జనాభా ప్రొఫైల్",
    "hi": "नागरिक जनसांख्यिकीय प्रोफ़ाइल",
    "ur": "شہری آبادیاتی پروفائل"
  },
  "profile.validateBtn": {
    "en": "Validate Profile Schema",
    "te": "ప్రొఫైల్ ఫారమ్ ధృవీకరించండి",
    "hi": "प्रोफ़ाइल सत्यापित करें",
    "ur": "پروفائل کی تصدیق کریں"
  },
  "profile_category": {
    "en": "Social Category",
    "te": "సామాజిక వర్గం (కేటగిరీ)",
    "hi": "सामाजिक श्रेणी",
    "ur": "سماجی زمرہ"
  },
  "profile_goal": {
    "en": "Assistance Goal / Interest",
    "te": "సహాయం కోరే విభాగం",
    "hi": "सहायता का लक्ष्य / रुचि",
    "ur": "امداد کا شعبہ / مقصد"
  },
  "profile_income": {
    "en": "Annual Household Income (INR)",
    "te": "వార్షిక కుటుంబ ఆదాయం (రూపాయలు)",
    "hi": "वार्षिक पारिवारिक आय (INR)",
    "ur": "سالانہ خاندانی آمدنی (روپے)"
  },
  "profile_landholding": {
    "en": "Agricultural Landholding (Acres)",
    "te": "వ్యవసాయ భూమి (ఎకరాలు)",
    "hi": "कृषि भूमि स्वामित्व (एकड़)",
    "ur": "زرعی زمین کی ملکیت (ایکڑ)"
  },
  "profile_occupation": {
    "en": "Primary Occupation",
    "te": "ప్రధాన వృత్తి",
    "hi": "मुख्य व्यवसाय",
    "ur": "بنیادی پیشہ"
  },
  "profile_presetsTitle": {
    "en": "Quick Citizen Persona Presets",
    "te": "త్వరిత పౌర ప్రొఫైల్ నమూనాలు",
    "hi": "त्वरित नागरिक प्रोफ़ाइल प्रीसेट",
    "ur": "فوری شہری پروفائل نمونے"
  },
  "profile_saveBtn": {
    "en": "Save & Discover Schemes",
    "te": "భద్రపరిచి పథకాలను అన్వేషించండి",
    "hi": "सहेजें और योजनाएं खोजें",
    "ur": "محفوظ کریں اور اسکیمیں تلاش کریں"
  },
  "profile_state": {
    "en": "State / Union Territory",
    "te": "రాష్ట్రం / కేంద్రపాలిత ప్రాంతం",
    "hi": "राज्य / केंद्र शासित प्रदेश",
    "ur": "ریاست / مرکز کے زیر انتظام علاقہ"
  },
  "profile_subtitle": {
    "en": "Configure your household attributes to automatically evaluate eligibility across all central and state welfare schemes.",
    "te": "కేంద్ర మరియు రాష్ట్ర సంక్షేమ పథకాలలో మీ అర్హతను స్వయంచాలకంగా అంచనా వేయడానికి మీ కుటుంబ వివరాలను పూరించండి.",
    "hi": "सभी केंद्रीय और राज्य कल्याणकारी योजनाओं में पात्रता का स्वतः मूल्यांकन करने के लिए अपने परिवार का विवरण दर्ज करें।",
    "ur": "تمام مرکزی اور ریاستی فلاحی اسکیموں میں اپنی اہلیت جانچنے کے لیے اپنے خاندان کی تفصیلات درج کریں۔"
  },
  "profile_title": {
    "en": "Citizen Demographic Profile",
    "te": "పౌరుడి జనాభా ప్రొఫైల్",
    "hi": "नागरिक जनसांख्यिकीय प्रोफ़ाइल",
    "ur": "شہری آبادیاتی پروفائل"
  },
  "profile_validateBtn": {
    "en": "Validate Profile Schema",
    "te": "ప్రొఫైల్ ఫారమ్ ధృవీకరించండి",
    "hi": "प्रोफ़ाइल सत्यापित करें",
    "ur": "پروفائل کی تصدیق کریں"
  },
  "rescue.alternatives.heading": {
    "en": "Verified Alternative Schemes Matching Your Household Profile",
    "te": "మీ కుటుంబ ప్రొఫైల్కు సరిపోయే ఇతర ధృవీకరించబడిన పథకాలు",
    "hi": "आपकी पारिवारिक प्रोफ़ाइल से मेल खाने वाली अन्य सत्यापित योजनाएं",
    "ur": "آپ کے خاندانی پروفائل سے مطابقت رکھنے والی دیگر تصدیق شدہ اسکیمیں"
  },
  "rescue.badge": {
    "en": "National Scholarship Portal (NSP) & DBT Defect Rescue",
    "te": "నేషనల్ స్కాలర్షిప్ పోర్టల్ (NSP) & DBT లోపాల పరిష్కార కేంద్రం",
    "hi": "नेशनल स्कॉलरशिप पोर्टल (NSP) और DBT दोष निवारण केंद्र",
    "ur": "نیشنل اسکالرشپ پورٹل (NSP) اور DBT خرابیوں کا حل"
  },
  "rescue.btn.confirm.answers": {
    "en": "Confirm Answers & Show Recovery Steps",
    "te": "సమాధానాలు నిర్ధారించి పరిష్కార మార్గాన్ని చూపించు",
    "hi": "उत्तरों की पुष्टि करें और समाधान चरण दिखाएं",
    "ur": "جوابات کی تصدیق کریں اور حل کے مراحل دیکھیں"
  },
  "rescue.btn.diagnose": {
    "en": "Diagnose My Application",
    "te": "నా దరఖాస్తును పరిశీలించు",
    "hi": "मेरे आवेदन की जांच करें",
    "ur": "میری درخواست کی تشخیص کریں"
  },
  "rescue.citations.heading": {
    "en": "Official Government Evidence & Manual Citations",
    "te": "అధికారిక ప్రభుత్వ ఆధారాలు & మాన్యువల్ నిబంధనలు",
    "hi": "आधिकारिक सरकारी प्रमाण और नियमावली संदर्भ",
    "ur": "سرکاری شواہد اور دستور العمل کے حوالے"
  },
  "rescue.copy.draft": {
    "en": "Copy Draft",
    "te": "కాపీ చేయండి",
    "hi": "पत्र कॉपी करें",
    "ur": "مسودہ کاپی کریں"
  },
  "rescue.draft.heading": {
    "en": "Polite Message Draft for College Scholarship Office / Nodal Counter",
    "te": "కళాశాల స్కాలర్షిప్ ఆఫీసు / నోడల్ అధికారి కోసం విన్నపం పత్రం",
    "hi": "कॉलेज छात्रवृत्ति कार्यालय / नोडल काउंटर के लिए विनम्र प्रार्थना पत्र",
    "ur": "کالج اسکالرشپ آفس / نوڈل کاؤنٹر کے لیے درخواست کا مسودہ"
  },
  "rescue.input.label": {
    "en": "Paste Portal Defect / Status Message (or use Voice Assistant)",
    "te": "పోర్టల్ స్టేటస్ మెసేజ్ను పేస్ట్ చేయండి (లేదా వాయిస్ సహాయకుడిని వాడండి)",
    "hi": "पोर्टल दोष / स्टेटस संदेश पेस्ट करें (या वॉयस सहायक का उपयोग करें)",
    "ur": "پورٹل اسٹیٹس پیغام درج کریں (یا وائس اسسٹنٹ استعمال کریں)"
  },
  "rescue.known.facts": {
    "en": "Confirmed Rule Facts",
    "te": "నిబంధనల ప్రకారం నిర్ధారించబడినవి",
    "hi": "नियमों द्वारा पुष्ट तथ्य",
    "ur": "قواعد کے مطابق تصدیق شدہ حقائق"
  },
  "rescue.pii.shield.label": {
    "en": "Zero-PII Browser Shield:",
    "te": "గోప్యతా రక్షణ కవచం (Zero-PII):",
    "hi": "गोपनीयता सुरक्षा कवच (Zero-PII):",
    "ur": "رازداری کا تحفظ (Zero-PII):"
  },
  "rescue.presets.heading": {
    "en": "Common Scholarship & DBT Defect Messages (Tap to Test)",
    "te": "సాధారణ స్కాలర్షిప్ & DBT లోపం మెసేజ్లు (పరీక్షించడానికి నొక్కండి)",
    "hi": "सामान्य छात्रवृत्ति और DBT दोष संदेश (जांचने के लिए टैप करें)",
    "ur": "عام اسکالرشپ اور DBT خرابی کے پیغامات (ٹیسٹ کرنے کے لیے کلک کریں)"
  },
  "rescue.print.slip": {
    "en": "Print Action Slip",
    "te": "యాక్షన్ స్లిప్ ప్రింట్ చేయండి",
    "hi": "एक्शन स्लिप प्रिंट करें",
    "ur": "ایکشن سلپ پرنٹ کریں"
  },
  "rescue.simple.exp.heading": {
    "en": "What This Status Means in Simple Language",
    "te": "ఈ స్టేటస్ అర్థం సరళమైన భాషలో",
    "hi": "सरल भाषा में इस स्टेटस का अर्थ",
    "ur": "آسان زبان میں اس اسٹیٹس کا مطلب"
  },
  "rescue.steps.heading": {
    "en": "Evidence-Backed Step-by-Step Recovery Plan",
    "te": "ఆధారాలతో కూడిన దశలవారీ పరిష్కార ప్రణాళిక",
    "hi": "प्रमाण-आधारित चरण-दर-चरण समाधान योजना",
    "ur": "شواہد پر مبنی مرحلہ وار بحالی کا منصوبہ"
  },
  "rescue.subtitle": {
    "en": "Paste your National Scholarship Portal (NSP) or DBT defect message below. Our deterministic rules engine explains the issue in simple language, identifies whether you, your college, or your bank must act, and drafts a polite office request.",
    "te": "మీ నేషనల్ స్కాలర్షిప్ పోర్టల్ (NSP) లేదా DBT లోపం మెసేజ్ను క్రింద పేస్ట్ చేయండి. ఎవరు చర్య తీసుకోవాలో తెలుసుకోండి మరియు కళాశాల ఆఫీసు కోసం విన్నపం పత్రాన్ని పొందండి.",
    "hi": "अपना नेशनल स्कॉलरशिप पोर्टल (NSP) या DBT दोष संदेश नीचे पेस्ट करें। हमारा नियम इंजन सरल भाषा में समस्या समझाता है और कार्यालय के लिए एक विनम्र पत्र तैयार करता है।",
    "ur": "اپنا نیشنل اسکالرشپ پورٹل (NSP) یا DBT خرابی کا پیغام نیچے درج کریں۔ ہمارا سسٹم آسان زبان میں مسئلہ سمجھاتا ہے اور کالج کے لیے درخواست کا مسودہ بناتا ہے۔"
  },
  "rescue.title": {
    "en": "Scholarship & Benefit Defect Rescue",
    "te": "స్కాలర్షిప్ & ప్రభుత్వ పథకాల లోపాల పరిష్కార కేంద్రం",
    "hi": "छात्रवृत्ति एवं सरकारी योजना आवेदन दोष निवारण (Rescue Mode)",
    "ur": "اسکالرشپ اور سرکاری اسکیم کی درخواستوں کی خرابی کا حل"
  },
  "rescue.unknown.check": {
    "en": "What You Must Check",
    "te": "మీరు తనిఖీ చేయవలసినవి",
    "hi": "आपको क्या जांचना चाहिए",
    "ur": "آپ کو کیا چیک کرنا چاہیے"
  },
  "rescue.unverified.boundary": {
    "en": "Unverified Boundary",
    "te": "సిస్టమ్ పరిమితి",
    "hi": "असत्यापित सीमा",
    "ur": "سسٹم کی حدود"
  },
  "rescue_alternatives_heading": {
    "en": "Verified Alternative Schemes Matching Your Household Profile",
    "te": "మీ కుటుంబ ప్రొఫైల్కు సరిపోయే ఇతర ధృవీకరించబడిన పథకాలు",
    "hi": "आपकी पारिवारिक प्रोफ़ाइल से मेल खाने वाली अन्य सत्यापित योजनाएं",
    "ur": "آپ کے خاندانی پروفائل سے مطابقت رکھنے والی دیگر تصدیق شدہ اسکیمیں"
  },
  "rescue_badge": {
    "en": "National Scholarship Portal (NSP) & DBT Defect Rescue",
    "te": "నేషనల్ స్కాలర్షిప్ పోర్టల్ (NSP) & DBT లోపాల పరిష్కార కేంద్రం",
    "hi": "नेशनल स्कॉलरशिप पोर्टल (NSP) और DBT दोष निवारण केंद्र",
    "ur": "نیشنل اسکالرشپ پورٹل (NSP) اور DBT خرابیوں کا حل"
  },
  "rescue_btn_confirm_answers": {
    "en": "Confirm Answers & Show Recovery Steps",
    "te": "సమాధానాలు నిర్ధారించి పరిష్కార మార్గాన్ని చూపించు",
    "hi": "उत्तरों की पुष्टि करें और समाधान चरण दिखाएं",
    "ur": "جوابات کی تصدیق کریں اور حل کے مراحل دیکھیں"
  },
  "rescue_btn_diagnose": {
    "en": "Diagnose My Application",
    "te": "నా దరఖాస్తును పరిశీలించు",
    "hi": "मेरे आवेदन की जांच करें",
    "ur": "میری درخواست کی تشخیص کریں"
  },
  "rescue_citations_heading": {
    "en": "Official Government Evidence & Manual Citations",
    "te": "అధికారిక ప్రభుత్వ ఆధారాలు & మాన్యువల్ నిబంధనలు",
    "hi": "आधिकारिक सरकारी प्रमाण और नियमावली संदर्भ",
    "ur": "سرکاری شواہد اور دستور العمل کے حوالے"
  },
  "rescue_copy_draft": {
    "en": "Copy Draft",
    "te": "కాపీ చేయండి",
    "hi": "पत्र कॉपी करें",
    "ur": "مسودہ کاپی کریں"
  },
  "rescue_draft_heading": {
    "en": "Polite Message Draft for College Scholarship Office / Nodal Counter",
    "te": "కళాశాల స్కాలర్షిప్ ఆఫీసు / నోడల్ అధికారి కోసం విన్నపం పత్రం",
    "hi": "कॉलेज छात्रवृत्ति कार्यालय / नोडल काउंटर के लिए विनम्र प्रार्थना पत्र",
    "ur": "کالج اسکالرشپ آفس / نوڈل کاؤنٹر کے لیے درخواست کا مسودہ"
  },
  "rescue_input_label": {
    "en": "Paste Portal Defect / Status Message (or use Voice Assistant)",
    "te": "పోర్టల్ స్టేటస్ మెసేజ్ను పేస్ట్ చేయండి (లేదా వాయిస్ సహాయకుడిని వాడండి)",
    "hi": "पोर्टल दोष / स्टेटस संदेश पेस्ट करें (या वॉयस सहायक का उपयोग करें)",
    "ur": "پورٹل اسٹیٹس پیغام درج کریں (یا وائس اسسٹنٹ استعمال کریں)"
  },
  "rescue_known_facts": {
    "en": "Confirmed Rule Facts",
    "te": "నిబంధనల ప్రకారం నిర్ధారించబడినవి",
    "hi": "नियमों द्वारा पुष्ट तथ्य",
    "ur": "قواعد کے مطابق تصدیق شدہ حقائق"
  },
  "rescue_pii_shield_label": {
    "en": "Zero-PII Browser Shield:",
    "te": "గోప్యతా రక్షణ కవచం (Zero-PII):",
    "hi": "गोपनीयता सुरक्षा कवच (Zero-PII):",
    "ur": "رازداری کا تحفظ (Zero-PII):"
  },
  "rescue_presets_heading": {
    "en": "Common Scholarship & DBT Defect Messages (Tap to Test)",
    "te": "సాధారణ స్కాలర్షిప్ & DBT లోపం మెసేజ్లు (పరీక్షించడానికి నొక్కండి)",
    "hi": "सामान्य छात्रवृत्ति और DBT दोष संदेश (जांचने के लिए टैप करें)",
    "ur": "عام اسکالرشپ اور DBT خرابی کے پیغامات (ٹیسٹ کرنے کے لیے کلک کریں)"
  },
  "rescue_print_slip": {
    "en": "Print Action Slip",
    "te": "యాక్షన్ స్లిప్ ప్రింట్ చేయండి",
    "hi": "एक्शन स्लिप प्रिंट करें",
    "ur": "ایکشن سلپ پرنٹ کریں"
  },
  "rescue_simple_exp_heading": {
    "en": "What This Status Means in Simple Language",
    "te": "ఈ స్టేటస్ అర్థం సరళమైన భాషలో",
    "hi": "सरल भाषा में इस स्टेटस का अर्थ",
    "ur": "آسان زبان میں اس اسٹیٹس کا مطلب"
  },
  "rescue_steps_heading": {
    "en": "Evidence-Backed Step-by-Step Recovery Plan",
    "te": "ఆధారాలతో కూడిన దశలవారీ పరిష్కార ప్రణాళిక",
    "hi": "प्रमाण-आधारित चरण-दर-चरण समाधान योजना",
    "ur": "شواہد پر مبنی مرحلہ وار بحالی کا منصوبہ"
  },
  "rescue_subtitle": {
    "en": "Paste your National Scholarship Portal (NSP) or DBT defect message below. Our deterministic rules engine explains the issue in simple language, identifies whether you, your college, or your bank must act, and drafts a polite office request.",
    "te": "మీ నేషనల్ స్కాలర్షిప్ పోర్టల్ (NSP) లేదా DBT లోపం మెసేజ్ను క్రింద పేస్ట్ చేయండి. ఎవరు చర్య తీసుకోవాలో తెలుసుకోండి మరియు కళాశాల ఆఫీసు కోసం విన్నపం పత్రాన్ని పొందండి.",
    "hi": "अपना नेशनल स्कॉलरशिप पोर्टल (NSP) या DBT दोष संदेश नीचे पेस्ट करें। हमारा नियम इंजन सरल भाषा में समस्या समझाता है और कार्यालय के लिए एक विनम्र पत्र तैयार करता है।",
    "ur": "اپنا نیشنل اسکالرشپ پورٹل (NSP) یا DBT خرابی کا پیغام نیچے درج کریں۔ ہمارا سسٹم آسان زبان میں مسئلہ سمجھاتا ہے اور کالج کے لیے درخواست کا مسودہ بناتا ہے۔"
  },
  "rescue_title": {
    "en": "Scholarship & Benefit Defect Rescue",
    "te": "స్కాలర్షిప్ & ప్రభుత్వ పథకాల లోపాల పరిష్కార కేంద్రం",
    "hi": "छात्रवृत्ति एवं सरकारी योजना आवेदन दोष निवारण (Rescue Mode)",
    "ur": "اسکالرشپ اور سرکاری اسکیم کی درخواستوں کی خرابی کا حل"
  },
  "rescue_unknown_check": {
    "en": "What You Must Check",
    "te": "మీరు తనిఖీ చేయవలసినవి",
    "hi": "आपको क्या जांचना चाहिए",
    "ur": "آپ کو کیا چیک کرنا چاہیے"
  },
  "rescue_unverified_boundary": {
    "en": "Unverified Boundary",
    "te": "సిస్టమ్ పరిమితి",
    "hi": "असत्यापित सीमा",
    "ur": "سسٹم کی حدود"
  },
  "schemes.catAgri": {
    "en": "Agriculture",
    "te": "వ్యవసాయం",
    "hi": "कृषि",
    "ur": "زراعت"
  },
  "schemes.catAll": {
    "en": "All Schemes",
    "te": "అన్ని పథకాలు",
    "hi": "सभी योजनाएं",
    "ur": "تمام اسکیمیں"
  },
  "schemes.catEdu": {
    "en": "Education",
    "te": "విద్య & స్కాలర్షిప్స్",
    "hi": "शिक्षा",
    "ur": "تعلیم"
  },
  "schemes.catHealth": {
    "en": "Healthcare",
    "te": "వైద్య ఆరోగ్యం",
    "hi": "स्वास्थ्य सेवा",
    "ur": "صحت عامہ"
  },
  "schemes.catHousing": {
    "en": "Housing",
    "te": "గృహ నిర్మాణం",
    "hi": "आवास",
    "ur": "رہائش"
  },
  "schemes.desc": {
    "en": "Verified central and state government schemes evaluated deterministically against your citizen profile.",
    "te": "మీ పౌరుని వివరాల ఆధారంగా ధృవీకరించబడిన కేంద్ర మరియు రాష్ట్ర ప్రభుత్వ పథకాల సమాచారం.",
    "hi": "आपकी नागरिक प्रोफ़ाइल के आधार पर सत्यापित केंद्र और राज्य सरकार की योजनाएं।",
    "ur": "آپ کے پروفائل کی بنیاد پر تصدیق شدہ مرکزی اور ریاستی اسکیمیں۔"
  },
  "schemes.noResults": {
    "en": "No schemes found matching your search.",
    "te": "మీ శోధనకు తగిన పథకాలు ఏవీ కనుగొనబడలేదు.",
    "hi": "आपकी खोज से मेल खाने वाली कोई योजना नहीं मिली।",
    "ur": "آپ کی تلاش کے مطابق کوئی اسکیم نہیں ملی۔"
  },
  "schemes.rankForMe": {
    "en": "Rank for My Profile",
    "te": "నా ప్రొఫైల్ ప్రకారం క్రమబద్ధీకరించు",
    "hi": "मेरी प्रोफ़ाइल के अनुसार क्रमबद्ध करें",
    "ur": "میرے پروفائل کے مطابق ترتیب دیں"
  },
  "schemes.resetFilters": {
    "en": "Reset Filters",
    "te": "ఫిల్టర్లు రీసెట్ చేయండి",
    "hi": "फ़िल्टर रीसेट करें",
    "ur": "فلٹرز ری سیٹ کریں"
  },
  "schemes.searchPlaceholder": {
    "en": "Search by scheme name, ministry, or benefits...",
    "te": "పథకం పేరు, మంత్రిత్వ శాఖ లేదా ప్రయోజనాల ద్వారా శోధించండి...",
    "hi": "योजना का नाम, मंत्रालय या लाभ खोजें...",
    "ur": "اسکیم کا نام، وزارت یا فوائد تلاش کریں..."
  },
  "schemes.title": {
    "en": "Schemes Discovery",
    "te": "పథకాల అన్వేషణ",
    "hi": "योजना खोज",
    "ur": "اسکیموں کی تلاش"
  },
  "schemes_catAgri": {
    "en": "Agriculture",
    "te": "వ్యవసాయం",
    "hi": "कृषि",
    "ur": "زراعت"
  },
  "schemes_catAll": {
    "en": "All Schemes",
    "te": "అన్ని పథకాలు",
    "hi": "सभी योजनाएं",
    "ur": "تمام اسکیمیں"
  },
  "schemes_catEdu": {
    "en": "Education",
    "te": "విద్య & స్కాలర్షిప్స్",
    "hi": "शिक्षा",
    "ur": "تعلیم"
  },
  "schemes_catHealth": {
    "en": "Healthcare",
    "te": "వైద్య ఆరోగ్యం",
    "hi": "स्वास्थ्य सेवा",
    "ur": "صحت عامہ"
  },
  "schemes_catHousing": {
    "en": "Housing",
    "te": "గృహ నిర్మాణం",
    "hi": "आवास",
    "ur": "رہائش"
  },
  "schemes_desc": {
    "en": "Verified central and state government schemes evaluated deterministically against your citizen profile.",
    "te": "మీ పౌరుని వివరాల ఆధారంగా ధృవీకరించబడిన కేంద్ర మరియు రాష్ట్ర ప్రభుత్వ పథకాల సమాచారం.",
    "hi": "आपकी नागरिक प्रोफ़ाइल के आधार पर सत्यापित केंद्र और राज्य सरकार की योजनाएं।",
    "ur": "آپ کے پروفائل کی بنیاد پر تصدیق شدہ مرکزی اور ریاستی اسکیمیں۔"
  },
  "schemes_noResults": {
    "en": "No schemes found matching your search.",
    "te": "మీ శోధనకు తగిన పథకాలు ఏవీ కనుగొనబడలేదు.",
    "hi": "आपकी खोज से मेल खाने वाली कोई योजना नहीं मिली।",
    "ur": "آپ کی تلاش کے مطابق کوئی اسکیم نہیں ملی۔"
  },
  "schemes_rankForMe": {
    "en": "Rank for My Profile",
    "te": "నా ప్రొఫైల్ ప్రకారం క్రమబద్ధీకరించు",
    "hi": "मेरी प्रोफ़ाइल के अनुसार क्रमबद्ध करें",
    "ur": "میرے پروفائل کے مطابق ترتیب دیں"
  },
  "schemes_resetFilters": {
    "en": "Reset Filters",
    "te": "ఫిల్టర్లు రీసెట్ చేయండి",
    "hi": "फ़िल्टर रीसेट करें",
    "ur": "فلٹرز ری سیٹ کریں"
  },
  "schemes_searchPlaceholder": {
    "en": "Search by scheme name, ministry, or benefits...",
    "te": "పథకం పేరు, మంత్రిత్వ శాఖ లేదా ప్రయోజనాల ద్వారా శోధించండి...",
    "hi": "योजना का नाम, मंत्रालय या लाभ खोजें...",
    "ur": "اسکیم کا نام، وزارت یا فوائد تلاش کریں..."
  },
  "schemes_title": {
    "en": "Schemes Discovery",
    "te": "పథకాల అన్వేషణ",
    "hi": "योजना खोज",
    "ur": "اسکیموں کی تلاش"
  },
  "sources.badge": {
    "en": "Cryptographic Provenance Tier-1",
    "te": "ధృవీకరించబడిన ప్రభుత్వ మూలం (Tier-1)",
    "hi": "सत्यापित सरकारी स्रोत (Tier-1)",
    "ur": "تصدیق شدہ سرکاری ماخذ (درجہ اول)"
  },
  "sources.retrieval": {
    "en": "Deterministic Trust Score",
    "te": "విశ్వసనీయత స్కోర్",
    "hi": "विश्वसनीयता स्कोर",
    "ur": "قابل اعتماد اسکور"
  },
  "sources.subtitle": {
    "en": "PolicyPilot operates exclusively on Tier-1 government gazettes, ministry portals, and operational guidelines with cryptographic citations.",
    "te": "పాలసీపైలట్ అధికారిక ప్రభుత్వ గెజిట్లు, మంత్రిత్వ శాఖల పోర్టల్‌లు మరియు నిబంధనల ఆధారంగా మాత్రమే పనిచేస్తుంది.",
    "hi": "पॉलिसीपायलट केवल आधिकारिक सरकारी राजपत्रों, मंत्रालय पोर्टलों और सत्यापित दिशानिर्देशों पर काम करता है।",
    "ur": "پالیسی پائلٹ خصوصی طور پر درجہ اول کے سرکاری گزٹ، وزارت کے پورٹلز اور باضابطہ رہنما خطوط پر کام کرتا ہے۔"
  },
  "sources.tier1": {
    "en": "Official Gazette Ratio",
    "te": "అధికారిక గెజిట్ నిష్పత్తి",
    "hi": "आधिकारिक राजपत्र अनुपात",
    "ur": "سرکاری گزٹ تناسب"
  },
  "sources.title": {
    "en": "Official Sources & Verification Proof",
    "te": "అధికారిక వనరులు & ధృవీకరణ ఆధారాలు",
    "hi": "आधिकारिक स्रोत और सत्यापन साक्ष्य",
    "ur": "سرکاری ذرائع اور تصدیقی ثبوت"
  },
  "sources.total": {
    "en": "Indexed Sources",
    "te": "సూచిక చేయబడిన వనరులు",
    "hi": "सूचीबद्ध स्रोत",
    "ur": "فہرست شدہ ذرائع"
  },
  "sources.verified": {
    "en": "Active Verifications",
    "te": "క్రియాశీల ధృవీకరణలు",
    "hi": "సक्रिय सत्यापन",
    "ur": "فعال تصدیقیں"
  },
  "sources_badge": {
    "en": "Cryptographic Provenance Tier-1",
    "te": "ధృవీకరించబడిన ప్రభుత్వ మూలం (Tier-1)",
    "hi": "सत्यापित सरकारी स्रोत (Tier-1)",
    "ur": "تصدیق شدہ سرکاری ماخذ (درجہ اول)"
  },
  "sources_retrieval": {
    "en": "Deterministic Trust Score",
    "te": "విశ్వసనీయత స్కోర్",
    "hi": "विश्वसनीयता स्कोर",
    "ur": "قابل اعتماد اسکور"
  },
  "sources_subtitle": {
    "en": "PolicyPilot operates exclusively on Tier-1 government gazettes, ministry portals, and operational guidelines with cryptographic citations.",
    "te": "పాలసీపైలట్ అధికారిక ప్రభుత్వ గెజిట్లు, మంత్రిత్వ శాఖల పోర్టల్‌లు మరియు నిబంధనల ఆధారంగా మాత్రమే పనిచేస్తుంది.",
    "hi": "पॉलिसीपायलट केवल आधिकारिक सरकारी राजपत्रों, मंत्रालय पोर्टलों और सत्यापित दिशानिर्देशों पर काम करता है।",
    "ur": "پالیسی پائلٹ خصوصی طور پر درجہ اول کے سرکاری گزٹ، وزارت کے پورٹلز اور باضابطہ رہنما خطوط پر کام کرتا ہے۔"
  },
  "sources_tier1": {
    "en": "Official Gazette Ratio",
    "te": "అధికారిక గెజిట్ నిష్పత్తి",
    "hi": "आधिकारिक राजपत्र अनुपात",
    "ur": "سرکاری گزٹ تناسب"
  },
  "sources_title": {
    "en": "Official Sources & Verification Proof",
    "te": "అధికారిక వనరులు & ధృవీకరణ ఆధారాలు",
    "hi": "आधिकारिक स्रोत और सत्यापन साक्ष्य",
    "ur": "سرکاری ذرائع اور تصدیقی ثبوت"
  },
  "sources_total": {
    "en": "Indexed Sources",
    "te": "సూచిక చేయబడిన వనరులు",
    "hi": "सूचीबद्ध स्रोत",
    "ur": "فہرست شدہ ذرائع"
  },
  "sources_verified": {
    "en": "Active Verifications",
    "te": "క్రియాశీల ధృవీకరణలు",
    "hi": "సक्रिय सत्यापन",
    "ur": "فعال تصدیقیں"
  },
  "tts.pause": {
    "en": "Pause",
    "te": "ఆపు",
    "hi": "रोकें",
    "ur": "روکیں"
  },
  "tts.play": {
    "en": "Listen",
    "te": "వినండి",
    "hi": "सुनें",
    "ur": "سنیں"
  },
  "tts.replay": {
    "en": "Replay",
    "te": "మళ్లీ వినండి",
    "hi": "फिर से सुनें",
    "ur": "دوبارہ سنیں"
  },
  "tts.resume": {
    "en": "Resume",
    "te": "కొనసాగించు",
    "hi": "जारी रखें",
    "ur": "جاری رکھیں"
  },
  "tts.stop": {
    "en": "Stop Audio",
    "te": "ఆడియో ఆపు",
    "hi": "ऑडियो रोकें",
    "ur": "آڈیو روکیں"
  },
  "tts_pause": {
    "en": "Pause",
    "te": "ఆపు",
    "hi": "रोकें",
    "ur": "روکیں"
  },
  "tts_play": {
    "en": "Listen",
    "te": "వినండి",
    "hi": "सुनें",
    "ur": "سنیں"
  },
  "tts_replay": {
    "en": "Replay",
    "te": "మళ్లీ వినండి",
    "hi": "फिर से सुनें",
    "ur": "دوبارہ سنیں"
  },
  "tts_resume": {
    "en": "Resume",
    "te": "కొనసాగించు",
    "hi": "जारी रखें",
    "ur": "جاری رکھیں"
  },
  "tts_stop": {
    "en": "Stop Audio",
    "te": "ఆడియో ఆపు",
    "hi": "ऑडियो रोकें",
    "ur": "آڈیو روکیں"
  },
  "voice.btn.speak": {
    "en": "Ask Assistant",
    "te": "వాయిస్ సహాయకుడు",
    "hi": "वॉयस सहायक",
    "ur": "وائس اسسٹنٹ"
  },
  "voice.clear.history": {
    "en": "Clear Chat",
    "te": "చాట్ క్లియర్ చేయి",
    "hi": "चैट साफ़ करें",
    "ur": "چیٹ صاف کریں"
  },
  "voice.listening": {
    "en": "Listening... speak now",
    "te": "వింటోంది... మాట్లాడండి",
    "hi": "सुन रहा है... अब बोलें",
    "ur": "سن رہا ہے... اب بولیں"
  },
  "voice.modal.subtitle": {
    "en": "Ask natural questions about schemes, eligibility, documents, or defects in English, Telugu, Hindi, or Urdu.",
    "te": "పథకాలు, అర్హత, పత్రాలు లేదా సమస్యల గురించి తెలుగు, ఇంగ్లీష్, హిందీ లేదా ఉర్దూలో అడగండి.",
    "hi": "योजनाओं, पात्रता, दस्तावेजों या समस्याओं के बारे में हिंदी, तेलुगु, उर्दू या अंग्रेजी में प्रश्न पूछें।",
    "ur": "اسکیموں، اہلیت، دستاویزات یا خرابیوں کے بارے में اردو، تلگو، ہندی یا انگریزی میں پوچھیں۔"
  },
  "voice.modal.title": {
    "en": "PolicyPilot Voice & Chat Assistant",
    "te": "PolicyPilot వాయిస్ & చాట్ సహాయకుడు",
    "hi": "PolicyPilot वॉयस और चैट सहायक",
    "ur": "PolicyPilot وائس اور چیٹ اسسٹنٹ"
  },
  "voice.permissionDenied": {
    "en": "Microphone permission was denied. Please allow microphone access or type below.",
    "te": "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి లేదా క్రింద టైప్ చేయండి.",
    "hi": "माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई। कृपया अनुमति दें या नीचे टाइप करें।",
    "ur": "مائیکروفون کی اجازت نہیں ملی۔ براہ کرم مائیک کی اجازت دیں یا نیچے ٹائپ کریں۔"
  },
  "voice.promptKisan": {
    "en": "What is PM-KISAN?",
    "te": "PM-KISAN అంటే ఏమిటి?",
    "hi": "PM-KISAN क्या है?",
    "ur": "PM-KISAN کیا ہے؟"
  },
  "voice.promptRescue": {
    "en": "Open Rescue Mode",
    "te": "రెస్క్యూ మోడ్ తెరువు",
    "hi": "रेस्क्यू मोड खोलें",
    "ur": "ریسکیو موڈ کھولیں"
  },
  "voice.promptSchemes": {
    "en": "Show all schemes",
    "te": "అన్ని పథకాలను చూపించు",
    "hi": "सभी योजनाएं दिखाएं",
    "ur": "تمام اسکیمیں دکھائیں"
  },
  "voice.promptUpdates": {
    "en": "Check scheme updates",
    "te": "కొత్త అప్డేట్లు తనిఖీ చేయి",
    "hi": "योजना अपडेट देखें",
    "ur": "اسکیم اپ ڈیٹس دیکھیں"
  },
  "voice.readAloud": {
    "en": "Read Aloud",
    "te": "చదివి వినిపించు",
    "hi": "बोलकर सुनाएं",
    "ur": "پڑھ کر سنائیں"
  },
  "voice.response": {
    "en": "Assistant Response",
    "te": "సహాయకుడి సమాధానం",
    "hi": "सहायक का उत्तर",
    "ur": "معاون کا جواب"
  },
  "voice.send.btn": {
    "en": "Send Question",
    "te": "ప్రశ్న పంపండి",
    "hi": "प्रश्न भेजें",
    "ur": "سوال بھیجیں"
  },
  "voice.sendText": {
    "en": "Send Question",
    "te": "ప్రశ్న పంపండి",
    "hi": "प्रश्न भेजें",
    "ur": "سوال بھیجیں"
  },
  "voice.speaking": {
    "en": "Speaking answer...",
    "te": "సమాధానం వినిపిస్తోంది...",
    "hi": "उत्तर सुनाया जा रहा है...",
    "ur": "جواب سنایا جا رہا ہے..."
  },
  "voice.start.mic": {
    "en": "Tap Mic to Speak",
    "te": "మాట్లాడటానికి మైక్ నొక్కండి",
    "hi": "बोलने के लिए माइक दबाएं",
    "ur": "بولنے کے لیے مائیک دبائیں"
  },
  "voice.startListening": {
    "en": "Tap Mic to Speak",
    "te": "మాట్లాడటానికి మైక్ నొక్కండి",
    "hi": "बोलने के लिए माइक दबाएं",
    "ur": "بولنے کے لیے مائیک دبائیں"
  },
  "voice.stop.mic": {
    "en": "Stop Recording",
    "te": "రికార్డింగ్ ఆపు",
    "hi": "रिकॉर्डिंग रोकें",
    "ur": "ریکارڈنگ روکیں"
  },
  "voice.stopListening": {
    "en": "Stop Recording",
    "te": "రికార్డింగ్ ఆపు",
    "hi": "रिकॉर्डिंग रोकें",
    "ur": "ریکارڈنگ روکیں"
  },
  "voice.stopSpeaking": {
    "en": "Stop Audio",
    "te": "ఆడియో ఆపు",
    "hi": "ऑडियो रोकें",
    "ur": "آڈیو روکیں"
  },
  "voice.subtitle": {
    "en": "Ask natural questions about schemes, eligibility, documents, or defects in English, Telugu, Hindi, or Urdu.",
    "te": "పథకాలు, అర్హత, పత్రాలు లేదా సమస్యల గురించి తెలుగు, ఇంగ్లీష్, హిందీ లేదా ఉర్దూలో అడగండి.",
    "hi": "योजनाओं, पात्रता, दस्तावेजों या समस्याओं के बारे में हिंदी, तेलुगु, उर्दू या अंग्रेजी में प्रश्न पूछें।",
    "ur": "اسکیموں، اہلیت، دستاویزات یا خرابیوں کے بارے میں اردو، تلگو، ہندی یا انگریزی میں پوچھیں۔"
  },
  "voice.suggested": {
    "en": "Suggested Questions",
    "te": "తరచుగా అడిగే ప్రశ్నలు",
    "hi": "सुझाए गए प्रश्न",
    "ur": "تجویز کردہ سوالات"
  },
  "voice.title": {
    "en": "PolicyPilot Voice & Chat Assistant",
    "te": "PolicyPilot వాయిస్ & చాట్ సహాయకుడు",
    "hi": "PolicyPilot वॉयस और चैट सहायक",
    "ur": "PolicyPilot وائس اور چیٹ اسسٹنٹ"
  },
  "voice.transcript": {
    "en": "Recognized Speech",
    "te": "గుర్తించిన మాటలు",
    "hi": "पहचाने गए शब्द",
    "ur": "پہچانے گئے الفاظ"
  },
  "voice.typingFallback": {
    "en": "Type your question here (or use the microphone)...",
    "te": "మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి (లేదా మైక్ ఉపయోగించండి)...",
    "hi": "अपना प्रश्न यहां लिखें (या माइक का उपयोग करें)...",
    "ur": "اپنا سوال یہاں ٹائپ کریں (یا مائیک استعمال کریں)..."
  },
  "voice.unsupported": {
    "en": "Speech recognition is not supported in this browser. Please type your question.",
    "te": "ఈ బ్రౌజర్లో స్పీచ్ రికగ్నిషన్ సదుపాయం లేదు. దయచేసి టైప్ చేయండి.",
    "hi": "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया टाइप करें।",
    "ur": "اس براؤزر میں اسپیچ ریکگنیشن کی سہولت دستیاب نہیں ہے۔ براہ کرم ٹائپ کریں۔"
  },
  "voice_btn_speak": {
    "en": "Ask Assistant",
    "te": "వాయిస్ సహాయకుడు",
    "hi": "वॉयस सहायक",
    "ur": "وائس اسسٹنٹ"
  },
  "voice_clear_history": {
    "en": "Clear Chat",
    "te": "చాట్ క్లియర్ చేయి",
    "hi": "चैट साफ़ करें",
    "ur": "چیٹ صاف کریں"
  },
  "voice_listening": {
    "en": "Listening... speak now",
    "te": "వింటోంది... మాట్లాడండి",
    "hi": "सुन रहा है... अब बोलें",
    "ur": "سن رہا ہے... اب بولیں"
  },
  "voice_modal_subtitle": {
    "en": "Ask natural questions about schemes, eligibility, documents, or defects in English, Telugu, Hindi, or Urdu.",
    "te": "పథకాలు, అర్హత, పత్రాలు లేదా సమస్యల గురించి తెలుగు, ఇంగ్లీష్, హిందీ లేదా ఉర్దూలో అడగండి.",
    "hi": "योजनाओं, पात्रता, दस्तावेजों या समस्याओं के बारे में हिंदी, तेलुगु, उर्दू या अंग्रेजी में प्रश्न पूछें।",
    "ur": "اسکیموں، اہلیت، دستاویزات یا خرابیوں کے بارے में اردو، تلگو، ہندی یا انگریزی میں پوچھیں۔"
  },
  "voice_modal_title": {
    "en": "PolicyPilot Voice & Chat Assistant",
    "te": "PolicyPilot వాయిస్ & చాట్ సహాయకుడు",
    "hi": "PolicyPilot वॉयस और चैट सहायक",
    "ur": "PolicyPilot وائس اور چیٹ اسسٹنٹ"
  },
  "voice_permissionDenied": {
    "en": "Microphone permission was denied. Please allow microphone access or type below.",
    "te": "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి లేదా క్రింద టైప్ చేయండి.",
    "hi": "माइक्रोफ़ोन की अनुमति अस्वीकृत कर दी गई। कृपया अनुमति दें या नीचे टाइप करें।",
    "ur": "مائیکروفون کی اجازت نہیں ملی۔ براہ کرم مائیک کی اجازت دیں یا نیچے ٹائپ کریں۔"
  },
  "voice_promptKisan": {
    "en": "What is PM-KISAN?",
    "te": "PM-KISAN అంటే ఏమిటి?",
    "hi": "PM-KISAN क्या है?",
    "ur": "PM-KISAN کیا ہے؟"
  },
  "voice_promptRescue": {
    "en": "Open Rescue Mode",
    "te": "రెస్క్యూ మోడ్ తెరువు",
    "hi": "रेस्क्यू मोड खोलें",
    "ur": "ریسکیو موڈ کھولیں"
  },
  "voice_promptSchemes": {
    "en": "Show all schemes",
    "te": "అన్ని పథకాలను చూపించు",
    "hi": "सभी योजनाएं दिखाएं",
    "ur": "تمام اسکیمیں دکھائیں"
  },
  "voice_promptUpdates": {
    "en": "Check scheme updates",
    "te": "కొత్త అప్డేట్లు తనిఖీ చేయి",
    "hi": "योजना अपडेट देखें",
    "ur": "اسکیم اپ ڈیٹس دیکھیں"
  },
  "voice_readAloud": {
    "en": "Read Aloud",
    "te": "చదివి వినిపించు",
    "hi": "बोलकर सुनाएं",
    "ur": "پڑھ کر سنائیں"
  },
  "voice_response": {
    "en": "Assistant Response",
    "te": "సహాయకుడి సమాధానం",
    "hi": "सहायक का उत्तर",
    "ur": "معاون کا جواب"
  },
  "voice_sendText": {
    "en": "Send Question",
    "te": "ప్రశ్న పంపండి",
    "hi": "प्रश्न भेजें",
    "ur": "سوال بھیجیں"
  },
  "voice_send_btn": {
    "en": "Send Question",
    "te": "ప్రశ్న పంపండి",
    "hi": "प्रश्न भेजें",
    "ur": "سوال بھیجیں"
  },
  "voice_speaking": {
    "en": "Speaking answer...",
    "te": "సమాధానం వినిపిస్తోంది...",
    "hi": "उत्तर सुनाया जा रहा है...",
    "ur": "جواب سنایا جا رہا ہے..."
  },
  "voice_startListening": {
    "en": "Tap Mic to Speak",
    "te": "మాట్లాడటానికి మైక్ నొక్కండి",
    "hi": "बोलने के लिए माइक दबाएं",
    "ur": "بولنے کے لیے مائیک دبائیں"
  },
  "voice_start_mic": {
    "en": "Tap Mic to Speak",
    "te": "మాట్లాడటానికి మైక్ నొక్కండి",
    "hi": "बोलने के लिए माइक दबाएं",
    "ur": "بولنے کے لیے مائیک دبائیں"
  },
  "voice_stopListening": {
    "en": "Stop Recording",
    "te": "రికార్డింగ్ ఆపు",
    "hi": "रिकॉर्डिंग रोकें",
    "ur": "ریکارڈنگ روکیں"
  },
  "voice_stopSpeaking": {
    "en": "Stop Audio",
    "te": "ఆడియో ఆపు",
    "hi": "ऑडियो रोकें",
    "ur": "آڈیو روکیں"
  },
  "voice_stop_mic": {
    "en": "Stop Recording",
    "te": "రికార్డింగ్ ఆపు",
    "hi": "रिकॉर्डिंग रोकें",
    "ur": "ریکارڈنگ روکیں"
  },
  "voice_subtitle": {
    "en": "Ask natural questions about schemes, eligibility, documents, or defects in English, Telugu, Hindi, or Urdu.",
    "te": "పథకాలు, అర్హత, పత్రాలు లేదా సమస్యల గురించి తెలుగు, ఇంగ్లీష్, హిందీ లేదా ఉర్దూలో అడగండి.",
    "hi": "योजनाओं, पात्रता, दस्तावेजों या समस्याओं के बारे में हिंदी, तेलुगु, उर्दू या अंग्रेजी में प्रश्न पूछें।",
    "ur": "اسکیموں، اہلیت، دستاویزات یا خرابیوں کے بارے میں اردو، تلگو، ہندی یا انگریزی میں پوچھیں۔"
  },
  "voice_suggested": {
    "en": "Suggested Questions",
    "te": "తరచుగా అడిగే ప్రశ్నలు",
    "hi": "सुझाए गए प्रश्न",
    "ur": "تجویز کردہ سوالات"
  },
  "voice_title": {
    "en": "PolicyPilot Voice & Chat Assistant",
    "te": "PolicyPilot వాయిస్ & చాట్ సహాయకుడు",
    "hi": "PolicyPilot वॉयस और चैट सहायक",
    "ur": "PolicyPilot وائس اور چیٹ اسسٹنٹ"
  },
  "voice_transcript": {
    "en": "Recognized Speech",
    "te": "గుర్తించిన మాటలు",
    "hi": "पहचाने गए शब्द",
    "ur": "پہچانے گئے الفاظ"
  },
  "voice_typingFallback": {
    "en": "Type your question here (or use the microphone)...",
    "te": "మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి (లేదా మైక్ ఉపయోగించండి)...",
    "hi": "अपना प्रश्न यहां लिखें (या माइक का उपयोग करें)...",
    "ur": "اپنا سوال یہاں ٹائپ کریں (یا مائیک استعمال کریں)..."
  },
  "voice_unsupported": {
    "en": "Speech recognition is not supported in this browser. Please type your question.",
    "te": "ఈ బ్రౌజర్లో స్పీచ్ రికగ్నిషన్ సదుపాయం లేదు. దయచేసి టైప్ చేయండి.",
    "hi": "इस ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया टाइप करें।",
    "ur": "اس براؤزر میں اسپیچ ریکگنیشن کی سہولت دستیاب نہیں ہے۔ براہ کرم ٹائپ کریں۔"
  },
};

export const LOCALIZED_SCHEME_MAP: Record<
  string,
  Record<LanguageCode, { name: string; description: string }>
> = {
  "pm-kisan": {
    en: {
      name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      description:
        "Centrally sponsored income support of ₹6,000 per year in three equal installments of ₹2,000 directly via DBT to all landholding farmer families.",
    },
    te: {
      name: "ప్రధాన్ మంత్రి కిసాన్ సమ్మాన్ నిధి (PM-KISAN)",
      description:
        "సాగు భూమి కలిగిన రైతు కుటుంబాలకు ఏడాదికి ₹6,000 ఆర్థిక సహాయం (మూడు విడతలలో ₹2,000 చొప్పున) నేరుగా DBT ద్వారా జమ.",
    },
    hi: {
      name: "प्रधानमंत्री किसान सम्मान निधि (PM-KISAN)",
      description:
        "सभी भूमिधारक किसान परिवारों को DBT के माध्यम से ₹2,000 की तीन समान किस्तों में ₹6,000 प्रति वर्ष की आय सहायता।",
    },
    ur: {
      name: "پردھان منتری کسان سمان ندھی (PM-KISAN)",
      description:
        "تمام زمیندار کسان خاندانوں کو DBT کے ذریعے ₹2,000 کی تین قسطوں میں سالانہ ₹6,000 کی مالی امداد۔",
    },
  },
  "pm-jay": {
    en: {
      name: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
      description:
        "100% cashless health cover of ₹5,00,000 per family per year for vulnerable families and all senior citizens aged 70 and above.",
    },
    te: {
      name: "ఆయుష్మాన్ భారత్ - ప్రధాన్ మంత్రి జన్ ఆరోగ్య యోజన (AB-PMJAY)",
      description:
        "అర్హులైన కుటుంబాలకు మరియు 70 ఏళ్లు పైబడిన సీనియర్ సిటిజన్లందరికీ ఏడాదికి ₹5,00,000 వరకు 100% నగదు రహిత ఆసుపత్రి వైద్యం.",
    },
    hi: {
      name: "आयुष्मान भारत - प्रधानमंत्री जन आरोग्य योजना (AB-PMJAY)",
      description:
        "पात्र परिवारों और 70+ आयु के सभी वरिष्ठ नागरिकों के लिए प्रति परिवार प्रति वर्ष ₹5,00,000 का 100% कैशलेस स्वास्थ्य कवर।",
    },
    ur: {
      name: "آیوشمان بھارت - پردھان منتری جن آروگیہ یوجنا (AB-PMJAY)",
      description:
        "مستحق خاندانوں اور 70 سال سے زائد عمر کے تمام بزرگ شہریوں کے لیے سالانہ ₹5,00,000 تک کا 100% کیش لیس علاج۔",
    },
  },
  "pmay-g": {
    en: {
      name: "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
      description:
        "Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly areas for construction of a pucca house for rural houseless/kutcha households.",
    },
    te: {
      name: "ప్రధాన్ మంత్రి ఆవాస్ యోజన - గ్రామీణ (PMAY-G)",
      description:
        "గ్రామీణ ప్రాంతాల్లో కచ్చా ఇళ్లలో నివసించే లేదా ఇల్లు లేని కుటుంబాలకు పక్కా ఇంటి నిర్మాణం కోసం ₹1,20,000 నుండి ₹1,30,000 ఆర్థిక సహాయం.",
    },
    hi: {
      name: "प्रधानमंत्री आवास योजना - ग्रामीण (PMAY-G)",
      description:
        "ग्रामीण बेघर और कच्चे घरों में रहने वाले परिवारों को पक्का मकान बनाने के लिए ₹1,20,000 (मैदानी) और ₹1,30,000 (पहाड़ी) की सहायता।",
    },
    ur: {
      name: "پردھان منتری آواس یوجنا - گرامین (PMAY-G)",
      description:
        "دیہی بے گھر اور کچے مکانوں میں رہنے والے خاندانوں کو پکا مکان بنانے کے لیے ₹1,20,000 تا ₹1,30,000 کی مالی امداد۔",
    },
  },
  "nsp-post-matric": {
    en: {
      name: "Post-Matric Scholarship for SC Students",
      description:
        "Tuition fee reimbursement and maintenance allowance for SC students in post-matric courses with parental annual income up to ₹2,50,000.",
    },
    te: {
      name: "SC విద్యార్థులకు పోస్ట్-మెట్రిక్ స్కాలర్షిప్ (NSP)",
      description:
        "తల్లిదండ్రుల వార్షిక ఆదాయం ₹2,50,000 లోపు ఉన్న పోస్ట్-మెట్రిక్ SC విద్యార్థులకు ట్యూషన్ ఫీజు రీయింబర్స్మెంట్ మరియు మెయింటెనెన్స్ అలవెన్స్.",
    },
    hi: {
      name: "अनुसूचित जाति (SC) के छात्रों के लिए पोस्ट-मैट्रिक छात्रवृत्ति (NSP)",
      description:
        "₹2,50,000 तक की पारिवारिक वार्षिक आय वाले SC छात्रों के लिए ट्यूशन शुल्क प्रतिपूर्ति और शैक्षणिक भत्ता।",
    },
    ur: {
      name: "ایس سی (SC) طلباء کے لیے پوسٹ میٹرک اسکالرشپ (NSP)",
      description:
        "₹2,50,000 تک کی سالانہ خاندانی آمدنی والے SC طلباء کے لیے ٹیوشن فیس اور تعلیمی الاؤنس۔",
    },
  },
  "rythu-bharosa": {
    en: {
      name: "Rythu Bharosa (Telangana Agriculture Investment Support)",
      description:
        "Telangana state agricultural input support of ₹12,000 per acre annually (₹6,000 per season) for farmers holding digital Pattadar Passbooks.",
    },
    te: {
      name: "రైతు భరోసా (తెలంగాణ వ్యవసాయ పెట్టుబడి సహాయం)",
      description:
        "డిజిటల్ పట్టాదారు పాస్బుక్ ఉన్న తెలంగాణ రైతులకు ఎకరానికి ఏడాదికి ₹12,000 (సీజన్కు ₹6,000) పంట పెట్టుబడి సహాయం.",
    },
    hi: {
      name: "रायथू भरोसा (तेलंगाना कृषि निवेश सहायता)",
      description:
        "डिजिटल पट्टादार पासबुक धारक तेलंगाना के किसानों को ₹12,000 प्रति एकड़ वार्षिक (₹6,000 प्रति सीजन) कृषि निवेश सहायता।",
    },
    ur: {
      name: "رعیتو بھروسہ (تلنگانہ زرعی سرمایہ کاری امداد)",
      description:
        "ڈیجیٹل پٹہ دار پاس بک رکھنے والے تلنگانہ کے کسانوں کو سالانہ ₹12,000 فی ایکڑ (₹6,000 فی سیزن) زرعی امداد۔",
    },
  },
};

let currentLang: LanguageCode = "en";
const listeners = new Set<() => void>();

function syncDocumentDirection(lang: LanguageCode) {
  if (typeof document === "undefined") return;
  const isRtl = lang === "ur";
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
}

if (typeof window !== "undefined") {
  const saved = window.localStorage.getItem("policypilot_lang") as LanguageCode | null;
  if (saved && ["en", "te", "hi", "ur"].includes(saved)) {
    currentLang = saved;
    syncDocumentDirection(saved);
  }
}

export function setAppLanguage(nextLang: LanguageCode): void {
  currentLang = nextLang;
  if (typeof window !== "undefined") {
    window.localStorage.setItem("policypilot_lang", nextLang);
    syncDocumentDirection(nextLang);
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LanguageCode {
  return currentLang;
}

function getServerSnapshot(): LanguageCode {
  return "en";
}

/** Converts raw code key to clean user-friendly text as final safety fallback */
function humanizeMissingKey(key: string): string {
  const lastPart = key.split(/[._]/).pop() || key;
  return lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function useLanguage() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const langMeta =
    LANGUAGE_OPTIONS.find((o) => o.code === lang) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    syncDocumentDirection(lang);
  }, [lang]);

  const t = (key: string, fallback?: string): string => {
    if (!key) return fallback || "";

    // 1. Direct lookup
    let entry = UI_STRINGS[key];

    // 2. Dotted or underscored variant
    if (!entry && key.includes(".")) {
      entry = UI_STRINGS[key.replace(/\./g, "_")];
    }
    if (!entry && key.includes("_")) {
      entry = UI_STRINGS[key.replace(/_/g, ".")];
    }

    if (entry) {
      return entry[lang] || entry.en || fallback || humanizeMissingKey(key);
    }

    // CRITICAL: Never return raw internal code keys (e.g. "home.heroTitle1")
    return fallback || humanizeMissingKey(key);
  };

  const localizeScheme = (scheme: Scheme): { displayName: string; officialName: string; displayDescription: string } => {
    const slug = scheme.slug;
    const mapped = LOCALIZED_SCHEME_MAP[slug]?.[lang];
    return {
      displayName: mapped?.name || scheme.name,
      officialName: scheme.name,
      displayDescription: mapped?.description || scheme.description,
    };
  };

  return {
    lang,
    dir: langMeta.dir,
    isRtl: langMeta.dir === "rtl",
    setLang: setAppLanguage,
    speechLang: langMeta.speechLang,
    t,
    localizeScheme,
  };
}

// ---------------------------------------------------------------------------
// Backwards-Compatible Helpers for Existing Pages & Layout
// ---------------------------------------------------------------------------
export const SUPPORTED_LANGUAGES = LANGUAGE_OPTIONS.map((l) => ({
  code: l.code,
  label: l.englishLabel,
  nativeName: l.nativeLabel,
  speechCode: l.speechLang,
}));

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useI18n() {
  const { lang, setLang, speechLang, t } = useLanguage();
  return {
    language: lang,
    setLanguage: setLang,
    speechCode: speechLang,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
  };
}
