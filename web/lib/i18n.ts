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
  metric_vault_select: { ta: "Vault தேர்வு செய்யவும்",  en: "select a vault" },

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
  setup_step1_goto_personal: { ta: "தனிப்பட்ட பக்கம் →", en: "Go to Personal →" },
  setup_step2_title:  { ta: "குடும்ப சேகரிப்பு உருவாக்கு", en: "Create a family vault" },
  setup_step2_sub:    { ta: "குடும்பத்தினர் ஜாதகங்களை ஒரே இடத்தில் தொகுக்க சேகரிப்பு தேவை.", en: "A vault groups all family members' charts in one place." },
  setup_step2_create: { ta: "சேகரிப்பு உருவாக்கு",   en: "Create vault" },
  setup_step2_more:   { ta: "+ மேலும் ஒரு சேகரிப்பு", en: "+ Another vault" },
  setup_step2_creating: { ta: "உருவாக்குகிறது…", en: "Creating…" },
  setup_step2_selected: { ta: "✓ தேர்ந்தெடுக்கப்பட்டது", en: "✓ Selected" },
  setup_step3_title:  { ta: "குடும்ப உறுப்பினரை சேர்க்கவும்", en: "Add a family member" },
  setup_step3_sub_vault: { ta: "சேகரிப்பை தேர்வு செய்த பின் உறுப்பினரை சேர்க்கலாம்", en: "Pick a vault first, then add members" },
  setup_step3_add:    { ta: "+ உறுப்பினரை சேர்", en: "+ Add member" },
  setup_step3_adding: { ta: "சேர்க்கிறது…",      en: "Adding…" },
  setup_done_title:   { ta: "✓ அமைவு முடிந்தது!", en: "✓ Setup complete!" },
  setup_done_goto:    { ta: "தனிப்பட்ட பக்கம் →",  en: "Go to Personal →" },
  setup_required:     { ta: "* கட்டாய தகவல்கள்",  en: "* Required fields" },
  setup_calc_now:     { ta: "ஜாதகம் உடனே கணக்கிடு", en: "Calculate now" },
  setup_vault_step_active: { ta: "✓ சேகரிப்பு உள்ளது", en: "✓ Vault exists" },

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
  btn_go_personal:    { ta: "தனிப்பட்டது →",     en: "Personal →" },

  // ── Personal tab
  personal_kicker:    { ta: "தனிப்பட்ட",        en: "Personal" },
  personal_title_default: { ta: "ஜாதகம், வழிகாட்டல் & கோசாரம்", en: "Chart, guidance & transits" },
  personal_desc:      { ta: "தசா, பஞ்சாங்கம், கோசார தரவு", en: "Dasa, Panchangam, Gochar data" },
  personal_today:     { ta: "இன்று",            en: "Today" },
  personal_you:       { ta: "நீங்கள்",           en: "You" },
  chandrashtama_warning: { ta: "⚠ சந்திராஷ்டமம் — Chandran ஜன்ம நட்சத்திரத்திலிருந்து 8ஆம் நட்சத்திரத்தில் உள்ளது. முக்கிய முடிவுகளை தவிர்க்கவும்.", en: "⚠ Chandrashtamam — Moon is in the 8th nakshatra from your birth star. Avoid important decisions." },

  // ── Chart context surface
  surface_chart_context: { ta: "ஜாதக சுருக்கம்", en: "Chart context" },
  chart_loading:    { ta: "ஜாதகம் ஏற்றுகிறது…", en: "Loading chart…" },
  chart_no_profile: { ta: "பிறப்பு விவரம் உருவாக்கிய பின் ஜாதகம் தெரியும்.", en: "Create a birth profile to load chart data." },
  label_lagnam:     { ta: "Lagnam",   en: "Lagna" },
  label_birth_date: { ta: "பிறந்த தேதி", en: "Birth date" },
  label_nakshatra:  { ta: "நட்சத்திரம்", en: "Nakshatra" },
  label_padam:      { ta: "பாதம்",       en: "Pada" },
  label_janma_rasi: { ta: "ஜன்ம ராசி",  en: "Birth sign" },
  label_d1:         { ta: "D1 — ஜன்ம ராசி கட்டம்", en: "D1 — Birth chart" },
  label_d9:         { ta: "D9 — நவாம்சம்",          en: "D9 — Navamsa" },
  navamsa_label:    { ta: "நவாம்சம்",   en: "Navamsa" },
  chart_tap_to_explain: { ta: "விளக்கத்திற்கு தட்டவும்", en: "Tap to explain" },
  chart_from_d1_lagna: { ta: "D1 லக்னத்திலிருந்து", en: "From D1 Lagna" },
  chart_from_d9_lagna: { ta: "D9 லக்னத்திலிருந்து", en: "From D9 Lagna" },
  chart_house_label: { ta: "இடம்", en: "House" },
  chart_no_graha_in_rasi: { ta: "இந்த ராசியில் கிரகம் இல்லை.", en: "No grahas in this rasi." },
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
  gochar_empty:     { ta: "ஜாதகம் உருவாக்கிய பின் கோசாரம் தெரியும்.", en: "Create a chart to see transits and panchangam." },
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
  label_nalla_neram:{ ta: "நல்ல நேரம்",   en: "Nalla Neram" },
  label_abhijit:    { ta: "அபிஜித்",      en: "Abhijit" },

  // ── Graha table
  surface_planets:  { ta: "கிரக நிலை அட்டவணை — விரிவான விவரம்", en: "Planet positions — detailed" },
  planets_empty:    { ta: "ஜாதகம் உருவாக்கிய பின் கிரக நிலை தெரியும்.", en: "Create a chart to see planet positions." },
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
  dasha_all_bhukti: { ta: "அனைத்து புக்திகள்", en: "All Bhukti periods" },
  dasha_timeline_label: { ta: "விம்சோத்தரி தசா காலவரிசை — அனைத்து தசைகள்", en: "Vimshottari Dasa timeline — all periods" },
  dasha_word:       { ta: "தசா",    en: "Dasa" },
  bhukti_word:      { ta: "புக்தி", en: "Bhukti" },
  antaram_word:     { ta: "அந்தரம்", en: "Antaram" },
  status_active:    { ta: "◉ நடப்பு",  en: "◉ Active" },
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
  vaults_empty:     { ta: "சேகரிப்பு இல்லை. அமைவுகள் > அமைவு-ல் உருவாக்கவும்.", en: "No vaults found. Create one in Settings > Setup." },
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
  cal_family:       { ta: "👪 குடும்பம்",    en: "👪 Family" },
  surface_panja:    { ta: "பஞ்சாங்கம் — ஐந்து அங்கங்கள்", en: "Panchangam — Five limbs" },
  surface_kala:     { ta: "தடை நேரங்கள் (Kala Vibhagam)", en: "Inauspicious periods" },
  surface_hora:     { ta: "ஹோரை நேரங்கள்", en: "Hora table" },
  panja_empty:      { ta: "பிறப்பு விவரம் உருவாக்கிய பின் பஞ்சாங்கம் தெரியும்.", en: "Create a profile to see panchangam." },
  kala_empty:       { ta: "பிறப்பு விவரம் உருவாக்கிய பின் நேர விபரங்கள் தெரியும்.", en: "Create a profile to see timings." },
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
  cal_no_profile:   { ta: "தனிப்பட்ட யோக நிலை பார்க்க முதலில் பிறப்பு விவரம் உருவாக்கவும்.", en: "Create a birth profile to view personal fortune." },
  cal_no_vault:     { ta: "குடும்ப யோக நிலை பார்க்க முதலில் குடும்ப சேகரிப்பு உருவாக்கவும்.", en: "Create a family vault to view family fortune." },
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
  settings_retention_title: { ta: "Journal retention", en: "Journal retention" },
  settings_retention_desc: { ta: "பழைய ஜர்னல் குறிப்புகளை எத்தனை நாட்கள் வரை வைக்கவேண்டும் என அமைக்கவும்.", en: "Choose how long journal entries are kept before retention cleanup." },
  settings_retention_days: { ta: "வைக்கும் நாட்கள்", en: "Retention days" },
  settings_retention_hint: { ta: "Retention apply இயக்கும்போது இந்த default பயன்படும் (7–3650).", en: "Used as the default when retention apply runs (7–3650)." },
  settings_retention_save: { ta: "சேமி", en: "Save retention" },
  settings_retention_saving: { ta: "சேமிக்கிறது…", en: "Saving…" },
  settings_retention_saved: { ta: "Retention default புதுப்பிக்கப்பட்டது.", en: "Retention default updated." },
  settings_retention_acknowledge: { ta: "நினைவூட்டல் ஒப்புக்கொண்டது", en: "Acknowledge reminder" },
  settings_retention_ack_saved: { ta: "நினைவூட்டல் ஒப்புதல் சேமிக்கப்பட்டது.", en: "Reminder acknowledgement saved." },
  settings_retention_last_updated: { ta: "கடைசியாக புதுப்பிக்கப்பட்டது", en: "Last updated" },
  settings_retention_last_reviewed: { ta: "கடைசி நினைவூட்டல் ஒப்புதல்", en: "Last reminder acknowledgement" },
  settings_retention_next_review: { ta: "அடுத்த பரிந்துரைக்கப்பட்ட மதிப்பீடு", en: "Next recommended review" },
  settings_retention_not_available: { ta: "இன்னும் கிடைக்கவில்லை", en: "Not available yet" },
  settings_retention_notice_short: { ta: "குறுகிய காலம்: வேகமாக சுத்தப்படுத்தல். முக்கியமான பழைய குறிப்புகளை archive/export செய்யவும்.", en: "Short window: cleanup happens faster. Archive/export important older notes." },
  settings_retention_notice_medium: { ta: "சமநிலையான காலம்: நடுத்தர வரலாற்றுடன் வழக்கமான சுத்தப்படுத்தல்.", en: "Balanced window: regular cleanup with moderate history depth." },
  settings_retention_notice_long: { ta: "நீண்ட காலம்: சுத்தப்படுத்தலுக்கு முன் அதிக ஜர்னல் வரலாறு வைக்கப்படும்.", en: "Long window: larger journal history is retained before cleanup." },

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
  toast_vault_required:  { ta: "முதலில் குடும்ப சேகரிப்பை தேர்வு செய்யவும்.", en: "Please select a family vault first." },

  // Metric strip hint
  hint_no_profile:      { ta: "பிறப்பு விவரம் உருவாக்கவும்", en: "create a profile" },

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

  // ── Goals panel
  goals_panel_title:   { ta: "என் இலக்குகள்",          en: "My Goals" },
  goals_panel_desc:    { ta: "உங்கள் முக்கிய இலக்கை சேர்க்கவும். தினசரி வழிகாட்டல் அதற்கேற்ப செறிவூட்டப்படும்.", en: "Add your focus goal. Daily guidance will be enriched to match it." },
  goals_add:           { ta: "+ இலக்கு சேர்",           en: "+ Add goal" },
  goals_adding:        { ta: "சேர்க்கிறது…",            en: "Adding…" },
  goals_empty:         { ta: "இலக்குகள் இல்லை. ஒரு இலக்கை சேர்க்கவும்.",  en: "No goals yet. Add one to personalise guidance." },
  goals_remove:        { ta: "நீக்கு",                 en: "Remove" },
  goals_removing:      { ta: "நீக்குகிறது…",            en: "Removing…" },
  goal_job_change:     { ta: "வேலை மாற்றம்",           en: "Job Change" },
  goal_business:       { ta: "தொழில் தொடக்கம்",        en: "Start Business" },
  goal_marriage:       { ta: "திருமணம்",               en: "Marriage" },
  goal_education:      { ta: "கல்வி",                  en: "Education" },
  goal_property:       { ta: "சொத்து",                 en: "Property" },
  goal_health:         { ta: "உடல்நலம்",               en: "Health" },
  goal_travel:         { ta: "வெளிநாடு பயணம்",         en: "Travel Abroad" },
  goal_spiritual:      { ta: "ஆன்மீகம்",               en: "Spiritual" },
  goal_family:         { ta: "குடும்ப நலம்",            en: "Family Harmony" },
  goal_money:          { ta: "பண வரவு",                en: "Financial Growth" },
  goal_child:          { ta: "குழந்தை பாக்கியம்",       en: "Child Birth" },
  goal_other:          { ta: "மற்றவை",                  en: "Other" },

  // ── What-If Simulator
  whatif_panel_title:  { ta: "என்ன ஆகும்? — எதிர்காலம் ஆய்வு", en: "What-If Simulator" },
  whatif_panel_desc:   { ta: "ஒரு தேதியும் இலக்கும் தேர்ந்தெடுக்கவும். மூன்று தூண் திருகாணித முறையில் ஆய்வு கிடைக்கும்.", en: "Pick a scenario and a target date. Get a triple-confirmation Thirukanitham analysis." },
  whatif_scenario:     { ta: "இலக்கு / சூழ்நிலை",     en: "Scenario" },
  whatif_date:         { ta: "இலக்கு தேதி",            en: "Target date" },
  whatif_run:          { ta: "ஆய்வு செய்",             en: "Analyse" },
  whatif_running:      { ta: "ஆய்வு செய்கிறது…",       en: "Analysing…" },
  whatif_result_title: { ta: "மூன்று தூண் திருகாணித ஆய்வு",  en: "Triple-confirmation analysis" },
  whatif_natal:        { ta: "ஜாதக வாக்கு",            en: "Natal Promise" },
  whatif_dasha:        { ta: "தசா ஆதரவு",              en: "Dasha Support" },
  whatif_gochar:       { ta: "கோசார ஆதரவு",            en: "Gochar Support" },
  whatif_overall:      { ta: "ஒட்டுமொத்த நிலை",        en: "Overall verdict" },
  whatif_best_period:  { ta: "சிறந்த காலம்",           en: "Best period" },
  whatif_caution:      { ta: "கவனிக்கவும்",            en: "Caution" },
  whatif_remedy:       { ta: "பரிகாரம்",               en: "Remedy" },
  whatif_disclaimer:   { ta: "குறிப்பு",               en: "Note" },
  strength_strong:     { ta: "வலிமையான",               en: "Strong" },
  strength_moderate:   { ta: "நடுநிலை",                en: "Moderate" },
  strength_weak:       { ta: "குறைவான",                en: "Weak" },
  verdict_favourable:  { ta: "சாதகம்",                 en: "Favourable" },
  verdict_neutral:     { ta: "நடுநிலை",                en: "Neutral" },
  verdict_caution:     { ta: "கவன நிலை",              en: "Caution" },

  // ── Emotional weather / nakshatra / context / journal / alerts
  emotional_weather_label:    { ta: "உணர்வு வானிலை",    en: "Emotional Weather" },
  nakshatra_lens_label:       { ta: "நட்சத்திர பார்வை",  en: "Nakshatra Lens" },
  context_insight_label:      { ta: "இன்றைய சூழல்",      en: "Today's Context" },
  journal_insight_label:      { ta: "குறிப்பு வடிவம்",   en: "Journal Pattern" },
  ambient_alerts_label:       { ta: "அறிவிப்புகள்",      en: "Alerts" },
  alert_today:                { ta: "இன்று",             en: "Today" },
  alert_tomorrow:             { ta: "நாளை",              en: "Tomorrow" },
  alert_days_away:            { ta: "நாட்களில்",         en: "days away" },
  emotional_tone_label:       { ta: "நிலை",              en: "Tone" },
  physical_tendency_label:    { ta: "சக்தி",             en: "Energy" },
  best_use_label:             { ta: "சிறந்த பயன்பாடு",  en: "Best use" },
  avoid_before_label:         { ta: "கவனம்",             en: "Note" },

  // ── Phase 4: Deep predictions
  predictions_tab_label:   { ta: "கணிப்புகள்",                     en: "Predictions" },
  pred_marriage_title:     { ta: "திருமண கணிப்பு",                  en: "Marriage Prediction" },
  pred_career_title:       { ta: "தொழில் கணிப்பு",                  en: "Career Prediction" },
  pred_wealth_title:       { ta: "பண வரவு கணிப்பு",                 en: "Wealth Prediction" },
  pred_health_title:       { ta: "உடல்நலம் கணிப்பு",                en: "Health Prediction" },
  pred_confidence:         { ta: "நம்பிக்கை நிலை",                  en: "Confidence" },
  pred_dasha_support:      { ta: "தசா ஆதரவு",                       en: "Dasha support" },
  pred_transit_support:    { ta: "கோசார ஆதரவு",                     en: "Transit support" },
  pred_timing_window:      { ta: "கால வரம்பு",                      en: "Timing window" },
  pred_supports:           { ta: "சாதகங்கள்",                       en: "Supporting factors" },
  pred_challenges:         { ta: "சவால்கள்",                        en: "Challenges" },
  pred_factors:            { ta: "ஜோதிட காரணிகள்",                  en: "Astrological factors" },
  pred_loading:            { ta: "கணிப்பு ஏற்றுகிறது…",             en: "Loading prediction…" },
  pred_empty:              { ta: "ஜாதகம் கணக்கிட்ட பின் கணிப்பு தெரியும்.", en: "Predictions load after chart calculation." },
  pred_strong:             { ta: "வலிமையான",                        en: "Strong" },
  pred_partial:            { ta: "ஓரளவு",                           en: "Partial" },
  pred_weak:               { ta: "குறைவான",                         en: "Weak" },
  pred_high:               { ta: "அதிக நம்பிக்கை",                  en: "High" },
  pred_medium:             { ta: "நடுத்தர நம்பிக்கை",               en: "Medium" },
  pred_low:                { ta: "குறைவான நம்பிக்கை",               en: "Low" },
  pred_support_badge:      { ta: "ஆதரவு",                           en: "Support" },
  pred_caution_badge:      { ta: "கவனம்",                           en: "Caution" },
  pred_neutral_badge:      { ta: "நடுநிலை",                         en: "Neutral" },

  // ── Phase 2: Yogas & Doshams
  yogas_title:             { ta: "யோகங்கள்",                         en: "Yogas" },
  doshams_title:           { ta: "தோஷங்கள்",                         en: "Doshams" },
  yoga_present:            { ta: "இருக்கிறது",                       en: "Present" },
  yoga_absent:             { ta: "இல்லை",                            en: "Absent" },
  dosham_cancelled:        { ta: "ரத்தாகியது",                       en: "Cancelled" },
  dosham_active:           { ta: "செயலில் உள்ளது",                   en: "Active" },
  yoga_dasha_activated:    { ta: "தசையில் செயல்படுகிறது",            en: "Dasha-activated" },
  yoga_conditions_met:     { ta: "நிறைவேறிய நிபந்தனைகள்",           en: "Conditions met" },
  yoga_cancellation:       { ta: "ரத்து காரணங்கள்",                  en: "Cancellation factors" },
  yogas_empty:             { ta: "ஜாதகம் கணக்கிட்ட பின் யோக/தோஷ விவரம் தெரியும்.", en: "Yoga/Dosham details appear after chart calculation." },

  // ── Phase 6: Jadhagam full report
  jadhagam_report_title:   { ta: "முழு ஜாதக அறிக்கை",               en: "Full Jadhagam Report" },
  jadhagam_report_btn:     { ta: "அறிக்கை காண்",                    en: "View Report" },
  jadhagam_report_loading: { ta: "அறிக்கை ஏற்றுகிறது…",             en: "Loading report…" },
  jadhagam_identity:       { ta: "அடிப்படை அடையாளம்",               en: "Core Identity" },
  jadhagam_planet_strength:{ ta: "கிரக பலம்",                        en: "Planet Strength" },
  jadhagam_strong_planets: { ta: "பலமான கிரகங்கள்",                  en: "Strong planets" },
  jadhagam_moderate_planets:{ ta: "நடுத்தர கிரகங்கள்",              en: "Moderate planets" },
  jadhagam_weak_planets:   { ta: "பலவீன கிரகங்கள்",                  en: "Weak planets" },
  jadhagam_func_nature:    { ta: "செயல்பாட்டு குணம்",               en: "Functional Nature" },
  jadhagam_age_focus:      { ta: "வயது-சார் கவனம்",                  en: "Age-wise focus" },
  jadhagam_year_guidance:  { ta: "இந்த ஆண்டு வழிகாட்டல்",           en: "This year's guidance" },
  jadhagam_practical:      { ta: "நடைமுறை வழிகாட்டல்",              en: "Practical guidance" },
  jadhagam_remedies:       { ta: "பரிகாரங்கள்",                      en: "Remedies" },
  jadhagam_executive:      { ta: "சுருக்கம்",                        en: "Executive summary" },
  jadhagam_navamsa:        { ta: "நவாம்சம் (D9)",                    en: "Navamsa (D9)" },
  jadhagam_vargottama:     { ta: "வர்கோத்தமம்",                     en: "Vargottama planets" },

  // ── Life Areas tab
  tab_life_areas:      { ta: "வாழ்க்கை துறைகள்",     en: "Life Areas" },
  life_areas_title:    { ta: "வாழ்க்கை துறை பலன்கள்", en: "Life-area fortune" },
  life_areas_desc:     { ta: "தொழில், பணம், உடல்நலம், உறவு, கல்வி, ஆன்மீகம், குடும்பம் — ஒவ்வொரு துறையிலும் தற்போதைய நிலை.", en: "Career, money, health, relationships, education, spiritual, family — current standing in each life area." },
  life_areas_empty:    { ta: "பிறப்பு விவரம் உருவாக்கிய பின் வாழ்க்கை துறை பலன்கள் தெரியும்.", en: "Create a birth profile to view life-area scores." },
  life_area_karaka:    { ta: "காரகன்",                en: "Karaka" },
  life_area_outlook:   { ta: "30 நாள் நிலை",          en: "30-day outlook" },

  // ── Narrative / Why this prediction
  why_this_prediction: { ta: "இந்த கணிப்பு ஏன்?",    en: "Why this prediction?" },
  remedy_label:        { ta: "பரிகாரம் / வழிபாடு",   en: "Remedy / Worship" },
  reason_moonTransit:  { ta: "சந்திர கோசாரம்",       en: "Moon transit" },
  reason_dashaSupport: { ta: "தசா ஆதரவு",            en: "Dasa support" },
  reason_panchangam:   { ta: "பஞ்சாங்கம்",           en: "Panchangam" },
  reason_gochar:       { ta: "கோசாரம்",               en: "Gochar" },
  reason_personalCaution: { ta: "தனிப்பட்ட கவலை",   en: "Personal caution" },

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

  // ── FEATURE-10: Nakshatra personality card
  nakshatra_card_label:    { ta: "நட்சத்திர குணாதிசயம்", en: "Nakshatra Profile" },
  nakshatra_deity:         { ta: "தேவதை",                en: "Deity" },
  nakshatra_symbol:        { ta: "சின்னம்",               en: "Symbol" },
  nakshatra_ruling_planet: { ta: "அதிபதி கிரகம்",        en: "Ruling Planet" },
  nakshatra_strengths:     { ta: "பலங்கள்",              en: "Strengths" },
  nakshatra_cautions:      { ta: "கவனிக்க",              en: "Cautions" },

  // ── ARCH-02: Notification preferences
  notif_section_title:     { ta: "அறிவிப்புகள்",                    en: "Notifications" },
  notif_channel:           { ta: "சேனல்",                           en: "Channel" },
  notif_channel_none:      { ta: "இல்லை",                          en: "None" },
  notif_channel_email:     { ta: "மின்னஞ்சல்",                     en: "Email" },
  notif_channel_push:      { ta: "Push",                            en: "Push" },
  notif_channel_both:      { ta: "இரண்டும்",                        en: "Both" },
  notif_morning_alert:     { ta: "காலை அறிவிப்பு",                  en: "Morning alert" },
  notif_morning_time:      { ta: "நேரம்",                           en: "Time" },
  notif_dasha_alert:       { ta: "தசா மாற்ற அறிவிப்பு",            en: "Dasha transition alert" },
  notif_pirantha_alert:    { ta: "பிறந்த நாள் அறிவிப்பு",           en: "Pirantha Naal alert" },
  notif_smart_silence:     { ta: "நுட்பமான அமைதி",                 en: "Smart silence" },
  notif_fcm_registered:    { ta: "FCM பதிவு செய்யப்பட்டது",         en: "Push token registered" },
  notif_fcm_not_registered:{ ta: "FCM பதிவு இல்லை",                en: "No push token registered" },
  btn_save_notifications:  { ta: "அறிவிப்பு அமைப்புகளை சேமி",       en: "Save Notification Settings" },
  notif_saving:            { ta: "சேமிக்கிறது…",                    en: "Saving…" },
  notif_saved:             { ta: "அறிவிப்பு அமைப்புகள் சேமிக்கப்பட்டன.", en: "Notification settings saved." },

  // ── FEATURE-05: Tithi special content card
  tithi_card_label:        { ta: "இன்றைய தினம்",   en: "Today's Significance" },

  // ── FEATURE-11: Peyarchi report
  peyarchi_outlook_label:  { ta: "பெயர்ச்சி விளைவு", en: "Peyarchi Outlook" },
  btn_view_outlook:        { ta: "விளைவு காண்க",      en: "View Outlook" },
  btn_hide_outlook:        { ta: "மூடு",              en: "Hide" },

  // ── FEATURE-07: Week-ahead digest
  week_ahead_label:        { ta: "வாரக் கண்ணோட்டம்",          en: "Week Ahead" },
  week_best_day:           { ta: "சிறந்த நாள்",               en: "Best day" },
  week_dasha_theme:        { ta: "தசா கருப்பொருள்",           en: "Dasha theme" },
  week_chandrashtama_badge:{ ta: "⚠ சந்திராஷ்டமம்",           en: "⚠ Chandrashtama" },
  week_special_tithi:      { ta: "சிறப்பு திதி",              en: "Special tithi" },

  // ── FEATURE-08: Activity timing tool
  activity_timing_label:   { ta: "செயல் நேரம்",               en: "Activity Timing" },
  activity_label:          { ta: "செயல்",                      en: "Activity" },
  activity_month_label:    { ta: "மாதம்",                      en: "Month" },
  btn_find_best_dates:     { ta: "சிறந்த நாட்கள் காண்",        en: "Find Best Dates" },
  btn_finding:             { ta: "தேடுகிறது…",                  en: "Searching…" },
  activity_job_change:     { ta: "வேலை மாற்றம்",               en: "Job Change" },
  activity_business_start: { ta: "தொழில் தொடக்கம்",            en: "Business Start" },
  activity_marriage:       { ta: "திருமணம்",                   en: "Marriage" },
  activity_education:      { ta: "கல்வி",                      en: "Education" },
  activity_property:       { ta: "சொத்து",                     en: "Property" },
  activity_health:         { ta: "உடல்நலம்",                   en: "Health" },
  activity_travel:         { ta: "பயணம்",                      en: "Travel" },
  activity_spiritual:      { ta: "ஆன்மிகம்",                  en: "Spiritual" },
  activity_family:         { ta: "குடும்பம்",                  en: "Family" },
  activity_money:          { ta: "பணம்",                       en: "Money" },
  activity_child:          { ta: "குழந்தை",                    en: "Child" },
  activity_other:          { ta: "மற்றவை",                     en: "Other" },

  // ── FEATURE-09: Dasha story timeline
  dasha_story_label:       { ta: "முழு தசா வரலாறு",            en: "Full Dasha Story" },
  dasha_story_age:         { ta: "வயது",                        en: "Age" },
  btn_expand_dasha_story:  { ta: "தசா வரலாறு காண்",             en: "View Dasha Story" },
  btn_collapse_dasha_story:{ ta: "மூடு",                        en: "Collapse" },

  // ── FEATURE-12: Journal correlations
  journal_patterns_label:  { ta: "குறிப்பு வடிவங்கள்",          en: "Journal Patterns" },
  journal_entries_progress:{ ta: "குறிப்புகள்",                  en: "entries" },
  journal_keep_going:      { ta: "முறைகளை திறக்க தொடர்ந்து எழுதுங்கள்.", en: "Keep journalling to unlock pattern insights." },
  journal_mood_avg:        { ta: "சராசரி மனநிலை",               en: "Mood avg" },
  journal_sample_count:    { ta: "குறிப்புகள்",                  en: "entries" },

  // ── Synastry & Relationship compatibility
  synastry_panel_title:    { ta: "உறவு பொருத்தம்",              en: "Relationship Compatibility" },
  synastry_panel_desc:     { ta: "குடும்ப உறுப்பினர்களுடன் ஜாதக பொருத்தம் ஆய்வு",  en: "Synastry analysis with family vault members" },
  synastry_select_member:  { ta: "உறுப்பினரை தேர்வு செய்யவும்",  en: "Select a member to analyse" },
  synastry_loading:        { ta: "பொருத்தம் கணக்கிடுகிறது…",    en: "Calculating compatibility…" },
  synastry_score:          { ta: "பொருத்த மதிப்பெண்",            en: "Compatibility Score" },
  synastry_aspects:        { ta: "ஒருங்கிணைவு அம்சங்கள்",       en: "Synastry Aspects" },
  synastry_timing:         { ta: "கால குறிகாட்டிகள்",            en: "Timing Indicators" },
  synastry_summary:        { ta: "சுருக்கம்",                    en: "Summary" },
  synastry_caution:        { ta: "கவனிக்க",                      en: "Caution" },
  synastry_aspect_supportive: { ta: "சாதகம்",                   en: "Supportive" },
  synastry_aspect_challenging:{ ta: "சவால்",                    en: "Challenging" },
  synastry_aspect_neutral: { ta: "நடுநிலை",                     en: "Neutral" },
  synastry_no_vault:       { ta: "குடும்ப vault உறுப்பினர்கள் தேவை. Family tab-ல் சேர்க்கவும்.", en: "Family vault members needed. Add them in the Family tab." },
  synastry_no_members:     { ta: "உறுப்பினர்கள் இல்லை",         en: "No members available" },
  rel_alerts_title:        { ta: "உறவு அறிவிப்புகள்",           en: "Relationship Alerts" },
  rel_alerts_empty:        { ta: "தற்போது உறவு அறிவிப்புகள் இல்லை.", en: "No relationship alerts at this time." },
  rel_alerts_loading:      { ta: "அறிவிப்புகள் ஏற்றுகிறது…",    en: "Loading alerts…" },

  // ── Retrospective event analysis
  retro_panel_title:       { ta: "நிகழ்வு பின்னோக்கு ஆய்வு",   en: "Event Retrospective" },
  retro_panel_desc:        { ta: "ஒரு கடந்த கால நிகழ்வை உள்ளிடவும் — ஜோதிட தொடர்பு & எதிர்கால மீண்டுவரல் தெரியும்.", en: "Enter a past event to see its astrological correlation and future recurrence patterns." },
  retro_event_date:        { ta: "நிகழ்வு தேதி",                en: "Event date" },
  retro_event_desc:        { ta: "நிகழ்வு விவரம் *",            en: "Event description *" },
  retro_event_type:        { ta: "நிகழ்வு வகை",                 en: "Event type" },
  retro_analyse:           { ta: "பின்னோக்கு ஆய்வு செய்",      en: "Analyse Event" },
  retro_analysing:         { ta: "ஆய்வு செய்கிறது…",            en: "Analysing…" },
  retro_correlation:       { ta: "ஜோதிட தொடர்பு",              en: "Astrological Correlation" },
  retro_future_recurrence: { ta: "எதிர்கால மீண்டுவரல்",         en: "Future Recurrences" },
  retro_caution:           { ta: "கவனிக்கவும்",                 en: "Caution" },
  retro_approx_date:       { ta: "தோராயமான தேதி",               en: "Approximate date" },
  retro_intensity:         { ta: "தீவிரம்",                     en: "Intensity" },
  retro_empty:             { ta: "நிகழ்வை உள்ளிட்டு பின்னோக்கு ஆய்வை தொடங்கவும்.", en: "Enter an event above to start retrospective analysis." },
  retro_event_career:      { ta: "தொழில்",                      en: "Career" },
  retro_event_health:      { ta: "உடல்நலம்",                    en: "Health" },
  retro_event_relationship:{ ta: "உறவு",                        en: "Relationship" },
  retro_event_finance:     { ta: "பணம்",                        en: "Finance" },
  retro_event_family:      { ta: "குடும்பம்",                   en: "Family" },
  retro_event_travel:      { ta: "பயணம்",                       en: "Travel" },
  retro_event_spiritual:   { ta: "ஆன்மிகம்",                   en: "Spiritual" },
  retro_event_other:       { ta: "மற்றவை",                      en: "Other" },
  retro_intensity_similar: { ta: "இதே போல்",                   en: "Similar" },
  retro_intensity_milder:  { ta: "குறைவான",                     en: "Milder" },
  retro_intensity_stronger:{ ta: "அதிகமான",                    en: "Stronger" },
  retro_key_transits:      { ta: "முக்கிய கோசாரங்கள்",          en: "Key Transits" },
  retro_active_dasha:      { ta: "நடப்பு தசா",                  en: "Active Dasha" },

  // ── Decision support tool
  decision_panel_title:    { ta: "முடிவு ஆதரவு",               en: "Decision Support" },
  decision_panel_desc:     { ta: "இரண்டு விருப்பங்களை ஒப்பிட்டு ஜோதிட அடிப்படையில் சிறந்த முடிவை கண்டறியவும்.", en: "Compare two options and find the astrologically favourable choice." },
  decision_scenario:       { ta: "சூழ்நிலை / இலக்கு",          en: "Scenario / Goal" },
  decision_target_date:    { ta: "இலக்கு தேதி",                 en: "Target date" },
  decision_option_a:       { ta: "விருப்பம் A",                 en: "Option A" },
  decision_option_b:       { ta: "விருப்பம் B",                 en: "Option B" },
  decision_analyse:        { ta: "ஆய்வு செய்",                  en: "Analyse" },
  decision_analysing:      { ta: "ஆய்வு செய்கிறது…",            en: "Analysing…" },
  decision_recommended:    { ta: "பரிந்துரை",                   en: "Recommended" },
  decision_confidence:     { ta: "நம்பிக்கை",                   en: "Confidence" },
  decision_reasoning:      { ta: "காரணம்",                      en: "Reasoning" },
  decision_caution:        { ta: "கவனிக்கவும்",                 en: "Caution" },
  decision_score:          { ta: "மதிப்பெண்",                   en: "Score" },
  decision_alignment:      { ta: "சாதகங்கள்",                   en: "Alignments" },
  decision_risks:          { ta: "அபாயங்கள்",                   en: "Risk factors" },
  decision_optimal_window: { ta: "சிறந்த நேர சாளரம்",          en: "Optimal window" },
  decision_defer:          { ta: "ஒத்திவை",                    en: "Defer" },
  decision_empty:          { ta: "இலக்கு தேதியும் சூழ்நிலையும் தேர்வு செய்து ஆய்வை தொடங்கவும்.", en: "Select a scenario and target date to begin analysis." },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

export function tLang(obj: { ta: string; en: string }, lang: Lang): string {
  return obj[lang];
}

// ── Panchangam name lookup maps (Thirukanitham tradition) ─────────────────────

const TITHI_NAMES: Record<string, { ta: string; en: string }> = {
  PRATHAMA:    { ta: "பிரதமை",    en: "Prathama" },
  DVITHIYAI:   { ta: "துவிதியை",  en: "Dvithiyai" },
  THRITHIYAI:  { ta: "திரிதியை",  en: "Thrithiyai" },
  CHATHURTHI:  { ta: "சதுர்த்தி", en: "Chathurthi" },
  PANCHAMI:    { ta: "பஞ்சமி",    en: "Panchami" },
  SHASHTI:     { ta: "சஷ்டி",     en: "Shashti" },
  SAPTAMI:     { ta: "சப்தமி",    en: "Saptami" },
  ASHTAMI:     { ta: "அஷ்டமி",   en: "Ashtami" },
  NAVAMI:      { ta: "நவமி",      en: "Navami" },
  DASAMI:      { ta: "தசமி",      en: "Dasami" },
  EKADASI:     { ta: "ஏகாதசி",   en: "Ekadasi" },
  DVADASI:     { ta: "துவாதசி",   en: "Dvadasi" },
  THRAYODASI:  { ta: "திரயோதசி", en: "Thrayodasi" },
  CHATHURDASI: { ta: "சதுர்தசி",  en: "Chathurdasi" },
  POURNAMI:    { ta: "பௌர்ணமி",   en: "Pournami" },
  AMAVASAI:    { ta: "அமாவாசை",  en: "Amavasai" },
};

const NAKSHATRA_NAMES: Record<string, { ta: string; en: string }> = {
  ASWINI:         { ta: "அஸ்வினி",        en: "Aswini" },
  BHARANI:        { ta: "பரணி",            en: "Bharani" },
  KARTHIGAI:      { ta: "கார்த்திகை",     en: "Karthigai" },
  ROHINI:         { ta: "ரோகிணி",         en: "Rohini" },
  MIRUGASEERIDAM: { ta: "மிருகசீரிடம்",   en: "Mirugaseeridam" },
  THIRUVATHIRAI:  { ta: "திருவாதிரை",     en: "Thiruvathirai" },
  PUNARPOOSAM:    { ta: "புனர்பூசம்",     en: "Punarpoosam" },
  POOSAM:         { ta: "பூசம்",           en: "Poosam" },
  AYILYAM:        { ta: "ஆயில்யம்",       en: "Ayilyam" },
  MAGAM:          { ta: "மகம்",            en: "Magam" },
  POORAM:         { ta: "பூரம்",           en: "Pooram" },
  UTHIRAM:        { ta: "உத்திரம்",        en: "Uthiram" },
  HASTHAM:        { ta: "ஹஸ்தம்",         en: "Hastham" },
  CHITHIRAI:      { ta: "சித்திரை",        en: "Chithirai" },
  SWATHI:         { ta: "சுவாதி",          en: "Swathi" },
  VISAKAM:        { ta: "விசாகம்",         en: "Visakam" },
  ANUSHAM:        { ta: "அனுஷம்",         en: "Anusham" },
  KETTAI:         { ta: "கேட்டை",          en: "Kettai" },
  MOOLAM:         { ta: "மூலம்",           en: "Moolam" },
  POORADAM:       { ta: "பூராடம்",         en: "Pooradam" },
  UTHIRADAM:      { ta: "உத்திராடம்",      en: "Uthiradam" },
  THIRUVONAM:     { ta: "திருவோணம்",       en: "Thiruvonam" },
  AVITTAM:        { ta: "அவிட்டம்",        en: "Avittam" },
  SADAYAM:        { ta: "சதயம்",           en: "Sadayam" },
  POORATTATHI:    { ta: "பூரட்டாதி",       en: "Poorattathi" },
  UTHIRATTATHI:   { ta: "உத்திரட்டாதி",    en: "Uthirattathi" },
  REVATHI:        { ta: "ரேவதி",           en: "Revathi" },
};

const WEEKDAY_NAMES: Record<string, { ta: string; en: string }> = {
  SUNDAY:    { ta: "ஞாயிறு",   en: "Sunday" },
  MONDAY:    { ta: "திங்கள்",  en: "Monday" },
  TUESDAY:   { ta: "செவ்வாய்", en: "Tuesday" },
  WEDNESDAY: { ta: "புதன்",    en: "Wednesday" },
  THURSDAY:  { ta: "வியாழன்",  en: "Thursday" },
  FRIDAY:    { ta: "வெள்ளி",   en: "Friday" },
  SATURDAY:  { ta: "சனி",      en: "Saturday" },
};

const PLANET_LORDS: Record<string, { ta: string; en: string }> = {
  SUN:     { ta: "சூரியன்",  en: "Sun" },
  MOON:    { ta: "சந்திரன்", en: "Moon" },
  MARS:    { ta: "செவ்வாய்", en: "Mars" },
  MERCURY: { ta: "புதன்",    en: "Mercury" },
  GURU:    { ta: "குரு",     en: "Jupiter" },
  VENUS:   { ta: "சுக்கிரன்", en: "Venus" },
  SATURN:  { ta: "சனி",      en: "Saturn" },
  JUPITER: { ta: "குரு",     en: "Jupiter" },
  RAHU:    { ta: "ராகு",     en: "Rahu" },
  KETU:    { ta: "கேது",     en: "Ketu" },
};

const YOGA_NAMES: Record<string, { ta: string; en: string }> = {
  VISHKAMBHA: { ta: "விஷ்கம்பம்", en: "Vishkambha" },
  PRITI:      { ta: "பிரீதி",     en: "Priti" },
  AYUSHMAN:   { ta: "ஆயுஷ்மான்", en: "Ayushman" },
  SAUBHAGYA:  { ta: "சௌபாக்கியம்", en: "Saubhagya" },
  SHOBHANA:   { ta: "சோபன",       en: "Shobhana" },
  ATIGANDA:   { ta: "அதிகண்ட",    en: "Atiganda" },
  SUKARMA:    { ta: "சுகர்ம",      en: "Sukarma" },
  DHRITI:     { ta: "திருதி",      en: "Dhriti" },
  SHOOLA:     { ta: "சூல",         en: "Shoola" },
  GANDA:      { ta: "கண்ட",        en: "Ganda" },
  VRIDDHI:    { ta: "விருத்தி",    en: "Vriddhi" },
  DHRUVA:     { ta: "த்ருவ",       en: "Dhruva" },
  VYAGHATA:   { ta: "வியாகாத",    en: "Vyaghata" },
  HARSHANA:   { ta: "ஹர்ஷண",      en: "Harshana" },
  VAJRA:      { ta: "வஜ்ர",        en: "Vajra" },
  SIDDHI:     { ta: "சித்தி",      en: "Siddhi" },
  VYATIPATA:  { ta: "வியதீபாத",   en: "Vyatipata" },
  VARIYANA:   { ta: "வரியான",      en: "Variyana" },
  PARIGHA:    { ta: "பரிகம்",      en: "Parigha" },
  SHIVA:      { ta: "சிவ",          en: "Shiva" },
  SIDDHA:     { ta: "சித்த",        en: "Siddha" },
  SADHYA:     { ta: "சாத்ய",        en: "Sadhya" },
  SHUBHA:     { ta: "சுப",           en: "Shubha" },
  SHUKLA:     { ta: "சுக்ல",         en: "Shukla" },
  BRAHMA:     { ta: "பிரம்ம",       en: "Brahma" },
  INDRA:      { ta: "இந்திர",        en: "Indra" },
  VAIDHRITI:  { ta: "வைத்ருதி",     en: "Vaidhriti" },
};

const KARANA_NAMES: Record<string, { ta: string; en: string }> = {
  BAVA:    { ta: "பவ",     en: "Bava" },
  BALAVA:  { ta: "பாலவ",  en: "Balava" },
  KAULAVA: { ta: "கௌலவ", en: "Kaulava" },
  TAITILA: { ta: "தைதில", en: "Taitila" },
  GARAJA:  { ta: "கரஜ",   en: "Garaja" },
  VANIJA:  { ta: "வணிஜ",  en: "Vanija" },
  VISHTI:  { ta: "விஷ்டி", en: "Vishti" },
  SHAKUNI: { ta: "சகுனி",  en: "Shakuni" },
  CHATUSHPADA: { ta: "சதுஷ்பாத", en: "Chatushpada" },
  NAGA:    { ta: "நாக",    en: "Naga" },
  KIMSTUGHNA: { ta: "கிம்ஸ்துக்ன", en: "Kimstughna" },
};

type PanchangamNameMap = Record<string, { ta: string; en: string }>;

function _lookupName(map: PanchangamNameMap, key: string, lang: Lang): string {
  const entry = map[key.toUpperCase()];
  if (!entry) return key; // fallback: return the raw key unchanged
  return entry[lang];
}

export function tTithi(key: string, lang: Lang): string {
  return _lookupName(TITHI_NAMES, key, lang);
}

export function tNakshatra(key: string, lang: Lang): string {
  return _lookupName(NAKSHATRA_NAMES, key, lang);
}

export function tWeekday(key: string, lang: Lang): string {
  return _lookupName(WEEKDAY_NAMES, key, lang);
}

export function tPlanetLord(key: string, lang: Lang): string {
  return _lookupName(PLANET_LORDS, key, lang);
}

export function tYoga(key: string, lang: Lang): string {
  return _lookupName(YOGA_NAMES, key, lang);
}

export function tKarana(key: string, lang: Lang): string {
  return _lookupName(KARANA_NAMES, key, lang);
}

