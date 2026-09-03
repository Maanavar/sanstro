import type { Lang } from "./i18n";

/**
 * Every user-visible string on /login.
 *
 * A-004. The left branding panel was made bilingual and the form was not, which
 * left the page in a worse state than the English-only one it replaced: a Tamil
 * reader was greeted in Tamil and then handed an English form, with no language
 * control anywhere on the page to resolve the contradiction. Either the whole
 * page speaks the reader's language or none of it does.
 *
 * Kept out of `lib/i18n.ts` on the same grounds as `dashboard-i18n.ts` — that
 * file is the dictionary the signed-in app reads on every route, and ~55
 * auth-only strings would ride along in its bundle for readers who have already
 * logged in and will never see this page again.
 *
 * SERVER-SUPPLIED ERRORS ARE NOT HERE. `payload.detail` from the API arrives in
 * whatever language the backend produced and is shown verbatim; the strings
 * below are only the client-side fallbacks for when there is no detail to show.
 *
 * New Tamil throughout, pending native review (CLAUDE.md new-Tamil rule).
 */
const LOGIN_STRINGS = {
  // ── Left branding panel
  left_panel_aria: { en: "Why Vinaadi", ta: "வினாடி ஏன்" },
  left_tagline: {
    en: "Thirukanitham-based Tamil astrology for daily life and family planning.",
    ta: "அன்றாட வாழ்விற்கும் குடும்பத் திட்டமிடலுக்கும் திருக்கணித அடிப்படையிலான தமிழ் ஜோதிடம்.",
  },
  left_back_home: { en: "← Back to home", ta: "← முகப்புக்குத் திரும்பு" },
  brand_home_aria: { en: "Vinaadi home", ta: "வினாடி முகப்பு" },

  // ── Headings
  title_login: { en: "Welcome back", ta: "மீண்டும் வருக" },
  title_signup: { en: "Create your account", ta: "உங்கள் கணக்கை உருவாக்குங்கள்" },
  title_reset: { en: "Set a new password", ta: "புதிய கடவுச்சொல்லை அமைக்கவும்" },
  title_forgot: { en: "Reset your password", ta: "கடவுச்சொல்லை மீட்டமைக்கவும்" },
  subtitle_login: { en: "Sign in to your Vinaadi workspace", ta: "உங்கள் வினாடி பணியிடத்தில் உள்நுழையுங்கள்" },
  subtitle_signup: { en: "Start your morning reading practice", ta: "உங்கள் காலை வாசிப்புப் பழக்கத்தைத் தொடங்குங்கள்" },
  subtitle_reset: { en: "Choose a new password for your account", ta: "உங்கள் கணக்கிற்குப் புதிய கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்" },
  subtitle_forgot: { en: "We'll send a reset link to your email", ta: "மீட்டமைப்பு இணைப்பை உங்கள் மின்னஞ்சலுக்கு அனுப்புவோம்" },

  // ── Mode tabs
  tablist_aria: { en: "Authentication mode", ta: "உள்நுழைவு முறை" },
  tab_sign_in: { en: "Sign in", ta: "உள்நுழைக" },
  tab_create_account: { en: "Create account", ta: "கணக்கு உருவாக்கு" },

  // ── Google SSO
  google_continue: { en: "Continue with Google", ta: "Google மூலம் தொடரவும்" },
  divider_or: { en: "or", ta: "அல்லது" },

  // ── Success states
  success_signup_title: { en: "Account created", ta: "கணக்கு உருவாக்கப்பட்டது" },
  success_signup_body: {
    en: "Your account is ready. Sign in to open your dashboard.",
    ta: "உங்கள் கணக்கு தயார். உங்கள் பலகையைத் திறக்க உள்நுழையுங்கள்.",
  },
  success_go_sign_in: { en: "Go to sign in →", ta: "உள்நுழைவுக்குச் செல் →" },
  success_forgot_title: { en: "Reset link sent", ta: "மீட்டமைப்பு இணைப்பு அனுப்பப்பட்டது" },
  success_forgot_prefix: { en: "If an account exists for", ta: "இந்த முகவரிக்குக் கணக்கு இருந்தால்" },
  success_forgot_suffix: {
    en: "you'll receive a reset link shortly.",
    ta: "மீட்டமைப்பு இணைப்பு விரைவில் வந்துசேரும்.",
  },
  success_reset_title: { en: "Password updated", ta: "கடவுச்சொல் புதுப்பிக்கப்பட்டது" },
  success_reset_body: {
    en: "Your password has been changed. Please sign in with your new password.",
    ta: "உங்கள் கடவுச்சொல் மாற்றப்பட்டது. புதிய கடவுச்சொல்லைக் கொண்டு உள்நுழையுங்கள்.",
  },

  // ── Fields
  label_email: { en: "Email", ta: "மின்னஞ்சல்" },
  error_email_invalid: { en: "Enter a valid email address", ta: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்" },
  label_password: { en: "Password", ta: "கடவுச்சொல்" },
  label_new_password: { en: "New password", ta: "புதிய கடவுச்சொல்" },
  placeholder_password_new: { en: "Min. 8 characters", ta: "குறைந்தது 8 எழுத்துகள்" },
  show_password: { en: "Show password", ta: "கடவுச்சொல்லைக் காட்டு" },
  hide_password: { en: "Hide password", ta: "கடவுச்சொல்லை மறை" },
  forgot_password: { en: "Forgot password?", ta: "கடவுச்சொல் மறந்துவிட்டதா?" },
  label_confirm: { en: "Confirm password", ta: "கடவுச்சொல்லை உறுதிப்படுத்து" },
  label_confirm_new: { en: "Confirm new password", ta: "புதிய கடவுச்சொல்லை உறுதிப்படுத்து" },
  placeholder_confirm: { en: "Repeat your password", ta: "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்" },
  error_confirm_mismatch: { en: "Passwords do not match", ta: "கடவுச்சொற்கள் பொருந்தவில்லை" },
  show_confirm: { en: "Show confirm password", ta: "உறுதிப்படுத்தும் கடவுச்சொல்லைக் காட்டு" },
  hide_confirm: { en: "Hide confirm password", ta: "உறுதிப்படுத்தும் கடவுச்சொல்லை மறை" },

  // ── Submit + navigation
  submit_loading: { en: "Please wait…", ta: "காத்திருக்கவும்…" },
  submit_sign_in: { en: "Sign in", ta: "உள்நுழைக" },
  submit_create: { en: "Create account", ta: "கணக்கு உருவாக்கு" },
  submit_update_password: { en: "Update password", ta: "கடவுச்சொல்லைப் புதுப்பி" },
  submit_send_reset: { en: "Send reset link", ta: "மீட்டமைப்பு இணைப்பை அனுப்பு" },
  back_to_sign_in: { en: "← Back to sign in", ta: "← உள்நுழைவுக்குத் திரும்பு" },

  // ── Footer
  terms_prefix: { en: "By creating an account you agree to our", ta: "கணக்கை உருவாக்குவதன் மூலம் நீங்கள் ஏற்கும்" },
  terms_link: { en: "Terms", ta: "விதிமுறைகள்" },
  terms_and: { en: "and", ta: "மற்றும்" },
  privacy_link: { en: "Privacy Policy", ta: "தனியுரிமைக் கொள்கை" },
  footer_no_account: { en: "No account?", ta: "கணக்கு இல்லையா?" },
  footer_create_one: { en: "Create one", ta: "ஒன்றை உருவாக்குங்கள்" },
  footer_have_account: { en: "Already have an account?", ta: "ஏற்கனவே கணக்கு உள்ளதா?" },
  footer_sign_in: { en: "Sign in", ta: "உள்நுழைக" },
  guest_chart_cta: {
    en: "Try a chart first — no account needed",
    ta: "முதலில் ஒரு ஜாதகம் பாருங்கள் — கணக்கு தேவையில்லை",
  },

  // ── Client-side error fallbacks
  error_oauth_failed: {
    en: "Google sign-in didn't complete. Please try again or use email instead.",
    ta: "Google உள்நுழைவு முடியவில்லை. மீண்டும் முயலவும், அல்லது மின்னஞ்சலைப் பயன்படுத்தவும்.",
  },
  error_password_short: { en: "Password must be at least 8 characters.", ta: "கடவுச்சொல் குறைந்தது 8 எழுத்துகள் இருக்க வேண்டும்." },
  error_password_mismatch: { en: "Passwords do not match.", ta: "கடவுச்சொற்கள் பொருந்தவில்லை." },
  error_reset_link_invalid: { en: "This reset link is invalid or has expired.", ta: "இந்த மீட்டமைப்பு இணைப்பு செல்லாதது அல்லது காலாவதியானது." },
  error_email_required: { en: "Enter a valid email address.", ta: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்." },
  error_create_failed: { en: "Unable to create account.", ta: "கணக்கை உருவாக்க முடியவில்லை." },
  error_credentials: { en: "Incorrect email or password.", ta: "மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு." },
  error_reset_failed: { en: "Unable to process reset request.", ta: "மீட்டமைப்பு கோரிக்கையைச் செயல்படுத்த முடியவில்லை." },
  error_generic: { en: "Something went wrong. Please try again.", ta: "ஏதோ தவறு நடந்துவிட்டது. மீண்டும் முயலவும்." },
} as const;

export type LoginKey = keyof typeof LOGIN_STRINGS;

/** One user-visible login string, in the reader's language. */
export function lt(key: LoginKey, lang: Lang): string {
  return LOGIN_STRINGS[key][lang];
}

/**
 * The left panel's selling points.
 *
 * The first line names the method rather than gesturing at it. "Calculated with
 * an established traditional method" was the plain-language rewrite of
 * "Thirukanitham accuracy — Lahiri ayanamsa, Drik ephemeris", and it removed the
 * one fact a Tamil astrology reader checks before trusting a panchangam: whether
 * it is drik ganita (observed positions) or vakya (the older tabular method).
 * Those two disagree by days on festival dates, so it is not a technical
 * footnote — it is the product claim. Naming Thirukanitham and glossing it in
 * the same breath keeps both the specificity and the plain language.
 */
export const LEFT_PANEL_FEATURES: Array<{ en: string; ta: string }> = [
  {
    en: "Thirukanitham method — real calculated planet positions (drik ganita), Lahiri ayanamsa",
    ta: "திருக்கணித முறை — உண்மையில் கணிக்கப்பட்ட கிரக நிலைகள், லஹிரி அயனாம்சம்",
  },
  {
    en: "A plain-language guide to your day and your life periods",
    ta: "உங்கள் நாளையும் வாழ்க்கைக் காலங்களையும் எளிய மொழியில் அறியுங்கள்",
  },
  {
    en: "Understand your chart before you act on it",
    ta: "உங்கள் ஜாதகத்தைப் புரிந்துகொண்டு முடிவெடுங்கள்",
  },
  {
    en: "Optional traditional practices, with practical alternatives",
    ta: "விருப்பமான பாரம்பரிய நடைமுறைகள், நடைமுறை மாற்றுகளுடன்",
  },
];
