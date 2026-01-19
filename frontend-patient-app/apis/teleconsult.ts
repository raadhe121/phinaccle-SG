import { apiUrl } from "@/Config";
import { get, getHeaders, onErrorCallback } from "./index";

// Set the key-value pairs for the different languages you want to support.
type Translations = {
  [key: string]: any;
};

export const langOrder = ["en", "cn", "ta", "hi", "bn"];

// TODO: Convert clinics into APIs to prevent it from being hardcoded
export const clinics = [
  'Pinnacle Family Clinic (River Valley)',
  'Pinnacle Family Clinic (Compassvale)',
  'Pinnacle Family Clinic (Woodlands)',
  'Pinnacle Family Clinic (Buangkok Square)',
  'Pinnacle Family Clinic (Serangoon North)',
  'Pinnacle Family Clinic (Pasir Ris)',
  'Pinnacle Family Clinic (Yew Tee)',
  'Pinnacle Family Clinic (NorthShore Plaza 1)',
  'Pinnacle Family Clinic (Sembawang)',
  'Pinnacle Family Clinic (Dakota)',
  'Pinnacle Family Clinic (Hougang)',
  'Pinnacle Family Clinic (Changi North)',
  'Pinnacle Family Clinic (DUO Galleria)',
  'Pinnacle Family Clinic (Dairy Farm)',
  'Pinnacle Family Clinic (Clementi)',
  'Pinnacle Family Clinic (Sengkang)',
  'Pinnacle Family Clinic (Tampines North)',
  'Pinnacle Family Clinic (Pioneer MRT)',
  'Pinnacle Family Clinic (Tengah)',
  'Pinnacle Family Clinic (Yishun)',
  'Pinnacle Medical Centre (Raffles Place)'
  ].join('\n')

export const teleconsultTranslations: Translations = {
  en: {
    telemedicine: "Telemedicine",
    continue: "Continue",
    tnc_agree: "I agree to the terms and conditions",
    tnc: `
1. Please allow 10 minutes for the clinic to respond to your Tele Medicine request.
2. A notification will be sent to you once the clinic has responded to your request.
3. Service Charges: PCP @ $2 (Zone F only)
        `.trim(),
    tnc_notes: `
You need to allow camera, microphone and notification access for telemedicine.\n
For first-time consultation, please prepare your ID for verification.\n
Find out about our telemedicine in the FAQs.

*The licensee name will be displayed according to the clinic you select. Please click for the providers under Pinnacle Family Clinic.
        `.trim(),
    tnc_providers: `List of Providers`,
    tnc_assistance: `For assistance, please call us at`,
    tnc_email: ` or email`,
    tnc_disclaimer: `
Telemedicine is designed to manage non-emergency medical issues. Telemedicine should not be used in the case of a healthcare emergency. In such cases, please go to the Accident & Emergency department of the nearest hospital or call 995 immediately.
        `.trim(),
  },
  cn: {
    telemedicine: "视频医疗",
    continue: "继续",
    tnc_agree: "我同意这条款和条件",
    tnc: `
1. 诊所约需10分钟的时间来处理您的远程医疗请求。
2. 一旦诊所回应了您的请求，就会发送一则通知。
3. 服务收费: PCP @$2 (仅限F区)
        `.trim(),
    tnc_notes: `
您需要允许摄像头、麦克风和通知访问远程医疗。\n
首次咨询时，请准备好您的身份证件以供验证。\n
在常见问题解答中了解我们的远程医疗。

*持牌人名称将根据您选择的诊所显示。请点击 Pinnacle Family Clinic 下方的提供商列表。
        `.trim(),
    tnc_providers: `提供商列表`,
    tnc_assistance: `如需帮助，请致电`,
    tnc_email: ` 或发送电子邮件`,
    tnc_disclaimer: `
远程医疗旨在处理非紧急医疗问题。在出现医疗紧急情况时，不应使用远程医疗。在这种情况下，请立即前往最近医院的急诊科或拨打 995。
        `.trim(),
  },
  ta: {
    // tamil
    telemedicine: "டெலிமெடிசின்",
    continue: "தொடரவும்",
    tnc_agree: "நான் விதிகள் மற்றும் நிபந்தனைகளை ஒப்புக்கொள்கிறேன்",
    tnc: `
1. உங்கள் தொலை மருத்துவக் கோரிக்கைக்குப் பதிலளிக்க சிகிச்சையகப் பதி 10 நிமிடங்கள் அனுமதிக்கவும்.
2. உங்கள் கோரிக்கைக்கு சிகிச்சையகம் பதிலளித்தவுடன் உங்களுக்கு அறிவிப்பு அனுப்பப்படும்.
3. சேவைக் கட்டணங்கள்: PCP @ $2 (மண்டலம் F மட்டும்)
        `.trim(),
    tnc_notes: `
டெலிமெடிசினுக்கான கேமரா, மைக்ரோஃபோன் மற்றும் அறிவிப்பு அணுகலை நீங்கள் அனுமதிக்க வேண்டும்.\n
முதல் முறை ஆலோசனைக்கு, சரிபார்ப்பிற்காக உங்கள் ஐடியைத் தயார் செய்யவும்.\n
அடிக்கடி கேட்கப்படும் கேள்விகளில் எங்கள் டெலிமெடிசின் பற்றி அறியவும்.

*நீங்கள் தேர்ந்தெடுக்கும் மருத்துவமனையைப் பொறுத்து உரிமதாரரின் பெயர் காட்டப்படும் Pinnacle Family Clinic என்பதன் கீழ் வழங்குநர்களைக் கிளிக் செய்யவும்.
        `.trim(),
    tnc_providers: `வழங்குநர்களின் பட்டியல்`,
    tnc_assistance: `உதவிக்கு, தயவுசெய்து எங்களை இங்கு அழைக்கவும்`,
    tnc_email: `அல்லது மின்னஞ்சல்`,
    tnc_disclaimer: `
டெலிமெடிசின் அவசர மருத்துவச் சிக்கல்களை நிர்வகிக்க வடிவமைக்கப்பட்டுள்ளது. சுகாதார அவசரநிலையின் போது டெலிமெடிசின் பயன்படுத்தக்கூடாது. இதுபோன்ற சந்தர்ப்பங்களில், அருகில் உள்ள மருத்துவமனையின் விபத்து மற்றும் அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும் அல்லது 995 என்ற எண்ணை உடனடியாக அழைக்கவும்.
        `.trim(),
  },
  hi: {
    // hindi
    telemedicine: "सुदूर",
    continue: "जारी रखना",
    tnc_agree: "मैं नियमों और शर्तों से सहमत हूं",
    tnc: `
1. कृपया क्लिनिक को आपकी टेलीमेडिसिन रिक्वेस्ट का जवाब देने के लिए 10 मिनट का समय दें।
2. जब क्लिनिक आपकी रिक्वेस्ट का जवाब देगा, तो आपको एक नोटिफिकेशन भेजी जाएगी।
3. सेवा शुल्क: पीसीपी @ $2 (केवल ज़ोन एफ)
        `.trim(),
    tnc_notes: `
टेलीमेडिसिन के लिए आपको कैमरा, माइक्रोफ़ोन और नोटिफिकेशन एक्सेस की अनुमति देनी होगी।\n
पहली बार परामर्श के लिए, कृपया सत्यापन के लिए अपनी आईडी तैयार रखें।\n
अक्सर पूछे जाने वाले प्रश्नों में हमारी टेलीमेडिसिन के बारे में जानें।

*लाइसेंसधारी का नाम आपके द्वारा चुने गए क्लिनिक के अनुसार प्रदर्शित किया जाएगा। कृपया Pinnacle Family Clinic के अंतर्गत प्रदाताओं के लिए क्लिक करें।
        `.trim(),
    tnc_providers: `प्रदाताओं की सूची`,
    tnc_assistance: `सहायता के लिए कृपया हमें इस नंबर पर कॉल करें`,
    tnc_email: ` या ईमेल`,
    tnc_disclaimer: `
टेलीमेडिसिन को गैर-आपातकालीन चिकित्सा समस्याओं के प्रबंधन के लिए डिज़ाइन किया गया है। स्वास्थ्य सेवा संबंधी आपातकालीन स्थिति में टेलीमेडिसिन का उपयोग नहीं किया जाना चाहिए। ऐसे मामलों में, कृपया निकटतम अस्पताल के दुर्घटना एवं आपातकालीन विभाग में जाएँ या तुरंत 995 पर कॉल करें।
        `.trim(),
  },
  bn: {
    // bengali
    telemedicine: "টেলিমেডিসিন",
    continue: "চালিয়ে যান",
    tnc_agree: "আমি সর্তাবলিগুলোতে একমত",
    tnc: `
1. আপনার টেলিমেডিসিন অনুরোধে সাড়া দিতে অনুগ্রহ করে ক্লিনিককে 10 মিনিট সময় দিন।
2. ক্লিনিক আপনার অনুরোধে সাড়া দিলে আপনাকে নোটিফিকেশন পাঠানো হবে।
3. সার্ভিস চার্জ: PCP @ $2 (শুধু জোন F)
        `.trim(),
    tnc_notes: `
টেলিমেডিসিনের জন্য আপনাকে ক্যামেরা, মাইক্রোফোন এবং বিজ্ঞপ্তি অ্যাক্সেসের অনুমতি দিতে হবে।\n
প্রথমবার পরামর্শের জন্য, অনুগ্রহ করে যাচাইকরণের জন্য আপনার আইডি প্রস্তুত করুন।\n
প্রায়শই জিজ্ঞাসিত প্রশ্নাবলীতে আমাদের টেলিমেডিসিন সম্পর্কে জানুন।

*আপনার নির্বাচিত ক্লিনিক অনুসারে লাইসেন্সধারীর নাম প্রদর্শিত হবে। অনুগ্রহ করে Pinnacle Family Clinic এর অধীনে প্রদানকারীদের জন্য ক্লিক করুন।
        `.trim(),
    tnc_providers: `সরবরাহকারীদের তালিকা`,
    tnc_assistance: `সহায়তার জন্য, অনুগ্রহ করে আমাদের কল করুন`,
    tnc_email: ` অথবা ইমেল করুন`,
    tnc_disclaimer: `
টেলিমেডিসিন অ-জরুরী চিকিৎসা সমস্যাগুলি পরিচালনা করার জন্য ডিজাইন করা হয়েছে। স্বাস্থ্যসেবা জরুরি অবস্থায় টেলিমেডিসিন ব্যবহার করা উচিত নয়। এই ধরনের ক্ষেত্রে, অনুগ্রহ করে নিকটস্থ হাসপাতালের দুর্ঘটনা ও জরুরী বিভাগে যান বা অবিলম্বে 995 নম্বরে কল করুন।
        `.trim(),
  },
};

export async function fetchHtmlApi(
  { url }: { url: string },
  onError: onErrorCallback = () => {},
) {
  const resp = await get({
    url,
    onError,
  });

  return resp;
}

export async function getFullApiUrl(url: string) {
  let combinedUrl = `${apiUrl}${url}`;
  const headers = await getHeaders();

  return { url: combinedUrl, headers };
}
