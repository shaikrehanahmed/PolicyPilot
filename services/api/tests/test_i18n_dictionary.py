"""Automated test suite verifying 100% i18n dictionary coverage,

zero missing keys, full 4-language completeness (en, te, hi, ur),
and no mandatory paid API dependencies for voice features.
"""
from __future__ import annotations

import re
from pathlib import Path


def test_i18n_coverage_and_4_language_completeness():
    repo_root = Path(__file__).resolve().parents[3]
    web_src = repo_root / "apps" / "web" / "src"
    i18n_path = web_src / "lib" / "i18n-context.tsx"

    assert i18n_path.exists(), f"i18n context file not found at {i18n_path}"
    content = i18n_path.read_text(encoding="utf-8")

    # 1. Verify all 4 supported languages configured with speech codes and RTL
    assert 'code: "en"' in content and 'speechLang: "en-IN"' in content
    assert 'code: "te"' in content and 'speechLang: "te-IN"' in content
    assert 'code: "hi"' in content and 'speechLang: "hi-IN"' in content
    assert 'code: "ur"' in content and 'speechLang: "ur-IN"' in content and 'dir: "rtl"' in content

    # 2. Extract UI_STRINGS
    start_anchor = "export const UI_STRINGS: Record<string, Record<LanguageCode, string>> = {"
    end_anchor = "export const LOCALIZED_SCHEME_MAP"
    assert start_anchor in content
    assert end_anchor in content

    start_idx = content.index(start_anchor) + len(start_anchor)
    end_idx = content.index(end_anchor)
    ui_block = content[start_idx:end_idx]

    entry_pattern = re.compile(r'^\s*["\']([^"\']+)["\']:\s*\{([^}]+)\}', re.MULTILINE)
    dictionary = {}
    for match in entry_pattern.finditer(ui_block):
        key = match.group(1)
        body = match.group(2)
        lang_vals = {}
        for lang in ("en", "te", "hi", "ur"):
            lm = re.search(rf'["\']{lang}["\']:\s*["\']([^"\']*)["\']', body)
            if lm:
                lang_vals[lang] = lm.group(1).strip()
        dictionary[key] = lang_vals

    assert len(dictionary) >= 200, f"Expected at least 200 keys, found {len(dictionary)}"

    # 3. Check every key has non-empty entries for all 4 languages
    for key, lang_map in dictionary.items():
        for lang in ("en", "te", "hi", "ur"):
            assert lang in lang_map, f"Key '{key}' is missing '{lang}' translation"
            assert lang_map[lang], f"Key '{key}' has empty translation for '{lang}'"

    # 4. Check all t("...") calls across the web app
    t_pattern = re.compile(r'\bt\(\s*["\']([^"\']+)["\']')
    used_keys = {}
    for p in web_src.rglob("*.tsx"):
        lines = p.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines, 1):
            for m in t_pattern.finditer(line):
                k = m.group(1)
                if k not in used_keys:
                    used_keys[k] = []
                used_keys[k].append(f"{p.name}:{idx}")

    for p in web_src.rglob("*.ts"):
        if "i18n-context" in p.name:
            continue
        lines = p.read_text(encoding="utf-8").splitlines()
        for idx, line in enumerate(lines, 1):
            for m in t_pattern.finditer(line):
                k = m.group(1)
                if k not in used_keys:
                    used_keys[k] = []
                used_keys[k].append(f"{p.name}:{idx}")

    assert len(used_keys) >= 50, f"Expected at least 50 used keys, found {len(used_keys)}"

    unresolved = []
    for k in used_keys:
        is_direct = k in dictionary
        is_dotted = k.replace("_", ".") in dictionary
        is_underscored = k.replace(".", "_") in dictionary
        if not (is_direct or is_dotted or is_underscored):
            unresolved.append(f"{k} (at {used_keys[k][0]})")

    assert not unresolved, f"Found {len(unresolved)} unresolved keys in UI: {unresolved}"


def test_voice_features_free_native_without_mandatory_paid_keys():
    """Confirms voice assistant runs natively via Web Speech API without paid services."""
    repo_root = Path(__file__).resolve().parents[3]
    voice_bar_path = repo_root / "apps" / "web" / "src" / "components" / "voice-accessibility-bar.tsx"
    assert voice_bar_path.exists()
    content = voice_bar_path.read_text(encoding="utf-8")

    # Native speech synthesis & recognition used
    assert "SpeechRecognition" in content
    assert "window.speechSynthesis" in content
    # Free OS voices checked
    assert "window.speechSynthesis.getVoices()" in content
    # No mandatory ElevenLabs audio synthesis dependency imported or required in voice bar
    assert "synthesizeSpeechAudio" not in content
    # Sentence boundary chunker implemented
    assert "chunkTextForSpeech" in content
