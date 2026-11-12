# Release notes

User-facing notes, newest first. Each entry is ready to paste into an announcement, app-store
"What's new" text or a support reply. The app has no in-app release-notes screen yet; where a
note is shown is the owner's call.

Tamil text marked *draft* is Claude's and has not been native-reviewed.

---

## 2026-11-12: Readings for family members now follow their stated gender

Owner ruling 2026-11-12 (OWNER-Q-D4 reply, item 3): communicate the change, and present it as
an improvement to how readings are interpreted, not a correction to anyone's horoscope.
Background: `docs/GROUP_D_SPECS_2026-11-11.md` §0.6.

**English**

> **Readings now use each family member's stated gender.** Some traditional rules read a bride's
> chart and a groom's chart differently: the 8th house as mangalya sthana for a bride, the weight
> given to Guru and Sukran as spouse significators, and parts of the Sevvai dosham reading. Family
> members whose gender you have stated now get these gender-specific readings, so a reading may
> look different from before. Birth charts are not recalculated differently; only the
> interpretation has improved. If you have not stated a gender for someone, their readings stay as
> they were, and the report says which gender-specific readings were left out.

**Tamil** (*draft*)

> **குடும்ப உறுப்பினர்களின் பலன்கள் இப்போது அவர்களுக்குக் குறிப்பிட்ட பாலினத்தைப் பின்பற்றுகின்றன.**
> சில பாரம்பரிய விதிகள் மணப்பெண்ணின் ஜாதகத்தையும் மணமகனின் ஜாதகத்தையும் வேறுவிதமாகப் பார்க்கின்றன:
> மணப்பெண்ணுக்கு 8ஆம் இடம் மாங்கல்ய ஸ்தானமாக, வாழ்க்கைத் துணை காரகர்களாக குரு, சுக்கிரனுக்குத்
> தரப்படும் முக்கியத்துவம், செவ்வாய் தோஷ ஆய்வின் சில பகுதிகள். பாலினம் குறிப்பிட்ட குடும்ப
> உறுப்பினர்களுக்கு இனி இந்தப் பாலினம் சார்ந்த பலன்கள் கிடைக்கும்; அதனால் பலன் முன்பிருந்ததிலிருந்து
> சற்று வேறுபடலாம். ஜாதகக் கணிப்பு மாறவில்லை; பலன் விளக்கும் முறை மேம்படுத்தப்பட்டுள்ளது. பாலினம்
> குறிப்பிடப்படாதவர்களின் பலன்கள் முன்பு போலவே இருக்கும்; எந்தப் பாலினம் சார்ந்த பலன்கள்
> சேர்க்கப்படவில்லை என்பதையும் அறிக்கை சொல்லும்.

Before publishing, check:
- the Tamil has had a native review;
- whether to add "you can set it in the member's profile". The mobile member edit sends
  `genderForTraditionalRules` (`mobile/src/lib/familyMemberEdit.ts`); no web member editor that
  sets it was found on 2026-11-12, so the note does not promise one.
