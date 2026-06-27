export interface LegalSection {
  heading: { ta: string; en: string };
  body: { ta: string; en: string };
}

export const PRIVACY_POLICY: {
  lastUpdated: string;
  sections: LegalSection[];
} = {
  lastUpdated: "2025-01-01",
  sections: [
    {
      heading: { en: "Information We Collect", ta: "நாங்கள் சேகரிக்கும் தகவல்கள்" },
      body: {
        en: "We collect information you provide directly to us when you create an account, such as your name, email address, birth date, birth time, and birth location. This information is used solely to generate your astrological chart and provide personalised guidance.",
        ta: "நீங்கள் கணக்கு உருவாக்கும்போது நேரடியாக வழங்கும் தகவல்களை நாங்கள் சேகரிக்கிறோம் — உங்கள் பெயர், மின்னஞ்சல் முகவரி, பிறந்த தேதி, பிறந்த நேரம் மற்றும் பிறந்த இடம். இந்த தகவல்கள் உங்கள் ஜாதகத்தை கணக்கிட மட்டுமே பயன்படுத்தப்படும்.",
      },
    },
    {
      heading: { en: "How We Use Your Information", ta: "உங்கள் தகவல்களை நாங்கள் எவ்வாறு பயன்படுத்துகிறோம்" },
      body: {
        en: "Your birth data is used exclusively to calculate your astrological chart using the Thirukanitham method and to provide you with personalised astrological guidance, daily scores, and predictions. We do not sell, rent, or share your personal information with third parties for marketing purposes.",
        ta: "உங்கள் பிறந்த விவரங்கள் திருக்கணித முறையில் ஜாதகம் கணக்கிட மட்டுமே பயன்படுத்தப்படும். தனிப்பயனாக்கப்பட்ட ஜோதிட வழிகாட்டல், தினசரி மதிப்பெண்கள் மற்றும் முன்னறிவிப்புகள் வழங்கவும் பயன்படுத்தப்படும். சந்தைப்படுத்தல் நோக்கங்களுக்காக உங்கள் தனிப்பட்ட தகவல்களை மூன்றாம் தரப்பினருக்கு விற்கவோ, வாடகைக்கு விடவோ, பகிரவோ மாட்டோம்.",
      },
    },
    {
      heading: { en: "Data Security", ta: "தரவு பாதுகாப்பு" },
      body: {
        en: "We take reasonable measures to protect your personal information from unauthorised access, use, or disclosure. Your data is encrypted in transit and at rest. Access to your data is restricted to authorised personnel only.",
        ta: "அங்கீகரிக்கப்படாத அணுகல், பயன்பாடு அல்லது வெளிப்படுத்தலில் இருந்து உங்கள் தனிப்பட்ட தகவல்களை பாதுகாக்க நாங்கள் நியாயமான நடவடிக்கைகளை எடுக்கிறோம். உங்கள் தரவு பரிமாற்றத்திலும் சேமிப்பிலும் குறியாக்கம் செய்யப்பட்டுள்ளது.",
      },
    },
    {
      heading: { en: "Your Rights", ta: "உங்கள் உரிமைகள்" },
      body: {
        en: "You have the right to access, update, or delete your personal information at any time. You can export your data, request corrections, or close your account by contacting us at support@vinaadi.app. We will respond to all requests within 30 days.",
        ta: "உங்கள் தனிப்பட்ட தகவல்களை எந்த நேரத்திலும் அணுக, புதுப்பிக்க அல்லது நீக்க உங்களுக்கு உரிமை உள்ளது. support@vinaadi.app என்ற முகவரியில் தொடர்பு கொள்வதன் மூலம் உங்கள் தரவை ஏற்றுமதி செய்யலாம், திருத்தங்களை கோரலாம் அல்லது உங்கள் கணக்கை மூடலாம்.",
      },
    },
    {
      heading: { en: "Cookies and Analytics", ta: "குக்கீகள் மற்றும் பகுப்பாய்வு" },
      body: {
        en: "We use anonymised analytics to understand how users interact with Vinaadi AI so we can improve the product. No personally identifiable information is included in analytics data. You can opt out of analytics at any time from the Settings screen.",
        ta: "பயனர்கள் Vinaadi AI உடன் எவ்வாறு தொடர்பு கொள்கிறார்கள் என்பதை புரிந்துகொள்ள நாங்கள் அனாமதேய பகுப்பாய்வைப் பயன்படுத்துகிறோம். பகுப்பாய்வு தரவில் தனிப்பட்ட முறையில் அடையாளம் காணக்கூடிய தகவல்கள் சேர்க்கப்படவில்லை.",
      },
    },
    {
      heading: { en: "Contact Us", ta: "தொடர்பு கொள்ளுங்கள்" },
      body: {
        en: "If you have questions about this Privacy Policy, please contact us at support@vinaadi.app or write to Vinaadi AI, Chennai, Tamil Nadu, India.",
        ta: "இந்த தனியுரிமைக் கொள்கையைப் பற்றி கேள்விகள் இருந்தால், support@vinaadi.app என்ற முகவரியில் எங்களை தொடர்பு கொள்ளுங்கள்.",
      },
    },
  ],
};

export const TERMS_OF_SERVICE: {
  lastUpdated: string;
  sections: LegalSection[];
} = {
  lastUpdated: "2025-01-01",
  sections: [
    {
      heading: { en: "Acceptance of Terms", ta: "விதிமுறைகளை ஒப்புதல்" },
      body: {
        en: "By accessing or using Vinaadi AI, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.",
        ta: "Vinaadi AI ஐ அணுகுவதன் மூலம் அல்லது பயன்படுத்துவதன் மூலம், இந்த சேவை விதிமுறைகள் மற்றும் எங்கள் தனியுரிமைக் கொள்கையால் கட்டுப்படுவதற்கு நீங்கள் ஒப்புக்கொள்கிறீர்கள்.",
      },
    },
    {
      heading: { en: "Astrological Guidance Disclaimer", ta: "ஜோதிட வழிகாட்டல் மறுப்பு" },
      body: {
        en: "Vinaadi AI provides astrological guidance for educational and entertainment purposes only. Astrological readings are not a substitute for professional advice in areas such as medicine, law, finance, or psychology. Decisions should not be made solely based on astrological guidance.",
        ta: "Vinaadi AI கல்வி மற்றும் பொழுதுபோக்கு நோக்கங்களுக்காக மட்டுமே ஜோதிட வழிகாட்டல் வழங்குகிறது. மருத்துவம், சட்டம், நிதி அல்லது உளவியல் போன்ற துறைகளில் தொழில்முறை ஆலோசனைக்கு ஜோதிட வாசிப்புகள் மாற்றாகாது.",
      },
    },
    {
      heading: { en: "User Accounts", ta: "பயனர் கணக்குகள்" },
      body: {
        en: "You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to terminate accounts that violate these terms.",
        ta: "உங்கள் கணக்கு மற்றும் கடவுச்சொல்லின் இரகசியத்தன்மையை பராமரிக்க நீங்கள் பொறுப்பு. உங்கள் கணக்கின் அங்கீகரிக்கப்படாத பயன்பாட்டை உடனடியாக எங்களிடம் தெரிவிக்க ஒப்புக்கொள்கிறீர்கள்.",
      },
    },
    {
      heading: { en: "Prohibited Uses", ta: "தடைசெய்யப்பட்ட பயன்பாடுகள்" },
      body: {
        en: "You may not use Vinaadi AI to: scrape or extract astrological data for commercial purposes, impersonate other users, distribute malware, or engage in any activity that violates applicable law. Automated access without written permission is prohibited.",
        ta: "Vinaadi AI ஐ வணிக நோக்கங்களுக்காக ஜோதிட தரவை பிரித்தெடுக்க, மற்ற பயனர்களை ஆள்மாறாட்டம் செய்ய, தீம்பொருளை விநியோகிக்க அல்லது பொருந்தக்கூடிய சட்டத்தை மீறும் எந்த செயலிலும் ஈடுபட நீங்கள் பயன்படுத்த மாட்டீர்கள்.",
      },
    },
    {
      heading: { en: "Limitation of Liability", ta: "பொறுப்பு வரம்பு" },
      body: {
        en: "To the maximum extent permitted by law, Vinaadi AI and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service.",
        ta: "சட்டத்தால் அனுமதிக்கப்பட்ட அதிகபட்ச அளவிற்கு, Vinaadi AI மற்றும் அதன் படைப்பாளர்கள் உங்களின் சேவை பயன்பாட்டில் இருந்து எழும் எந்த மறைமுக, தற்செயல், சிறப்பு அல்லது தண்டனை சேதங்களுக்கும் பொறுப்பேற்க மாட்டார்கள்.",
      },
    },
    {
      heading: { en: "Changes to Terms", ta: "விதிமுறை மாற்றங்கள்" },
      body: {
        en: "We reserve the right to modify these terms at any time. Continued use of Vinaadi AI after changes are posted constitutes your acceptance of the revised terms. We will notify you of significant changes via email or in-app notification.",
        ta: "இந்த விதிமுறைகளை எந்த நேரத்திலும் மாற்றியமைக்கும் உரிமையை நாங்கள் கொண்டுள்ளோம். மாற்றங்கள் வெளியிடப்பட்ட பிறகு Vinaadi AI ஐ தொடர்ந்து பயன்படுத்துவது திருத்தப்பட்ட விதிமுறைகளை ஏற்றுக்கொள்வதாகும்.",
      },
    },
    {
      heading: { en: "Contact", ta: "தொடர்பு" },
      body: {
        en: "For questions about these Terms of Service, contact us at support@vinaadi.app.",
        ta: "இந்த சேவை விதிமுறைகளைப் பற்றிய கேள்விகளுக்கு, support@vinaadi.app என்ற முகவரியில் எங்களை தொடர்பு கொள்ளுங்கள்.",
      },
    },
  ],
};
