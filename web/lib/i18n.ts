export type Lang = "ta" | "en";

export const LANG_STORAGE_KEY = "jothidam-lang";

// All UI strings. Key = stable identifier, value = { ta, en }
const STRINGS = {
  // ── Tabs
  tab_personal:   { ta: "தனிப்பட்ட",   en: "Personal" },
  tab_family:     { ta: "குடும்பம்",    en: "Family" },
  tab_calendar:   { ta: "நாட்காட்டி",   en: "Calendar" },
  tab_setup:      { ta: "அமைவு",        en: "Setup" },
  tab_settings:   { ta: "அமைவுகள்",     en: "Settings" },

  // ── Header / status
  chart_ready:    { ta: "கட்டம் தயார்", en: "Chart ready" },
  today_score:    { ta: "இன்று",        en: "Today" },
  chandrashtamam_active: { ta: "சந்திராஷ்டமம் நடப்பு", en: "Chandrashtamam active" },
  status_restored:       { ta: "அமர்வு மீட்டெடுக்கப்பட்டது", en: "Session restored" },
  status_fresh:          { ta: "புதிய தொடக்கம்",            en: "Started fresh" },
  status_personal_ok:    { ta: "தனிப்பட்ட தரவு புதுப்பிக்கப்பட்டது", en: "Personal data refreshed" },
  status_family_ok:      { ta: "குடும்ப தரவு புதுப்பிக்கப்பட்டது",   en: "Family data refreshed" },

  // ── Metric strip
  metric_today:      { ta: "இன்றைய தேதி",      en: "Today's date" },
  metric_nakshatra:  { ta: "ஜன்ம நட்சத்திரம்", en: "Birth star" },
  metric_pada:       { ta: "பாதம்",             en: "Pada" },
  metric_janma_rasi: { ta: "ஜன்ம ராசி",         en: "Birth sign" },
  metric_dasha:      { ta: "நடப்பு தசா",        en: "Current dasa" },
  metric_bhukti:     { ta: "புக்தி",            en: "Bhukti" },
  metric_family_score: { ta: "குடும்ப மதிப்பெண்", en: "Family score" },
  metric_members:    { ta: "உறுப்பினர்கள்",    en: "members" },
  metric_vault_select: { ta: "vault தேர்வு செய்",  en: "select a vault" },

  // ── Setup wizard
  setup_kicker:       { ta: "அமைவு",              en: "Setup" },
  setup_step1_label:  { ta: "உங்கள் ஜாதகம்",     en: "Your chart" },
  setup_step2_label:  { ta: "குடும்ப Vault",      en: "Family vault" },
  setup_step3_label:  { ta: "உறுப்பினர் சேர்",   en: "Add member" },
  setup_step_done:    { ta: "✓ உருவாக்கப்பட்டது", en: "✓ Created" },
  setup_step1_title:  { ta: "உங்கள் ஜாதக விவரங்கள்", en: "Your birth details" },
  setup_step1_sub:    { ta: "பெயர், பிறந்த தேதி, நேரம், இடம் — இவை கட்டாயம்.", en: "Name, date, time and place — required fields." },
  setup_step1_create: { ta: "ஜாதகம் உருவாக்கு",  en: "Create chart" },
  setup_step1_edit:   { ta: "✎ திருத்து",         en: "✎ Edit" },
  setup_step1_creating: { ta: "உருவாக்குகிறது…",  en: "Creating…" },
  setup_step1_goto_personal: { ta: "Personal பக்கம் →", en: "Go to Personal →" },
  setup_step2_title:  { ta: "குடும்ப Vault உருவாக்கு", en: "Create a family vault" },
  setup_step2_sub:    { ta: "குடும்பத்தினர் ஜாதகங்களை ஒரே இடத்தில் தொகுக்க vault தேவை.", en: "A vault groups all family members' charts in one place." },
  setup_step2_create: { ta: "Vault உருவாக்கு",   en: "Create vault" },
  setup_step2_more:   { ta: "+ மேலும் ஒரு Vault", en: "+ Another vault" },
  setup_step2_creating: { ta: "உருவாக்குகிறது…", en: "Creating…" },
  setup_step2_selected: { ta: "✓ தேர்ந்தெடுக்கப்பட்டது", en: "✓ Selected" },
  setup_step3_title:  { ta: "குடும்ப உறுப்பினரை சேர்", en: "Add a family member" },
  setup_step3_sub_vault: { ta: "Vault தேர்வு செய்த பின் உறுப்பினரை சேர்க்கலாம்", en: "Pick a vault first, then add members" },
  setup_step3_add:    { ta: "+ உறுப்பினரை சேர்", en: "+ Add member" },
  setup_step3_adding: { ta: "சேர்க்கிறது…",      en: "Adding…" },
  setup_done_title:   { ta: "✓ அமைவு முடிந்தது!", en: "✓ Setup complete!" },
  setup_done_goto:    { ta: "Personal பக்கம் →",  en: "Go to Personal →" },
  setup_required:     { ta: "* கட்டாய தகவல்கள்",  en: "* Required fields" },
  setup_calc_now:     { ta: "ஜாதகம் உடனே கணக்கிடு", en: "Calculate now" },
  setup_vault_step_active: { ta: "✓ Vault உள்ளது", en: "✓ Vault exists" },

  // ── Form field labels
  field_name:         { ta: "பெயர் *",           en: "Name *" },
  field_relationship: { ta: "உறவு முறை",         en: "Relationship" },
  field_birth_date:   { ta: "பிறந்த தேதி *",     en: "Birth date *" },
  field_birth_time:   { ta: "பிறந்த நேரம்",      en: "Birth time" },
  field_birth_place:  { ta: "பிறந்த இடம் *",     en: "Birth place *" },
  field_timezone:     { ta: "நேர மண்டலம் *",     en: "Timezone *" },
  field_latitude:     { ta: "அட்சரேகை (Lat) *",  en: "Latitude *" },
  field_longitude:    { ta: "தீர்க்கரேகை (Lng) *", en: "Longitude *" },
  field_weight:       { ta: "எடை (Weight)",       en: "Weight" },
  field_vault_name:   { ta: "Vault பெயர்",        en: "Vault name" },
  field_language:     { ta: "மொழி",               en: "Language" },
  field_owner_id:     { ta: "Owner ID",           en: "Owner ID" },
  field_time_optional: { ta: "தெரியாவிட்டால் விட்டுவிடலாம்", en: "Leave blank if unknown" },
  field_place_helper: { ta: "நகரத்தை தேர்ந்தெடுக்க lat/lng தானாக அமையும்", en: "Select a city to auto-fill lat/lng" },
  field_tz_helper:    { ta: "நகரம் தேர்ந்தெடுத்தால் தானாக அமையும்", en: "Auto-filled when city is selected" },
  field_weight_helper:{ ta: "உறவு முறையால் தானாக அமையும்", en: "Auto-set by relationship" },

  // ── Relationship options
  rel_self:        { ta: "தான் (Self)",       en: "Self" },
  rel_spouse:      { ta: "துணைவர் (Spouse)",  en: "Spouse" },
  rel_child:       { ta: "குழந்தை (Child)",   en: "Child" },
  rel_parent:      { ta: "பெற்றோர் (Parent)", en: "Parent" },
  rel_sibling:     { ta: "உடன்பிறந்தவர்",    en: "Sibling" },
  rel_grandparent: { ta: "தாத்தா/பாட்டி",    en: "Grandparent" },
  rel_other:       { ta: "மற்றவர் (Other)",   en: "Other" },

  // ── Language select options
  lang_ta_en: { ta: "தமிழ் + English",  en: "Tamil + English" },
  lang_ta:    { ta: "தமிழ் மட்டும்",    en: "Tamil only" },
  lang_en:    { ta: "English only",     en: "English only" },

  // ── Buttons
  btn_refresh:        { ta: "புதுப்பி",         en: "Refresh" },
  btn_refreshing:     { ta: "புதுப்பிக்கிறது…", en: "Refreshing…" },
  btn_edit:           { ta: "✎ திருத்து",        en: "✎ Edit" },
  btn_remove:         { ta: "நீக்கு",            en: "Remove" },
  btn_removing:       { ta: "நீக்குகிறது…",      en: "Removing…" },
  btn_delete:         { ta: "நீக்கு",            en: "Delete" },
  btn_cancel:         { ta: "ரத்து",             en: "Cancel" },
  btn_save:           { ta: "சேமி & மீண்டும் கணக்கிடு", en: "Save & recalculate" },
  btn_saving:         { ta: "சேமிக்கிறது…",      en: "Saving…" },
  btn_add_member:     { ta: "+ உறுப்பினர் சேர்", en: "+ Add member" },
  btn_refresh_personal: { ta: "தனிப்பட்ட புதுப்பி", en: "Refresh personal" },
  btn_refresh_family:   { ta: "குடும்ப புதுப்பி",   en: "Refresh family" },
  btn_add_first_member: { ta: "முதல் உறுப்பினரை சேர்", en: "Add first member" },
  btn_go_personal:    { ta: "Personal →",       en: "Personal →" },

  // ── Personal tab
  personal_kicker:    { ta: "தனிப்பட்ட",        en: "Personal" },
  personal_title_default: { ta: "கட்டம், வழிகாட்டல் & கோசாரம்", en: "Chart, guidance & transits" },
  personal_desc:      { ta: "தசா, பஞ்சாங்கம், கோசார தரவு", en: "Dasa, Panchangam, Gochar data" },
  personal_today:     { ta: "இன்று",            en: "Today" },
  personal_you:       { ta: "நீங்கள்",           en: "You" },
  chandrashtama_warning: { ta: "⚠ சந்திராஷ்டமம் — Chandran ஜன்ம ராசியிலிருந்து 8ஆம் இடம். முக்கிய முடிவுகளை தவிர்க்கவும்.", en: "⚠ Chandrashtamam — Moon is in the 8th from birth sign. Avoid important decisions." },

  // ── Chart context surface
  surface_chart_context: { ta: "ஜாதக சுருக்கம்", en: "Chart context" },
  chart_loading:    { ta: "Jaadhagam ஏற்றுகிறது…", en: "Loading chart…" },
  chart_no_profile: { ta: "Profile உருவாக்கிய பின் ஜாதகம் தெரியும்.", en: "Create a birth profile to load chart data." },
  label_lagnam:     { ta: "Lagnam",   en: "Lagna" },
  label_birth_date: { ta: "பிறந்த தேதி", en: "Birth date" },
  label_nakshatra:  { ta: "நட்சத்திரம்", en: "Nakshatra" },
  label_padam:      { ta: "பாதம்",       en: "Pada" },
  label_janma_rasi: { ta: "ஜன்ம ராசி",  en: "Birth sign" },
  label_d1:         { ta: "D1 — ஜன்ம ராசி கட்டம்", en: "D1 — Birth chart" },
  label_d9:         { ta: "D9 — நவாம்சம்",          en: "D9 — Navamsa" },
  navamsa_label:    { ta: "நவாம்சம்",   en: "Navamsa" },

  // ── Daily guidance surface
  surface_guidance: { ta: "இன்றைய யோகம்", en: "Today's fortune" },
  guidance_empty:   { ta: "Profile கணக்கிட்ட பின் வழிகாட்டல் தெரியும்.", en: "Daily guidance loads after a profile is calculated." },
  label_best_time:  { ta: "சிறந்த நேரம்",     en: "Best window" },
  label_caution_time: { ta: "எச்சரிக்கை நேரம்", en: "Caution window" },
  label_moon_transit: { ta: "Chandran கோசாரம்", en: "Moon transit" },
  label_dasha_support: { ta: "தசா ஆதரவு",      en: "Dasa support" },
  label_next_3_days:   { ta: "அடுத்த 3 நாட்கள்", en: "Next 3 days" },

  // ── Gochar & Panchangam surface
  surface_gochar:   { ta: "கோசாரம் & பஞ்சாங்கம்", en: "Transits & Panchangam" },
  gochar_empty:     { ta: "Jaadhagam உருவாக்கிய பின் கோசாரம் தெரியும்.", en: "Create a chart to see transits and panchangam." },
  label_chandrashtamam: { ta: "சந்திராஷ்டமம்", en: "Chandrashtamam" },
  label_active:     { ta: "நடப்பு",  en: "Active" },
  label_none:       { ta: "இல்லை",  en: "None" },
  label_sani_cycle: { ta: "சனி சுழற்சி", en: "Saturn cycle" },
  label_gochar_pos: { ta: "கோசார நிலை", en: "Transit positions" },
  label_janma_rasi_short: { ta: "ஜன்ம ராசி", en: "Janma Rasi" },
  label_panchangam: { ta: "பஞ்சாங்கம்", en: "Panchangam" },
  label_tithi:      { ta: "திதி",         en: "Tithi" },
  label_rahu_kalam: { ta: "ரா.காலம்",    en: "Rahu Kalam" },
  label_yamagandam: { ta: "யேமகண்டம்",   en: "Yamagandam" },
  label_kuligai:    { ta: "குளிகை",       en: "Kuligai" },
  label_abhijit:    { ta: "அபிஜித்",      en: "Abhijit" },

  // ── Graha table
  surface_planets:  { ta: "கிரக நிலை அட்டவணை — விரிவான விவரம்", en: "Planet positions — detailed" },
  planets_empty:    { ta: "Jaadhagam உருவாக்கிய பின் கிரக நிலை தெரியும்.", en: "Create a chart to see planet positions." },
  col_graha:        { ta: "கிரகம்",    en: "Planet" },
  col_rasi:         { ta: "ராசி",      en: "Sign" },
  col_degree:       { ta: "பாகை",      en: "Degree" },
  col_nakshatra:    { ta: "நட்சத்திரம்", en: "Nakshatra" },
  col_pada:         { ta: "பாதம்",     en: "Pada" },
  col_house:        { ta: "இடம் (L)",  en: "House (L)" },
  col_d9_rasi:      { ta: "D9 ராசி",   en: "D9 Sign" },
  col_special:      { ta: "சிறப்பு",   en: "Special" },
  flag_vakra:       { ta: "வக்ரம்",    en: "Retrograde" },
  flag_astam:       { ta: "அஸ்தம்",   en: "Combust" },
  flag_vargottamam: { ta: "வர்கோத்தமம்", en: "Vargottama" },

  // ── Dasha surface
  surface_dasha:    { ta: "தசா · புக்தி · அந்தரம்", en: "Dasa · Bhukti · Antaram" },
  dasha_current_strip: { ta: "நடப்பு தசா · புக்தி · அந்தரம்", en: "Current Dasa · Bhukti · Antaram" },
  dasha_all_bhukti: { ta: "அனைத்து புக்திகள்", en: "All Bhukti periods" },
  dasha_timeline_label: { ta: "விம்சோத்தரி தசா காலவரிசை — அனைத்து தசைகள்", en: "Vimshottari Dasa timeline — all periods" },
  dasha_word:       { ta: "தசா",    en: "Dasa" },
  bhukti_word:      { ta: "புக்தி", en: "Bhukti" },
  antaram_word:     { ta: "அந்தரம்", en: "Antaram" },
  status_active:    { ta: "▶ நடப்பு",  en: "▶ Active" },
  status_past:      { ta: "முடிந்தது", en: "Ended" },
  status_upcoming:  { ta: "வரும்",    en: "Upcoming" },
  balance_at_birth: { ta: "பிறப்பில் இருப்பு", en: "balance at birth" },
  opening_dasha:    { ta: "ஆரம்ப தசா",         en: "Opening dasa" },

  // ── Family tab
  family_kicker:    { ta: "குடும்பம்",   en: "Family" },
  family_title:     { ta: "குடும்ப Vault", en: "Family vault" },
  family_desc:      { ta: "குடும்ப மதிப்பெண், உறுப்பினர் ராசி கட்டங்கள், பொதுவான சிறந்த நேரங்கள்", en: "Family score, member charts, shared best windows" },
  surface_vaults:   { ta: "உங்கள் Vaults",  en: "Your vaults" },
  vaults_loading:   { ta: "Vaults ஏற்றுகிறது…", en: "Loading vaults…" },
  vaults_empty:     { ta: "Vault இல்லை. Setup-ல் உருவாக்கவும்.", en: "No vaults found. Create one in Setup." },
  members_label:    { ta: "உறுப்பினர்",  en: "member" },
  members_label_pl: { ta: "உறுப்பினர்கள்", en: "members" },
  no_aggregate:     { ta: "சுருக்கம் இல்லை", en: "no aggregate yet" },
  surface_family_score: { ta: "குடும்ப மதிப்பெண்", en: "Family score" },
  family_score_label: { ta: "குடும்ப மதிப்பெண்", en: "Family score" },
  support_need:     { ta: "துணை தேவை",       en: "Support need" },
  decision_ready:   { ta: "முடிவு தயார்நிலை", en: "Decision readiness" },
  best_windows:     { ta: "பொதுவான சிறந்த நேரங்கள்", en: "Shared best windows" },
  no_members_yet:   { ta: "Vault-ல் உறுப்பினர் இல்லை.", en: "No members in this vault yet." },
  select_vault:     { ta: "Vault தேர்வு செய்யவும்.",   en: "Select a vault to see members." },
  members_loading:  { ta: "உறுப்பினர்கள் ஏற்றுகிறது…", en: "Loading members…" },
  charts_loading:   { ta: "· கட்டங்கள் ஏற்றுகிறது…",  en: "· loading charts…" },
  dasha_bhukti_antaram: { ta: "தசா · புக்தி · அந்தரம்", en: "Dasa · Bhukti · Antaram" },
  best_time:        { ta: "சிறந்த நேரம்",    en: "Best time" },
  caution_time:     { ta: "எச்சரிக்கை",     en: "Caution" },
  identity_lagnam:  { ta: "Lagnam",          en: "Lagna" },
  identity_janma:   { ta: "ஜன்ம ராசி",      en: "Birth sign" },

  // ── Member card
  member_chandrashtamam: { ta: "⚠ சந்திராஷ்டமம்", en: "⚠ Chandrashtamam" },

  // ── Edit modals
  edit_member_title:   { ta: "உறுப்பினர் திருத்து",          en: "Edit member" },
  edit_member_sub:     { ta: "பிறப்பு விவரங்களை மாற்றினால் ஜாதகம் மீண்டும் கணக்கிடப்படும்", en: "Changing birth details will recalculate the chart" },
  edit_profile_title:  { ta: "உங்கள் ஜாதக விவரங்கள் திருத்து", en: "Edit your birth profile" },
  edit_profile_sub:    { ta: "புதிய பிரொஃபைல் உருவாகும் — தரவு மீண்டும் கணக்கிடப்படும்", en: "A new profile will be created and data recalculated" },

  // ── Delete confirm
  confirm_remove_member: { ta: "இந்த உறுப்பினரை நீக்கவா?", en: "Remove this member from the vault?" },
  confirm_delete_vault:  { ta: "Vault மற்றும் அனைத்து உறுப்பினர்களையும் நீக்கவா? இதை மீட்க முடியாது.", en: "Delete vault and all members? This cannot be undone." },

  // ── Calendar tab
  calendar_kicker:  { ta: "நாட்காட்டி",     en: "Calendar" },
  calendar_title:   { ta: "தமிழ் நாட்காட்டி", en: "Tamil calendar" },
  cal_panchangam:   { ta: "📅 பஞ்சாங்கம்",  en: "📅 Panchangam" },
  cal_personal:     { ta: "◎ தனிப்பட்ட",   en: "◎ Personal" },
  cal_family:       { ta: "⊕ குடும்பம்",    en: "⊕ Family" },
  surface_panja:    { ta: "பஞ்சாங்கம் — ஐந்து அங்கங்கள்", en: "Panchangam — Five limbs" },
  surface_kala:     { ta: "தடை நேரங்கள் (Kala Vibhagam)", en: "Inauspicious periods" },
  surface_hora:     { ta: "ஹோரை நேரங்கள்", en: "Hora table" },
  panja_empty:      { ta: "Profile உருவாக்கிய பின் பஞ்சாங்கம் தெரியும்.", en: "Create a profile to see panchangam." },
  kala_empty:       { ta: "Profile உருவாக்கிய பின் நேர விபரங்கள் தெரியும்.", en: "Create a profile to see timings." },
  label_vaaram:     { ta: "வாரம்",    en: "Vara (weekday)" },
  label_tithi2:     { ta: "திதி",     en: "Tithi" },
  label_nakshatra2: { ta: "நட்சத்திரம்", en: "Nakshatra" },
  label_yogam:      { ta: "யோகம்",   en: "Yoga" },
  label_karanam:    { ta: "கரணம்",   en: "Karana" },
  label_sunrise:    { ta: "சூரிய உதயம்",      en: "Sunrise" },
  label_sunset:     { ta: "சூரிய அஸ்தமனம்",  en: "Sunset" },
  label_rahu_avoid: { ta: "தவிர்க்கவும்",     en: "Avoid" },
  label_restricted: { ta: "(இந்த வாரம் தடை)", en: "(restricted today)" },
  hora_word:        { ta: "ஹோரை",    en: "Hora" },
  paksha_shukla:    { ta: "வளர்பிறை", en: "Shukla" },
  paksha_krishna:   { ta: "தேய்பிறை", en: "Krishna" },
  lord_word:        { ta: "lord",     en: "lord" },
  until_word:       { ta: "வரை",     en: "until" },
  slot_word:        { ta: "இடை",     en: "slot" },

  // ── Calendar personal view
  cal_score_label:  { ta: "மதிப்பெண் விவரம்",   en: "Score breakdown" },
  cal_action:       { ta: "செயல் பரிந்துரை",    en: "Action suggestion" },
  cal_caution_sugg: { ta: "எச்சரிக்கை",         en: "Caution" },
  cal_sani:         { ta: "சனி சுழற்சி",        en: "Saturn cycle" },
  cal_sani_pos:     { ta: "சனி நிலை",           en: "Saturn position" },
  cal_sani_rasi:    { ta: "சனி ராசி",           en: "Saturn sign" },
  cal_3days:        { ta: "அடுத்த 3 நாட்கள் — யோக அளவீடு", en: "Next 3 days — fortune score" },
  cal_no_profile:   { ta: "Personal fortune பார்க்க முதலில் birth profile உருவாக்கவும்.", en: "Create a birth profile to view personal fortune." },
  cal_no_vault:     { ta: "குடும்ப fortune பார்க்க முதலில் family vault உருவாக்கவும்.",   en: "Create a family vault to view family fortune." },
  cal_loading:      { ta: "குடும்ப தரவு ஏற்றுகிறது…", en: "Loading family data…" },
  cal_fam_title:    { ta: "குடும்பம்",      en: "Family" },
  cal_breakdown:    { ta: "குடும்ப மதிப்பெண் விவரம்",  en: "Family score breakdown" },
  cal_mean_score:   { ta: "சராசரி மதிப்பெண்",          en: "Mean score" },
  cal_member_scores: { ta: "உறுப்பினர் மதிப்பெண்கள்",  en: "Member scores" },
  cal_7days:        { ta: "7 நாட்கள் — குடும்ப யோக காலெண்டர்", en: "7-day family fortune calendar" },
  cal_avoid_fam:    { ta: "தவிர் ",  en: "Avoid " },
  cal_best_fam:     { ta: "சிறந்த நேரம் ", en: "Best " },

  // ── Settings tab
  settings_kicker:  { ta: "அமைவுகள்",   en: "Settings" },
  settings_title:   { ta: "அமர்வு நிலை", en: "Session state" },
  settings_desc:    { ta: "இந்த மதிப்புகள் owner, தேதி மற்றும் vault-ஐ ஒரே நிலையில் வைக்கின்றன.", en: "These values anchor the session to one owner, one date, and one vault." },
  settings_owner:   { ta: "Owner user ID", en: "Owner user ID" },
  settings_owner_hint: { ta: "அனைத்து profile மற்றும் vault forms-லும் பகிரப்படுகிறது.", en: "Shared across all profile and vault forms." },
  settings_date:    { ta: "தேர்ந்தெடுத்த தேதி",  en: "Selected date" },
  settings_vault:   { ta: "தேர்ந்தெடுத்த Vault", en: "Selected vault" },
  settings_vault_hint: { ta: "Family tab-ல் vault-ஐ கிளிக் செய்து மாற்றவும்.", en: "Click a vault in the Family tab to switch." },
  settings_profile: { ta: "Birth profile ID", en: "Birth profile ID" },
  settings_chart:   { ta: "Chart ID",          en: "Chart ID" },
  settings_quick:   { ta: "விரைவு புதுப்பிப்பு", en: "Quick refresh" },

  // Modal titles
  modal_edit_member_title:  { ta: "உறுப்பினர் திருத்து",       en: "Edit member" },
  modal_edit_member_sub:    { ta: "பிறப்பு விவரங்களை மாற்றினால் ஜாதகம் மீண்டும் கணக்கிடப்படும்", en: "Changing birth details will recalculate the chart." },
  modal_edit_profile_title: { ta: "ஜாதக விவரங்கள் திருத்து",   en: "Edit birth profile" },
  modal_edit_profile_sub:   { ta: "புதிய பிரொஃபைல் உருவாகும் — தரவு மீண்டும் கணக்கிடப்படும்", en: "A new profile will be created and data recalculated." },

  // Extra form field labels used in edit modals
  field_display_name: { ta: "பெயர்",              en: "Name" },
  field_weight_hint:  { ta: "உறவு முறையால் தானாக அமையும்", en: "Auto-set by relationship" },

  // Save button
  btn_save_recalc:    { ta: "சேமி & மீண்டும் கணக்கிடு", en: "Save & recalculate" },

  // Validation errors
  err_name_required:    { ta: "பெயர் தேவை",          en: "Name is required" },
  err_date_required:    { ta: "பிறந்த தேதி தேவை",    en: "Birth date is required" },
  err_place_required:   { ta: "பிறந்த இடம் தேவை",    en: "Birth place is required" },
  err_tz_required:      { ta: "நேர மண்டலம் தேவை",    en: "Timezone is required" },
  err_lat_required:     { ta: "அட்சரேகை தேவை",       en: "Latitude is required" },
  err_lng_required:     { ta: "தீர்க்கரேகை தேவை",    en: "Longitude is required" },

  // Toast messages
  toast_profile_created: { ta: "ஜாதகம் உருவாக்கப்பட்டது.", en: "Profile created." },
  toast_vault_required:  { ta: "முதலில் family vault தேர்வு செய்யவும்.", en: "Please select a family vault first." },

  // Metric strip hint
  hint_no_profile:      { ta: "profile உருவாக்கவும்", en: "create a profile" },

  // Feedback
  feedback_btn:        { ta: "கருத்து",             en: "Feedback" },
  feedback_title:      { ta: "கருத்து அனுப்பு",      en: "Send feedback" },
  feedback_category:   { ta: "வகை",                 en: "Category" },
  feedback_bug:        { ta: "பிழை",                en: "Bug" },
  feedback_calc:       { ta: "கணக்கீடு",            en: "Calculation" },
  feedback_suggest:    { ta: "பரிந்துரை",            en: "Suggestion" },
  feedback_other:      { ta: "மற்றவை",              en: "Other" },
  feedback_rating:     { ta: "மதிப்பீடு (விருப்பம்)", en: "Rating (optional)" },
  feedback_message:    { ta: "உங்கள் கருத்து *",     en: "Your message *" },
  feedback_send:       { ta: "அனுப்பு",             en: "Send" },
  feedback_sending:    { ta: "அனுப்புகிறது…",        en: "Sending…" },
  feedback_thanks:     { ta: "நன்றி! உங்கள் கருத்து பெறப்பட்டது.", en: "Thank you! Your feedback was received." },
  feedback_cancel:     { ta: "ரத்து",               en: "Cancel" },

  // Privacy & disclaimer
  disclaimer_astro:    { ta: "இந்த பயன்பாடு ஜோதிடம் சார்ந்த வழிகாட்டுதல்களை வழங்குகிறது. இவை அறிவியல் உண்மைகள் அல்ல — நம்பிக்கை சார்ந்த பாரம்பரிய கலை. மருத்துவ, சட்டம், நிதி முடிவுகளுக்கு தகுதிவாய்ந்த நிபுணரை அணுகுங்கள்.", en: "This app provides Jyotish-based guidance. Astrology is a traditional belief system, not a science. For medical, legal, or financial decisions, consult a qualified professional." },
  disclaimer_data:     { ta: "உங்கள் தரவு இந்தச் சாதனத்திலும் சேவையகத்திலும் மட்டும் சேமிக்கப்படுகிறது. உங்கள் தரவை நீக்க Settings அல்லது ஆதரவை தொடர்புகொள்ளவும்.", en: "Your data is stored only on this device and our server. To delete your data, visit Settings or contact support." },
  disclaimer_no_doom:  { ta: "இந்தப் பயன்பாடு அச்சுறுத்தல், மோசமான சகுனம், அல்லது உறுதிப்படுத்தப்பட்ட தோல்வி பற்றி எந்த வார்த்தையும் பயன்படுத்துவதில்லை.", en: "This app never uses fear, doom language, or guaranteed negative predictions." },
  privacy_link:        { ta: "தனியுரிமை கொள்கை",   en: "Privacy policy" },
  terms_link:          { ta: "சேவை விதிமுறைகள்",   en: "Terms of service" },

  // QA Dashboard tab
  tab_qa:              { ta: "QA",                   en: "QA" },
  qa_kicker:           { ta: "உள் QA கருவி",         en: "Internal QA tool" },
  qa_title:            { ta: "Golden Test Suite",    en: "Golden Test Suite" },
  qa_desc:             { ta: "அனைத்து கணக்கீடு தொகுதிகளுக்கும் தங்கச் சோதனைகள் இயக்கவும்.", en: "Run golden tests across all calculation modules to verify accuracy." },
  qa_run:              { ta: "சோதனைகள் இயக்கு",     en: "Run tests" },
  qa_running:          { ta: "இயங்குகிறது…",          en: "Running…" },
  qa_passed:           { ta: "தேர்ச்சி",              en: "Passed" },
  qa_failed:           { ta: "தோல்வி",               en: "Failed" },
  qa_total:            { ta: "மொத்தம்",               en: "Total" },
  qa_module:           { ta: "தொகுதி",               en: "Module" },
  qa_test_id:          { ta: "சோதனை ID",             en: "Test ID" },
  qa_description:      { ta: "விவரம்",               en: "Description" },
  qa_expected:         { ta: "எதிர்பார்க்கப்பட்டது", en: "Expected" },
  qa_actual:           { ta: "கிடைத்தது",            en: "Actual" },
  qa_status:           { ta: "நிலை",                 en: "Status" },
  qa_all_pass:         { ta: "அனைத்தும் தேர்ச்சி!",  en: "All tests passing!" },
  qa_has_failures:     { ta: "சோதனைகள் தோல்வி",     en: "Test failures detected" },
  qa_never_run:        { ta: "இன்னும் இயக்கப்படவில்லை. 'சோதனைகள் இயக்கு' கிளிக் செய்யவும்.", en: "Not run yet. Click 'Run tests' to start." },
  qa_regressions:      { ta: "சேமிக்கப்பட்ட regression தோல்விகள்", en: "Stored regression failures" },
  qa_clear_all:        { ta: "அனைத்தும் அழி",        en: "Clear all" },
  qa_no_regressions:   { ta: "சேமிக்கப்பட்ட தோல்விகள் இல்லை.", en: "No stored failures." },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

export function tLang(obj: { ta: string; en: string }, lang: Lang): string {
  return obj[lang];
}
