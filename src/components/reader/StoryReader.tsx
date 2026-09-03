"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORY_CATEGORY_LABELS, type PreparedStory, type StoryIllustration } from "@/content/stories";
import CategoryChips from "@/components/stories/CategoryChips";
import { usePathname, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAutoTranslatedStory } from "@/hooks/useAutoTranslatedStory";
import type { TranslationLocale } from "@/lib/translation/locales";

const SAKTI_PROMPTS = [
  "sadar",
  "aktif",
  "kritis",
  "terbuka",
  "imersif",
] as const;
const REFLECTION_PROMPTS = ["aktif", "kritis", "terbuka", "imersif"] as const;

type SaktiKey = (typeof SAKTI_PROMPTS)[number];
type ReflectionState = Record<SaktiKey, string>;
type AffirmationState = Record<SaktiKey, Record<number, string>>;
interface AffirmationStatement {
  text: string;
  choices?: readonly string[];
}

const emptyReflection: ReflectionState = {
  sadar: "",
  aktif: "",
  kritis: "",
  terbuka: "",
  imersif: "",
};

const emptyAffirmations: AffirmationState = {
  sadar: {},
  aktif: {},
  kritis: {},
  terbuka: {},
  imersif: {},
};

const AMBIENT_AUDIO_SRC = "/assets/audio/ambient-reading.mp3";
const AFFIRMATION_BUTTONS = ["Setuju", "Siap", "Oke", "Bismillah"] as const;
const YES_NO_BUTTONS = ["Ya", "Tidak"] as const;
const READING_LANGUAGE_OPTIONS = [
  { locale: "id-ID", label: "Bahasa Indonesia", shortLabel: "Indonesia" },
  { locale: "ms-MY", label: "Bahasa Melayu Malaysia", shortLabel: "Melayu" },
] as const satisfies readonly {
  locale: TranslationLocale;
  label: string;
  shortLabel: string;
}[];
type ReadingLanguage = (typeof READING_LANGUAGE_OPTIONS)[number]["locale"];
const SAKTI_STAGE_LETTERS: Record<SaktiKey, string> = {
  sadar: "S",
  aktif: "A",
  kritis: "K",
  terbuka: "T",
  imersif: "I",
};
const UPPERCASE_READER_TITLES = new Set([
  "pasar-malam-di-dalam-kepalaku",
  "langit-yang-belajar-hujan",
]);

const INTERNAL_CONTEXT_LABELS: Record<string, string> = {
  anxiety_related: "menemukan ketenangan saat pikiran terasa ramai",
  depressive_related: "menemukan harapan ketika hari terasa berat",
  adhd_related: "menemukan cara belajar dan bergerak dengan lebih terarah",
  body_image_related: "menghargai diri dan mendengarkan tubuh dengan lembut",
  behavioral_related: "memilih langkah yang lebih bijak dalam berteman dan bertindak",
  psychosis_related: "mencari pegangan dan bantuan ketika pengalaman terasa membingungkan",
  substance_dependence_related: "mencari jalan pulang dan pegangan yang lebih sehat",
};

interface StoryAffirmationProfile {
  focus: string;
  anchor: string;
  support: string;
  step: string;
  message: string;
}

const STORY_AFFIRMATION_PROFILES: Record<string, StoryAffirmationProfile> = {
  "bintang-yang-tidak-hilang": {
    focus: "rasa takut saat pengalaman batin terasa sulit dijelaskan",
    anchor: "Eka, langit malam Bali, dan ketenangan Pak Ketut di halaman banjar",
    support: "keluarga, pendamping, dan orang dewasa tepercaya",
    step: "berani bercerita kepada orang yang aman dan tidak menghakimi",
    message: "tidak ada anak yang harus berjalan sendirian",
  },
  "cahaya-yang-selalu-ada": {
    focus: "belajar melihat nilai diri saat rasa tidak percaya diri datang",
    anchor: "cahaya yang tetap ada meskipun sempat terasa tertutup",
    support: "orang yang menghargai diri saya apa adanya",
    step: "berbicara kepada diri sendiri dengan lebih lembut",
    message: "cahaya diri tidak hilang hanya karena sedang redup",
  },
  "debu-yang-menari": {
    focus: "menemukan cara belajar saat pikiran dan tubuh terasa sulit diam",
    anchor: "debu yang bergerak pelan di ruang belajar",
    support: "guru, teman, dan keluarga yang membantu mengatur langkah",
    step: "membagi tugas menjadi bagian kecil yang bisa saya mulai",
    message: "gerak dan fokus bisa belajar berjalan bersama",
  },
  "layang-layang-di-atas-kerikil": {
    focus: "mengelola dorongan dan menjaga pertemanan saat keadaan terasa tidak mudah",
    anchor: "layang-layang yang tetap naik meski berangkat dari tanah berkerikil",
    support: "teman baik dan orang dewasa yang memberi arahan",
    step: "berhenti sebentar sebelum bereaksi",
    message: "arah yang baik bisa ditemukan meski jalan terasa tidak rata",
  },
  "pasar-malam-di-dalam-kepalaku": {
    focus: "menenangkan pikiran yang terasa ramai seperti pasar malam",
    anchor: "keramaian lampu, suara, dan langkah yang perlu dipelankan",
    support: "orang tepercaya yang membantu membuat suasana lebih tenang",
    step: "mengambil napas, memberi jeda, dan memilih satu hal yang bisa dilakukan",
    message: "keramaian di kepala bisa ditata pelan-pelan",
  },
  "satu-keping-sagu-untuk-berdua": {
    focus: "menghadapi tekanan dan menjaga pertemanan dengan hati yang jujur",
    anchor: "satu keping sagu yang dibagi sebagai tanda peduli",
    support: "sahabat, keluarga, dan pendamping yang mau mendengar",
    step: "meminta bantuan sebelum tekanan terasa terlalu berat",
    message: "berbagi beban membuat hati lebih kuat",
  },
  "hidup-di-dalam-ceritamu-sendiri": {
    focus: "memilih jalan yang lebih baik saat emosi dan pilihan terasa rumit",
    anchor: "kesadaran bahwa hidup sendiri juga punya alur yang bisa diperbaiki",
    support: "orang yang membantu saya melihat pilihan dengan lebih jernih",
    step: "memilih satu tindakan baik yang tidak merugikan diri dan orang lain",
    message: "saya boleh menulis ulang arah cerita hidup saya",
  },
  "warisan-tanpa-nama": {
    focus: "memahami pola lama dalam keluarga tanpa harus meneruskannya",
    anchor: "warisan tak terlihat yang bisa dikenali dan dipilih ulang",
    support: "keluarga, guru, atau pendamping yang membantu menjaga diri",
    step: "mengenali emosi sebelum membiarkannya mengatur tindakan",
    message: "tidak semua warisan harus dibawa terus",
  },
  "langit-yang-belajar-hujan": {
    focus: "menemukan harapan ketika perasaan sedih terasa seperti mendung panjang",
    anchor: "langit yang belajar menerima hujan tanpa kehilangan luasnya",
    support: "orang yang sabar menemani ketika hari terasa berat",
    step: "mengatakan dengan jujur ketika saya sedang tidak baik-baik saja",
    message: "hujan bukan akhir dari langit",
  },
  "nyala-yang-tidak-pernah-berkurang": {
    focus: "menjaga harapan dan harga diri saat semangat terasa kecil",
    anchor: "nyala kecil yang tetap ada walau tertiup banyak keadaan",
    support: "orang yang mengingatkan saya pada kekuatan diri",
    step: "merawat satu hal kecil yang membuat saya tetap bertahan",
    message: "nilai diri tidak berkurang saat saya sedang lelah",
  },
  "suara-yang-hanya-aku-dengar": {
    focus: "mencari pegangan saat ada pengalaman yang sulit dipahami sendiri",
    anchor: "suara yang membuat tokoh membutuhkan teman bicara yang aman",
    support: "keluarga, guru, konselor, atau tenaga profesional yang tepat",
    step: "menceritakan pengalaman yang membingungkan kepada orang tepercaya",
    message: "meminta bantuan adalah bentuk keberanian",
  },
  "tubuhku-bukan-musuhku": {
    focus: "mendengarkan tubuh dan memperlakukan diri dengan lebih penuh kasih",
    anchor: "tubuh yang perlu dipahami sebagai teman, bukan lawan",
    support: "orang yang tidak mengejek dan membantu saya merasa aman",
    step: "mengganti ucapan keras kepada diri dengan kalimat yang lebih lembut",
    message: "tubuh saya layak dirawat, bukan diperangi",
  },
  "suara-di-balai-muafakat": {
    focus: "berani menyampaikan suara di tengah rasa takut dinilai",
    anchor: "balai muafakat sebagai ruang untuk didengar bersama",
    support: "keluarga, guru, dan komunitas yang memberi tempat aman",
    step: "menyampaikan satu hal penting dengan tenang",
    message: "suara yang pelan tetap berharga",
  },
  "kabus-di-kaki-bukit": {
    focus: "mencari harapan ketika jalan hidup terasa berkabut",
    anchor: "kabus di kaki bukit yang perlahan membuka arah",
    support: "orang yang berjalan di samping saya saat arah belum jelas",
    step: "mengambil satu langkah kecil meski belum melihat semuanya",
    message: "arah bisa tampak sedikit demi sedikit",
  },
  "cermin-di-bilik-andam": {
    focus: "melihat diri dengan lebih lembut saat berhadapan dengan cermin dan penilaian",
    anchor: "bilik andam dan cermin yang mengajak tokoh mengenali diri",
    support: "orang yang melihat saya lebih dari penampilan luar",
    step: "menghargai satu hal baik dari diri saya hari ini",
    message: "diri saya lebih luas daripada bayangan di cermin",
  },
  "pintu-rumah-panjang": {
    focus: "memilih sikap yang menjaga hubungan dan rasa aman dalam komunitas",
    anchor: "pintu rumah panjang sebagai tempat masuk menuju kebersamaan",
    support: "keluarga rumah panjang dan orang yang dituakan dengan bijak",
    step: "memilih kata dan tindakan yang tidak melukai hubungan",
    message: "pintu yang baik terbuka lewat sikap yang bertanggung jawab",
  },
  "bunga-api-dalam-kepala-ammar": {
    focus: "mengatur pikiran yang meletup-letup agar tetap bisa belajar",
    anchor: "bunga api dalam kepala Ammar yang perlu diarahkan dengan lembut",
    support: "guru, keluarga, dan teman yang membantu membuat ritme belajar",
    step: "memilih jeda singkat sebelum kembali pada tugas",
    message: "energi besar bisa menjadi kekuatan ketika diberi arah",
  },
  "ruang-di-bawah-bumbung-rumah-panjang": {
    focus: "menemukan ruang aman saat pengalaman terasa membingungkan",
    anchor: "ruang di bawah bumbung rumah panjang yang memberi rasa ditemani",
    support: "keluarga, pendamping, dan orang dewasa yang bisa dipercaya",
    step: "mencari ruang aman dan menceritakan hal yang membuat bingung",
    message: "ada tempat untuk berteduh saat pikiran terasa berat",
  },
  "jalan-pulang-ke-rumah-panjang": {
    focus: "mencari jalan pulang dari kebiasaan yang menjauhkan diri dari rasa aman",
    anchor: "jalan pulang menuju rumah panjang dan orang-orang yang menunggu dengan harapan",
    support: "keluarga, pendamping, dan bantuan yang menjaga langkah pemulihan",
    step: "memilih satu langkah pulang yang lebih sehat hari ini",
    message: "pulang bisa dimulai dari satu keputusan kecil",
  },
};

const STORY_STAGE_PROMPT_OVERRIDES: Record<string, Partial<Record<SaktiKey, string>>> = {
  "bintang-yang-tidak-hilang": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Eka, di sini:",
    kritis:
      "Jika saya menjadi Eka, perasaan penting yang ingin saya sampaikan kepada Pak Ketut atau orang tua saya adalah:",
    terbuka:
      "Jika saya mengalami hal yang membuat bingung atau takut seperti Eka, saya boleh meminta bantuan kepada orang yang aman, misalnya:",
    imersif:
      "Kepada Eka, saya ingin menyatakan bahwa dia tidak sendirian dan saya ingin menunjukkan dukungan saya, yaitu:",
  },
  "cahaya-yang-selalu-ada": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Rara, di sini:",
    kritis:
      "Jika saya menjadi Rara, perasaan penting yang ingin saya sampaikan kepada Nene Bua, Mama, atau Bu Dina adalah:",
    terbuka:
      "Jika saya berdiri di depan cermin seperti Rara, saya boleh memilih cara yang lebih membahagikan untuk melihat diri saya sendiri, misalnya…",
    imersif:
      "Kepada Rara, saya ingin menyatakan bahwa cahayanya tetap ada dan saya ingin memberi dukungan, yaitu:",
  },
  "debu-yang-menari": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Zaki, di sini:",
    kritis:
      "Jika saya menjadi Zaki, perasaan penting yang ingin saya sampaikan kepada Angku Sutan atau Kak Rian adalah:",
    terbuka:
      "Jika pikiran saya bergerak cepat seperti Zaki, saya boleh mencari akar atau cara belajar yang membantu, misalnya:",
    imersif:
      "Kepada Zaki, saya ingin menyatakan bahwa caranya berpikir boleh diarahkan dengan baik dan saya ingin menyarankan:",
  },
  "layang-layang-di-atas-kerikil": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Surya, di sini:",
    kritis:
      "Jika saya menjadi Surya, perasaan penting yang ingin saya sampaikan kepada Bu Putu atau Dewa adalah:",
    terbuka:
      "Jika dorongan marah muncul tiba-tiba seperti Surya, saya boleh memilih jeda sebelum bereaksi, misalnya:",
    imersif:
      "Kepada Surya, saya ingin menyatakan bahwa dia bisa belajar mengarahkan layang-layangnya dan saya ingin memberi dukungan, yaitu:",
  },
  "pasar-malam-di-dalam-kepalaku": {
    sadar: "Setelah membaca judul, siswa melakukan Sadar dengan merespons pernyataan:",
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Dika, di sini:",
    kritis:
      "Jika saya menjadi Dika, perasaan penting yang ingin saya sampaikan kepada Pak Yusuf adalah:",
    terbuka:
      "Jika saya bertemu dengan Kak Nisa, saya boleh mengungkapkan cara yang berbeda untuk mengurangi rasa ramai di kepala atau overthinking saya, misalnya:",
    imersif:
      "Kepada Dika, saya ingin menyatakan bahwa dia tidak sendirian dan saya ingin menunjukkan pengertian serta dukungan saya, yaitu:",
  },
  "satu-keping-sagu-untuk-berdua": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Kelana, di sini:",
    kritis:
      "Jika saya menjadi Kelana, perasaan penting yang ingin saya sampaikan kepada Bu Lena atau Rangga adalah:",
    terbuka:
      "Jika malam dan pikiran terasa berat seperti Kelana, saya boleh mencari teman yang dapat membantu memikul beban, misalnya:",
    imersif:
      "Kepada Kelana, saya ingin menyatakan bahwa dia tidak harus kuat sendirian dan saya ingin memberi dukungan, yaitu:",
  },
  "hidup-di-dalam-ceritamu-sendiri": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Nando, di sini:",
    kritis:
      "Jika saya menjadi Nando, perasaan penting yang ingin saya sampaikan kepada Rendra, Ibu, atau Pak Bagas adalah:",
    terbuka:
      "Jika saya sedang sangat marah seperti Nando, saya boleh berhenti sejenak dan masuk ke cerita orang lain, misalnya:",
    imersif:
      "Kepada Nando, saya ingin menyatakan bahwa dia bisa menulis ulang caranya bertindak dan saya ingin menyarankan:",
  },
  "warisan-tanpa-nama": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Bagas, di sini:",
    kritis:
      "Jika saya menjadi Bagas, perasaan penting yang ingin saya sampaikan kepada Pak Darmawan atau Ibu saya adalah:",
    terbuka:
      "Jika saya menyadari ada kebiasaan lama yang menyakiti diri atau orang lain, saya boleh memilih cara baru, misalnya:",
    imersif:
      "Kepada Bagas, saya ingin menyatakan bahwa tidak semua warisan harus diteruskan dan saya ingin memberi gagasan, yaitu:",
  },
  "langit-yang-belajar-hujan": {
    sadar: "Setelah membaca judul, siswa melakukan Sadar dengan cara merespons pernyataan:",
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman tokoh, di sini:",
    kritis:
      "Jika saya menjadi tokoh tersebut, perasaan penting yang ingin saya sampaikan kepada Rara, adalah:",
    terbuka:
      "Jika saya bertemu dengan Nenek saya boleh mengungkapkan cara untuk menyembuhkan permasalahan saya, misalnya:",
    imersif:
      "Kepada tokoh, saya ingin menyatakan bahwa dia tidak sendirian dan saya ingin menyampaikan bahwa langit pun punya cara menyembuhkan dirinya sendiri.",
  },
  "nyala-yang-tidak-pernah-berkurang": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman tokoh, di sini:",
    kritis:
      "Jika saya menjadi tokoh dalam cerita ini, perasaan penting yang ingin saya sampaikan kepada Bu Asih, Rendra, atau Sasi adalah:",
    terbuka:
      "Jika hari terasa kehilangan warna seperti tokoh dalam cerita, saya boleh menyalakan satu langkah kecil yang aman, misalnya:",
    imersif:
      "Kepada tokoh dalam cerita ini, saya ingin menyatakan bahwa nyalanya tidak berkurang dan saya ingin memberi dukungan, yaitu:",
  },
  "suara-yang-hanya-aku-dengar": {
    aktif: "Yang saya pahami dari masalah yang dihadapi Dimas adalah ...",
    kritis:
      "Jika saya menjadi Dimas, perasaan penting yang ingin saya sampaikan kepada Gilang, Bapak, atau Ibu adalah:",
    terbuka:
      "Jika ada pengalaman yang sulit saya pahami sendiri seperti Dimas, saya boleh bercerita kepada orang tepercaya, misalnya:",
    imersif:
      "Seperti Gilang, saya akan berkata kepada Dimas bahwa saya akan hadir mendampingi dengan tulus, maka yang saya katakana adalah...",
  },
  "tubuhku-bukan-musuhku": {
    aktif: "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman Tiara, di sini:",
    kritis:
      "Jika saya menjadi Tiara, perasaan penting yang ingin saya sampaikan kepada diri sendiri atau orang yang saya percaya adalah:",
    terbuka:
      "Jika saya mulai melihat tubuh sebagai musuh seperti Tiara, saya boleh memilih kalimat dan tindakan yang lebih menyayangi diri, misalnya:",
    imersif:
      "Kepada Tiara, saya ingin menyatakan bahwa tubuhnya layak dirawat dengan lembut dan saya ingin memberi dukungan, yaitu:",
  },
  "suara-di-balai-muafakat": {
    sadar: "",
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Siti, di sini:",
    kritis:
      "Ketika saya membaca cerita ini ada pengalaman Siti yang sangat bermanfaat untuk saya, yaitu:",
    terbuka:
      "Jika saya takut berbicara di depan orang ramai seperti Siti, saya akan berlatih dengan cara yang berbeda, misalnya",
    imersif:
      "Kepada Siti, saya ingin menyatakan bahwa kita tidak perlu cemas berlebihan ketika berbicara di hadapan banyak orang. Saya akan mengatakan:",
  },
  "kabus-di-kaki-bukit": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Ilyas, di sini:",
    kritis:
      "Ternyata ada bagian penting dari cerita ini yang perlu saya pahami untuk menjaga kesehatan mental saya, yaitu...",
    terbuka:
      "Jika saya menjadi Ilyas, perasaan penting yang ingin saya sampaikan kepada Buapak Karim atau Cikgu Faridah adalah:",
    imersif:
      "Dari pengalaman Ilyas saya akan akan siap menghadapi tantangan atau peristiwa yang mebuat cemas, misalnya dengan cara",
  },
  "cermin-di-bilik-andam": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Nurin, di sini:",
    kritis:
      "Bagian dari cerita ini yang memperkuat keyakinan saya untuk memperkuat kepercayaan diri saya, yaitu …",
    terbuka:
      "Jika saya menjadi Nurin, yang akan saya lakukan untuk melihat kesempurnaan tubuh saya secara berbeda, yaitu dengan cara…",
    imersif:
      "Saya boleh mengakui bahwa saya pun pernah merasa ada bagian tubuh saya yang kurang sempurna. Tetapi sekarang saya mensyukuri keadaan tubuh saya, yaitu dengan cara",
  },
  "pintu-rumah-panjang": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Zulkifli, di sini:",
    kritis:
      "Bagian yang paling penting dari cerita ini untuk memperbaiki diri saya adalah….",
    terbuka:
      "Saya ingin memahami solusi atas masalah yang dialami Zulkifli karena saya ingin hidup lebih bermakna. Dari cerita ini contoh solusi terbaik atas masalah yang dialami Zulkifli adalah …",
    imersif:
      "Kalau saya bertemu Zulkifli, saya ingin mengatakan bahwa saya pun akan merasa sangat berat ketika masalah dipikul sendiri. Akan tetapi, ada cara lain selain dengan marah yaitu",
  },
  "bunga-api-dalam-kepala-ammar": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Ammar, di sini:",
    kritis:
      "Jika saya memiliki teman seperti Ammar, maka saya akan menilainya sebagai teman yang….",
    terbuka:
      "Saya setuju bahwa tiada seorang pun yang layak dipandang rendah apabila caranya hidupnya berbeza, ini karena …",
    imersif:
      "Kalau saya berjumpa dengan Ammar, saya akan mengatakan bahwa saya pun merasa sangat risau ketika ada label \"suka mengganggu\" di dalam buku rekod disiplin.",
  },
  "ruang-di-bawah-bumbung-rumah-panjang": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Hakim, di sini:",
    kritis:
      "Bagian yang paling penting dari cerita ini untuk memperbaiki diri saya adalah….",
    terbuka:
      "Saya ingin memahami solusi atas masalah yang dialami Hakim karena saya ingin hidup lebih sehat bermakna. Dari cerita ini contoh solusi terbaik atas masalah yang dialami Hakim adalah …",
    imersif:
      "Kalau saya bertemu Hakim, saya akan mengatakan bahwa saya tidak memahami sepenuhnya semasa fikiran Hakim yang keliru dahulu. Tetapi saya akan mengatakan pula kita tidak akan memandang rendah orang yang sedang sakit, karena ….",
  },
  "jalan-pulang-ke-rumah-panjang": {
    aktif: "Saya ingin meluahkan perasaan yang sama dengan pengalaman Farid, di sini:",
    kritis:
      "Tok Ngah mengatakan bahwa \"hukuman yang paling baik untuk diri sendiri bukanlah yang menyakitkan, tapi yang paling memulihkan.\" Menurut saya, nasihat itu sangat baik karena …",
    terbuka:
      "Farid boleh menyatakan rasa syukurnya, yaitu \"Aku bersyukur karena masih dapat bangun pagi ini dan pergi ke sesi.\" Saya pun dapat menyatakan rasa syukur, yaitu ….",
    imersif:
      "Kalau saya bertemu Farid, saya ingin mengatakan bahwa saya pun akan merasa sangat sedih ketika orang-orang menjauh. Akan tetapi, kita tetap harus berusaha untuk pulih, sekecil apa pun, misalnya dengan cara …",
  },
};

const STORY_AFFIRMATION_OVERRIDES: Record<string, Partial<Record<SaktiKey, AffirmationStatement[]>>> = {
  "pasar-malam-di-dalam-kepalaku": {
    sadar: [
      {
        text: 'Saya akan membuka hati dan pikiran saya dengan tenang ketika membaca cerita "PASAR MALAM DI DALAM KEPALAKU".',
        choices: ["Setuju"],
      },
    ],
    aktif: [
      {
        text: "Ada bagian cerita yang mirip dengan pengalaman saya.",
        choices: YES_NO_BUTTONS,
      },
    ],
  },
  "langit-yang-belajar-hujan": {
    sadar: [
      {
        text: 'Saya akan membuka hati dan pikiran saya dengan tenang ketika membaca cerita "LANGIT YANG BELAJAR HUJAN".',
        choices: ["Setuju"],
      },
    ],
    aktif: [
      {
        text: "Ada bagian cerita yang mirip dengan pengalaman saya.",
        choices: YES_NO_BUTTONS,
      },
    ],
  },
  "suara-yang-hanya-aku-dengar": {
    sadar: [
      {
        text: 'Saya akan membuka hati dan pikiran saya dengan tenang ketika membaca cerita "SUARA YANG HANYA AKU DENGAR".',
        choices: ["Setuju"],
      },
    ],
    aktif: [
      {
        text: "Ada bagian cerita yang penting bagi kesadaran kesehatan mental saya.",
        choices: YES_NO_BUTTONS,
      },
    ],
  },
};

interface IllustrationPlacement {
  imageIndex: number;
  paragraphIndex: number;
  position?: "before" | "after";
}

const CUSTOM_ILLUSTRATION_PLACEMENTS: Record<string, IllustrationPlacement[]> = {
  "nyala-yang-tidak-pernah-berkurang": [
    { imageIndex: 1, paragraphIndex: 14 },
    { imageIndex: 2, paragraphIndex: 21 },
    { imageIndex: 0, paragraphIndex: 12, position: "after" },
  ],
  "hidup-di-dalam-ceritamu-sendiri": [
    { imageIndex: 0, paragraphIndex: 11 },
    { imageIndex: 1, paragraphIndex: 22 },
    { imageIndex: 2, paragraphIndex: 33 },
    { imageIndex: 3, paragraphIndex: 16, position: "after" },
    { imageIndex: 4, paragraphIndex: 49, position: "after" },
  ],
  "warisan-tanpa-nama": [
    { imageIndex: 0, paragraphIndex: 9 },
    { imageIndex: 2, paragraphIndex: 18 },
    { imageIndex: 3, paragraphIndex: 27 },
    { imageIndex: 1, paragraphIndex: 27, position: "after" },
  ],
  "bintang-yang-tidak-hilang": [
    { imageIndex: 3, paragraphIndex: 6 },
    { imageIndex: 1, paragraphIndex: 7 },
    { imageIndex: 4, paragraphIndex: 14 },
    { imageIndex: 0, paragraphIndex: 15 },
    { imageIndex: 8, paragraphIndex: 17 },
    { imageIndex: 6, paragraphIndex: 19 },
  ],
  "debu-yang-menari": [
    { imageIndex: 2, paragraphIndex: 1 },
    { imageIndex: 4, paragraphIndex: 4 },
    { imageIndex: 1, paragraphIndex: 7 },
    { imageIndex: 3, paragraphIndex: 13 },
    { imageIndex: 5, paragraphIndex: 18 },
    { imageIndex: 8, paragraphIndex: 27 },
  ],
  "layang-layang-di-atas-kerikil": [
    { imageIndex: 1, paragraphIndex: 19 },
    { imageIndex: 2, paragraphIndex: 20 },
    { imageIndex: 0, paragraphIndex: 22 },
    { imageIndex: 3, paragraphIndex: 25 },
    { imageIndex: 4, paragraphIndex: 27 },
  ],
  "pasar-malam-di-dalam-kepalaku": [
    { imageIndex: 8, paragraphIndex: 2 },
    { imageIndex: 4, paragraphIndex: 3 },
    { imageIndex: 9, paragraphIndex: 11 },
    { imageIndex: 11, paragraphIndex: 23 },
    { imageIndex: 1, paragraphIndex: 28 },
  ],
  "satu-keping-sagu-untuk-berdua": [
    { imageIndex: 2, paragraphIndex: 1 },
    { imageIndex: 1, paragraphIndex: 4 },
    { imageIndex: 3, paragraphIndex: 15 },
    { imageIndex: 4, paragraphIndex: 22 },
    { imageIndex: 6, paragraphIndex: 18 },
    { imageIndex: 8, paragraphIndex: 16, position: "after" },
    { imageIndex: 10, paragraphIndex: 2, position: "after" },
  ],
  "langit-yang-belajar-hujan": [
    { imageIndex: 0, paragraphIndex: 0 },
    { imageIndex: 2, paragraphIndex: 7 },
    { imageIndex: 9, paragraphIndex: 11 },
    { imageIndex: 5, paragraphIndex: 17 },
    { imageIndex: 4, paragraphIndex: 18 },
    { imageIndex: 1, paragraphIndex: 19 },
    { imageIndex: 7, paragraphIndex: 22 },
  ],
  "suara-yang-hanya-aku-dengar": [
    { imageIndex: 0, paragraphIndex: 2 },
    { imageIndex: 2, paragraphIndex: 18 },
    { imageIndex: 3, paragraphIndex: 21 },
  ],
  "tubuhku-bukan-musuhku": [
    { imageIndex: 2, paragraphIndex: 2 },
    { imageIndex: 3, paragraphIndex: 8 },
    { imageIndex: 6, paragraphIndex: 16 },
    { imageIndex: 9, paragraphIndex: 22 },
  ],
  "suara-di-balai-muafakat": [
    { imageIndex: 0, paragraphIndex: 0, position: "after" },
    { imageIndex: 1, paragraphIndex: 3 },
    { imageIndex: 2, paragraphIndex: 10 },
  ],
  "kabus-di-kaki-bukit": [
    { imageIndex: 3, paragraphIndex: 8 },
  ],
  "cermin-di-bilik-andam": [
    { imageIndex: 3, paragraphIndex: 3 },
    { imageIndex: 0, paragraphIndex: 4 },
    { imageIndex: 1, paragraphIndex: 6, position: "after" },
    { imageIndex: 6, paragraphIndex: 9 },
    { imageIndex: 2, paragraphIndex: 10 },
    { imageIndex: 4, paragraphIndex: 11 },
  ],
  "pintu-rumah-panjang": [
    { imageIndex: 4, paragraphIndex: 0 },
    { imageIndex: 3, paragraphIndex: 8 },
    { imageIndex: 2, paragraphIndex: 12 },
    { imageIndex: 5, paragraphIndex: 13 },
    { imageIndex: 7, paragraphIndex: 15 },
  ],
  "bunga-api-dalam-kepala-ammar": [
    { imageIndex: 3, paragraphIndex: 1 },
    { imageIndex: 2, paragraphIndex: 3 },
    { imageIndex: 10, paragraphIndex: 4 },
    { imageIndex: 11, paragraphIndex: 6 },
    { imageIndex: 4, paragraphIndex: 8 },
    { imageIndex: 0, paragraphIndex: 10 },
    { imageIndex: 8, paragraphIndex: 11 },
  ],
  "ruang-di-bawah-bumbung-rumah-panjang": [
    { imageIndex: 0, paragraphIndex: 2 },
    { imageIndex: 3, paragraphIndex: 4 },
    { imageIndex: 4, paragraphIndex: 10 },
    { imageIndex: 10, paragraphIndex: 12 },
    { imageIndex: 11, paragraphIndex: 13 },
  ],
  "jalan-pulang-ke-rumah-panjang": [
    { imageIndex: 5, paragraphIndex: 0 },
    { imageIndex: 0, paragraphIndex: 1 },
    { imageIndex: 2, paragraphIndex: 2 },
    { imageIndex: 4, paragraphIndex: 3 },
    { imageIndex: 6, paragraphIndex: 4 },
    { imageIndex: 1, paragraphIndex: 6 },
    { imageIndex: 3, paragraphIndex: 8 },
    { imageIndex: 7, paragraphIndex: 12 },
    { imageIndex: 8, paragraphIndex: 13 },
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getReadingKey(slug: string) {
  return `literaterapi:reading:${slug}`;
}

function getReflectionKey(slug: string) {
  return `literaterapi:reflection:${slug}`;
}

function getAffirmationKey(slug: string) {
  return `literaterapi:affirmation:${slug}`;
}

function getSadarConsentKey(slug: string) {
  return `literaterapi:sadar-consent:${slug}`;
}

function getRewardKey(slug: string, reward: string) {
  return `literaterapi:reward:${slug}:${reward}`;
}

function getStoryContext(story: PreparedStory) {
  const primaryCategory = story.publicCategorySlugs[0];
  const categoryLabel = primaryCategory ? STORY_CATEGORY_LABELS[primaryCategory] : undefined;
  return INTERNAL_CONTEXT_LABELS[story.internalCategory] ?? categoryLabel?.toLowerCase() ?? "memahami diri dengan lebih baik";
}

function getAffirmationProfile(story: PreparedStory): StoryAffirmationProfile {
  const fallbackContext = getStoryContext(story);

  return STORY_AFFIRMATION_PROFILES[story.slug] ?? {
    focus: fallbackContext,
    anchor: `pengalaman tokoh dalam "${story.title}"`,
    support: "orang tepercaya yang dapat mendengarkan dengan aman",
    step: "memilih satu langkah kecil yang baik untuk diri saya",
    message: "saya boleh tumbuh pelan-pelan dari cerita ini",
  };
}

function getDisplayStoryTitle(story: PreparedStory) {
  return UPPERCASE_READER_TITLES.has(story.slug)
    ? story.title.toLocaleUpperCase("id-ID")
    : story.title;
}

function getSaktiStageName(story: PreparedStory, stage: SaktiKey, fallback: string) {
  if (story.originalLanguage !== "ms-MY") return fallback;
  if (stage === "sadar") return "Sedar";
  return fallback;
}

function getReflectionPrompt(
  story: PreparedStory,
  stage: SaktiKey,
  sourceLanguage: TranslationLocale = story.originalLanguage,
) {
  const isSourceLanguageView = story.originalLanguage === sourceLanguage;
  const override = isSourceLanguageView ? STORY_STAGE_PROMPT_OVERRIDES[story.slug]?.[stage] : undefined;
  if (override) return override;

  const profile = getAffirmationProfile(story);
  const isMalayStory = story.originalLanguage === "ms-MY";

  if (stage === "sadar") {
    if (isMalayStory) {
      return "Selepas membaca tajuk, murid melakukan Sedar dengan cara memberikan respons terhadap pernyataan:";
    }
    return "Setelah membaca judul, siswa melakukan Sadar dengan cara merespons pernyataan:";
  }

  if (stage === "aktif") {
    if (isMalayStory) {
      return "Saya ingin meluahkan perasaan yang sama dengan pengalaman watak, di sini:";
    }
    return "Saya ingin mengungkapkan perasaan yang sama dengan pengalaman tokoh, di sini:";
  }

  if (stage === "kritis") {
    if (isMalayStory) {
      return "Jika saya berada di tempat watak tersebut, perasaan penting yang ingin saya sampaikan ialah:";
    }
    return "Jika saya menjadi tokoh tersebut, perasaan penting yang ingin saya sampaikan adalah:";
  }

  if (stage === "terbuka") {
    if (isMalayStory) {
      return `Jika saya bertemu dengan watak dalam cerita, saya boleh memilih cara yang berbeza untuk ${profile.step}, contohnya:`;
    }
    return `Jika saya bertemu dengan tokoh dalam cerita, saya boleh memilih cara yang berbeda untuk ${profile.step}, misalnya:`;
  }

  if (isMalayStory) {
    return `Kepada watak, saya ingin menyatakan bahawa dia tidak keseorangan dan saya ingin menyampaikan bahawa ${profile.message}.`;
  }
  return `Kepada tokoh, saya ingin menyatakan bahwa dia tidak sendirian dan saya ingin menyampaikan bahwa ${profile.message}.`;
}

function addIllustration(
  map: Map<number, StoryIllustration[]>,
  paragraphIndex: number,
  image: StoryIllustration,
) {
  const images = map.get(paragraphIndex) ?? [];
  images.push(image);
  map.set(paragraphIndex, images);
}

function getCustomImagePlacements(story: PreparedStory) {
  const rules = CUSTOM_ILLUSTRATION_PLACEMENTS[story.slug];
  const map = new Map<number, StoryIllustration[]>();
  if (!rules) return map;

  rules.forEach((rule) => {
    const image = story.illustrations[rule.imageIndex];
    if (!image) return;
    const paragraphIndex = rule.position === "after" ? rule.paragraphIndex + 1 : rule.paragraphIndex;
    addIllustration(map, paragraphIndex, image);
  });

  return map;
}

function getAutomaticImagePlacements(story: PreparedStory) {
  const map = new Map<number, StoryIllustration[]>();
  if (story.illustrations.length === 0) return map;

  const paragraphCount = story.paragraphs.length;
  const step = Math.max(2, Math.floor(paragraphCount / (story.illustrations.length + 1)));
  story.illustrations.forEach((image, index) => {
    const paragraphIndex = clamp((index + 1) * step, 1, paragraphCount - 1);
    addIllustration(map, paragraphIndex, image);
  });

  return map;
}

function getSaktiAffirmations(
  story: PreparedStory,
  stage: SaktiKey,
  sourceLanguage: TranslationLocale = story.originalLanguage,
): AffirmationStatement[] {
  const isSourceLanguageView = story.originalLanguage === sourceLanguage;
  const override = isSourceLanguageView ? STORY_AFFIRMATION_OVERRIDES[story.slug]?.[stage] : undefined;
  if (override) return override;

  if (stage === "sadar") {
    if (story.originalLanguage === "ms-MY") {
      return [
        {
          text: `Saya akan membuka hati dan fikiran saya dengan tenang ketika membaca cerita "${story.title.toLocaleUpperCase("ms-MY")}".`,
          choices: ["Setuju"],
        },
      ];
    }

    return [
      {
        text: `Saya akan membuka hati dan pikiran saya dengan tenang ketika membaca cerita "${story.title.toLocaleUpperCase("id-ID")}".`,
        choices: ["Setuju"],
      },
    ];
  }

  if (stage === "aktif") {
    return [
      {
        text:
          story.originalLanguage === "ms-MY"
            ? "Ada bahagian cerita yang mirip dengan pengalaman saya."
            : "Ada bagian cerita yang mirip dengan pengalaman saya.",
        choices: YES_NO_BUTTONS,
      },
    ];
  }

  return [];
}

export default function StoryReader({ story }: { story: PreparedStory }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeLocale = useLocale();
  const t = useTranslations("reader");
  const tSakti = useTranslations("sakti");
  const articleRef = useRef<HTMLElement | null>(null);
  const readingAudioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [reflection, setReflection] = useState<ReflectionState>(emptyReflection);
  const [affirmations, setAffirmations] = useState<AffirmationState>(emptyAffirmations);
  const [touchedReflectionStages, setTouchedReflectionStages] = useState<SaktiKey[]>([]);
  const [rewardToast, setRewardToast] = useState("");
  const [showFinishCelebration, setShowFinishCelebration] = useState(false);
  const [hasSadarConsent, setHasSadarConsent] = useState(false);
  const [isReadingMusicEnabled, setIsReadingMusicEnabled] = useState(true);
  const [isReadingMusicPlaying, setIsReadingMusicPlaying] = useState(false);
  const defaultReadingLanguage: ReadingLanguage = activeLocale === "ms-MY" ? "ms-MY" : "id-ID";
  const [readingLanguage, setReadingLanguage] = useState<ReadingLanguage>(defaultReadingLanguage);
  const {
    story: translatedStory,
    status: translationStatus,
    error: translationError,
    isTranslated,
  } = useAutoTranslatedStory(story, {
    includeParagraphs: true,
    targetLocale: readingLanguage,
  });
  const readerStory = useMemo(
    () => ({ ...translatedStory, originalLanguage: readingLanguage } satisfies PreparedStory),
    [translatedStory, readingLanguage],
  );
  const displayTitle = getDisplayStoryTitle(readerStory);
  const isMalayStory = readingLanguage === "ms-MY";
  const sadarStageName = getSaktiStageName(readerStory, "sadar", tSakti("sadar"));
  const sourceLanguage = story.originalLanguage;
  const sadarStatements = useMemo(
    () => getSaktiAffirmations(readerStory, "sadar", sourceLanguage),
    [readerStory, sourceLanguage],
  );
  const sadarPrompt = getReflectionPrompt(readerStory, "sadar", sourceLanguage);
  const selectedSadarStatements = sadarStatements.filter(
    (_, statementIndex) => affirmations.sadar[statementIndex],
  ).length;
  const canStartReading = selectedSadarStatements === sadarStatements.length;
  const displayedProgress = hasSadarConsent ? progress : 0;

  const imageByParagraph = useMemo(() => {
    const customPlacements = getCustomImagePlacements(readerStory);
    return customPlacements.size > 0 ? customPlacements : getAutomaticImagePlacements(readerStory);
  }, [readerStory]);

  useEffect(() => {
    setReadingLanguage(defaultReadingLanguage);
  }, [defaultReadingLanguage, story.slug]);

  function updateReadingLanguage(locale: ReadingLanguage) {
    setReadingLanguage(locale);
    router.replace(pathname, { locale });
  }

  useEffect(() => {
    const savedProgress = window.localStorage.getItem(getReadingKey(story.slug));
    if (savedProgress) {
      setProgress(clamp(Number(savedProgress) || 0, 0, 100));
    }

    const savedReflection = window.localStorage.getItem(getReflectionKey(story.slug));
    if (savedReflection) {
      try {
        const parsedReflection = { ...emptyReflection, ...JSON.parse(savedReflection) };
        setReflection(parsedReflection);
        if (parsedReflection.sadar.trim().length > 0) {
          setHasSadarConsent(true);
        }
      } catch {
        setReflection(emptyReflection);
      }
    }

    const savedAffirmations = window.localStorage.getItem(getAffirmationKey(story.slug));
    if (savedAffirmations) {
      try {
        setAffirmations({ ...emptyAffirmations, ...JSON.parse(savedAffirmations) });
      } catch {
        setAffirmations(emptyAffirmations);
      }
    }

    if (window.localStorage.getItem(getSadarConsentKey(story.slug)) === "1") {
      setHasSadarConsent(true);
    }
  }, [story.slug]);

  useEffect(() => {
    if (!hasSadarConsent) return;

    function updateProgress() {
      const article = articleRef.current;
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const read = -rect.top;
      const next = total <= 0 ? 100 : Math.round(clamp((read / total) * 100, 0, 100));

      setProgress((current) => {
        const maxProgress = Math.max(current, next);
        window.localStorage.setItem(getReadingKey(story.slug), String(maxProgress));
        return maxProgress;
      });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [hasSadarConsent, story.slug]);

  useEffect(() => {
    if (!hasSadarConsent) return;
    const milestones = [
      { value: 25, label: t("rewardProgress25") },
      { value: 50, label: t("rewardProgress50") },
      { value: 75, label: t("rewardProgress75") },
      { value: 100, label: t("rewardProgress100") },
    ];
    const milestone = milestones.findLast((item) => progress >= item.value);
    if (!milestone) return;

    const rewardKey = getRewardKey(story.slug, `progress-${milestone.value}`);
    if (window.localStorage.getItem(rewardKey)) return;

    window.localStorage.setItem(rewardKey, "1");
    setRewardToast(milestone.label);
  }, [hasSadarConsent, progress, story.slug, t]);

  useEffect(() => {
    if (!rewardToast) return;
    const timeoutId = window.setTimeout(() => setRewardToast(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [rewardToast]);

  useEffect(() => {
    if (!hasSadarConsent || !isReadingMusicEnabled || showFinishCelebration) {
      pauseReadingMusic();
      return;
    }

    void startReadingMusic();

    function startAfterUserGesture() {
      void startReadingMusic();
    }

    window.addEventListener("pointerdown", startAfterUserGesture, { once: true });
    window.addEventListener("keydown", startAfterUserGesture, { once: true });

    return () => {
      window.removeEventListener("pointerdown", startAfterUserGesture);
      window.removeEventListener("keydown", startAfterUserGesture);
    };
  }, [hasSadarConsent, isReadingMusicEnabled, showFinishCelebration]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        pauseReadingMusic();
      } else if (hasSadarConsent && isReadingMusicEnabled && !showFinishCelebration) {
        void startReadingMusic();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pauseReadingMusic();
    };
  }, [hasSadarConsent, isReadingMusicEnabled, showFinishCelebration]);

  const hasAktifResponse =
    Boolean(affirmations.aktif[0]) && reflection.aktif.trim().length > 0;
  const completedStages =
    (hasSadarConsent ? 1 : 0) +
    (hasAktifResponse ? 1 : 0) +
    ["kritis", "terbuka", "imersif"].filter(
      (key) => reflection[key as SaktiKey].trim().length > 0,
    ).length;
  const canFinish =
    hasSadarConsent &&
    hasAktifResponse &&
    ["kritis", "terbuka", "imersif"].every(
      (key) => reflection[key as SaktiKey].trim().length > 0,
    );

  const persistReadingProgress = useCallback(async (nextProgress: number) => {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reading_progress").upsert(
      {
        student_id: user.id,
        story_slug: story.slug,
        story_title: story.title,
        progress_percent: nextProgress,
        last_read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,story_slug" },
    );
  }, [story.slug, story.title]);

  useEffect(() => {
    if (!hasSadarConsent) return;
    if (progress <= 0) return;
    const timeoutId = window.setTimeout(async () => {
      await persistReadingProgress(progress);
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [hasSadarConsent, persistReadingProgress, progress]);

  useEffect(() => {
    const entries = Object.entries(reflection)
      .filter(([, value]) => value.trim().length > 0)
      .map(([stage, response]) => ({ stage, response }));
    const stagesToDelete = touchedReflectionStages.filter(
      (stage) => reflection[stage].trim().length === 0,
    );

    if (entries.length === 0 && stagesToDelete.length === 0) return;

    const timeoutId = window.setTimeout(async () => {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      if (entries.length > 0) {
        await supabase.from("reflection_entries").upsert(
          entries.map((entry) => ({
            student_id: user.id,
            story_slug: story.slug,
            story_title: story.title,
            stage: entry.stage,
            response: entry.response,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "student_id,story_slug,stage" },
        );
      }

      if (stagesToDelete.length > 0) {
        await supabase
          .from("reflection_entries")
          .delete()
          .eq("student_id", user.id)
          .eq("story_slug", story.slug)
          .in("stage", stagesToDelete);
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [reflection, story.slug, story.title, touchedReflectionStages]);

  function updateReflection(key: SaktiKey, value: string) {
    setTouchedReflectionStages((current) => (current.includes(key) ? current : [...current, key]));
    if (value.trim().length >= 12) {
      const rewardKey = getRewardKey(story.slug, `reflection-${key}`);
      if (!window.localStorage.getItem(rewardKey)) {
        window.localStorage.setItem(rewardKey, "1");
        setRewardToast(t("rewardReflectionSaved", { stage: tSakti(key) }));
      }
    }
    setReflection((current) => {
      const next = { ...current, [key]: value };
      window.localStorage.setItem(getReflectionKey(story.slug), JSON.stringify(next));
      return next;
    });
  }

  function selectAffirmation(stage: SaktiKey, statementIndex: number, choice: string) {
    setAffirmations((current) => {
      const next = {
        ...current,
        [stage]: {
          ...current[stage],
          [statementIndex]: choice,
        },
      };
      window.localStorage.setItem(getAffirmationKey(story.slug), JSON.stringify(next));
      return next;
    });
  }

  function startReadingAfterSadar() {
    if (!canStartReading) return;

    const selectedChoices = sadarStatements
      .map((statement, statementIndex) => {
        const choice = affirmations.sadar[statementIndex];
        return choice ? `${statement.text} (${choice})` : statement.text;
      })
      .join("\n");

    setTouchedReflectionStages((current) =>
      current.includes("sadar") ? current : [...current, "sadar"],
    );
    setReflection((current) => {
      const next = {
        ...current,
        sadar: selectedChoices,
      };
      window.localStorage.setItem(getReflectionKey(story.slug), JSON.stringify(next));
      return next;
    });
    window.localStorage.setItem(getSadarConsentKey(story.slug), "1");
    window.localStorage.setItem(getRewardKey(story.slug, "sadar"), "1");
    setRewardToast(t("rewardSadarComplete"));
    setHasSadarConsent(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  async function startReadingMusic() {
    const audio = readingAudioRef.current ?? new Audio(AMBIENT_AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.18;
    audio.preload = "auto";
    readingAudioRef.current = audio;

    try {
      await audio.play();
      setIsReadingMusicPlaying(true);
    } catch {
      setIsReadingMusicPlaying(false);
    }
  }

  function pauseReadingMusic() {
    const audio = readingAudioRef.current;
    if (!audio) return;
    audio.pause();
    setIsReadingMusicPlaying(false);
  }

  function toggleReadingMusic() {
    if (!hasSadarConsent) return;

    if (isReadingMusicEnabled && !isReadingMusicPlaying) {
      void startReadingMusic();
      return;
    }

    setIsReadingMusicEnabled((current) => {
      const next = !current;
      if (next) {
        void startReadingMusic();
      } else {
        pauseReadingMusic();
      }
      return next;
    });
  }

  async function finishStoryJourney() {
    if (!canFinish) return;
    pauseReadingMusic();
    setProgress(100);
    window.localStorage.setItem(getReadingKey(story.slug), "100");
    window.localStorage.setItem(getRewardKey(story.slug, "finish"), "1");
    await persistReadingProgress(100);
    setRewardToast("");
    setShowFinishCelebration(true);
  }

  function continueToRewards() {
    setShowFinishCelebration(false);
    router.push("/dashboard#level-hadiah");
  }

  return (
    <div className="min-h-screen bg-sakti-paper pb-[env(safe-area-inset-bottom)]">
      {showFinishCelebration ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("finishDialogLabel")}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-sakti-forestDark/72 px-3 py-6 backdrop-blur sm:px-4 sm:py-8"
        >
          <div className="sakti-celebration-card relative w-full max-w-lg overflow-hidden rounded-[1.25rem] border-[3px] border-sakti-gold bg-white p-5 text-center shadow-md sm:rounded-[1.75rem] sm:border-4 sm:p-8">
            <div className="sakti-rays absolute inset-0 opacity-35" aria-hidden="true" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sakti-forest font-display text-3xl font-black text-white shadow-md sm:h-20 sm:w-20 sm:text-4xl">
                S
              </div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-sakti-gold">
                {t("finishEyebrow")}
              </p>
              <h2 className="mt-3 font-display text-4xl font-black leading-tight text-sakti-forestDark sm:text-6xl">
                Alhamdulillah
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-sakti-forestDark/75">
                {t("finishBody")}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-black text-sakti-forest">
                <span className="rounded-full bg-sakti-mist/60 px-3 py-2">+50 XP</span>
                <span className="rounded-full bg-sakti-mist/60 px-3 py-2">{t("finishStages")}</span>
                <span className="rounded-full bg-sakti-mist/60 px-3 py-2">100%</span>
              </div>
              <button
                type="button"
                onClick={continueToRewards}
                className="tap-target mt-7 w-full rounded-full bg-sakti-forest px-5 py-3 text-sm font-black text-white shadow-sm sm:w-auto"
              >
                {t("continueToRewards")}
              </button>
            </div>
            {Array.from({ length: 18 }).map((_, index) => (
              <span
                key={index}
                aria-hidden="true"
                className="sakti-confetti absolute h-3 w-2 rounded-sm bg-sakti-gold"
                style={{
                  left: `${8 + ((index * 17) % 84)}%`,
                  animationDelay: `${index * 0.08}s`,
                  transform: `rotate(${index * 22}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      ) : null}
      {rewardToast ? (
        <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm rounded-sakti border border-sakti-gold/50 bg-white p-4 text-center text-sm font-black text-sakti-forestDark shadow-md sm:inset-x-4">
          <p className="text-xs uppercase tracking-wide text-sakti-gold">{t("rewardTitle")}</p>
          <p className="mt-1">{rewardToast}</p>
        </div>
      ) : null}
      <div className="sticky top-0 z-10 border-b border-sakti-mist bg-sakti-paper/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-3 text-sm text-sakti-forestDark/75">
            <span className="hidden sm:inline">{t("progressSaved")}</span>
            <span className="text-xs font-black uppercase tracking-wide text-sakti-gold sm:hidden">
              {t("progressShort")}
            </span>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <button
                type="button"
                onClick={toggleReadingMusic}
                disabled={!hasSadarConsent}
                className="tap-target rounded-full border border-sakti-mist bg-white px-3 py-1.5 text-xs font-black text-sakti-forestDark shadow-sm transition hover:border-sakti-forest disabled:cursor-not-allowed disabled:text-sakti-forestDark/45"
              >
                {!hasSadarConsent
                  ? t("musicAfterStart")
                  : isReadingMusicPlaying
                    ? t("musicActive")
                    : isReadingMusicEnabled
                      ? t("musicTurnOn")
                      : t("musicOff")}
              </button>
              <span className="shrink-0 font-semibold text-sakti-forest">{displayedProgress}%</span>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sakti-mist">
            <div
              className="h-full rounded-full bg-sakti-forest transition-all"
              style={{ width: `${displayedProgress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-3 py-5 sm:px-6 sm:py-8">
        <header className="pb-6 sm:pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sakti-gold sm:text-xs">
            {story.originCountry} - {t("readingMinutes", { count: story.readingEstimateMinutes })}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-sakti-forestDark sm:mt-3 sm:text-5xl">
            {displayTitle}
          </h1>
          {readerStory.subtitle && (
            <p className="mt-3 text-base leading-7 text-sakti-forestDark/75 sm:mt-4 sm:text-lg sm:leading-8">
              {readerStory.subtitle}
            </p>
          )}
          <div className="mt-5">
            <CategoryChips categories={readerStory.publicCategorySlugs} />
          </div>
          <section className="mt-5 rounded-xl border border-sakti-mist bg-white p-3 shadow-sm sm:rounded-sakti sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-sakti-gold">
                  {t("readingLanguageTitle")}
                </p>
                <p className="mt-1 text-sm leading-6 text-sakti-forestDark/72">
                  {t("readingLanguageBody")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {READING_LANGUAGE_OPTIONS.map((option) => {
                  const selected = readingLanguage === option.locale;

                  return (
                    <button
                      key={option.locale}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => updateReadingLanguage(option.locale)}
                      className={`tap-target rounded-full border px-4 py-2 text-sm font-black transition ${
                        selected
                          ? "border-sakti-forest bg-sakti-forest text-white shadow-sm"
                          : "border-sakti-mist bg-sakti-paper text-sakti-forestDark hover:border-sakti-forest"
                      }`}
                    >
                      {option.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            {translationStatus === "loading" ? (
              <p className="mt-3 rounded-full bg-sakti-mist/45 px-3 py-2 text-xs font-semibold text-sakti-forestDark/70">
                {t("translationLoadingTo", {
                  language: isMalayStory ? "Bahasa Melayu Malaysia" : "Bahasa Indonesia",
                })}
              </p>
            ) : null}
            {translationStatus === "static" ? (
              <p className="mt-3 rounded-full bg-sakti-gold/15 px-3 py-2 text-xs font-semibold text-sakti-forestDark/70">
                {t("translationUsingStatic")}
              </p>
            ) : isTranslated ? (
              <p className="mt-3 rounded-full bg-sakti-gold/15 px-3 py-2 text-xs font-semibold text-sakti-forestDark/70">
                {t("translationUsingAuto")}
              </p>
            ) : null}
            {translationStatus === "unconfigured" || translationStatus === "error" ? (
              <p className="mt-3 rounded-xl border border-sakti-gold/35 bg-sakti-gold/10 px-3 py-2 text-xs leading-5 text-sakti-forestDark/75">
                {t("translationUnavailable")} {translationError ? t("translationDetail", { error: translationError }) : null}
              </p>
            ) : null}
          </section>
          {readerStory.coverUrl && (
            <div className="relative mx-auto mt-5 aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border border-sakti-mist bg-sakti-paper sm:mt-8 sm:aspect-square sm:rounded-sakti">
              <Image
                src={readerStory.coverUrl}
                alt={t("coverAlt", { title: readerStory.title })}
                fill
                priority
                sizes="(min-width: 768px) 896px, 100vw"
                className="object-contain"
              />
            </div>
          )}
          <p className="mt-4 rounded-xl border border-sakti-mist bg-white p-3 text-sm leading-6 text-sakti-forestDark/75 sm:mt-5 sm:rounded-sakti sm:p-4">
            {t("progressClarification")}
          </p>
        </header>

        {!hasSadarConsent ? (
          <section className="rounded-[1rem] border-2 border-sakti-gold bg-white p-4 shadow-sm sm:rounded-[1.25rem] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sakti-gold sm:text-xs sm:tracking-[0.2em]">
                  {t("stageLabel", { letter: "S", stage: sadarStageName })}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-sakti-forestDark sm:text-3xl">
                  {t("sadarBeforeReading")}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-sakti-forestDark/75">
                  {t("sadarIntro")}
                </p>
                {sadarPrompt && (
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-sakti-forest">
                    {sadarPrompt}
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sakti-forest font-display text-2xl font-black text-white shadow-sm sm:h-14 sm:w-14 sm:text-3xl">
                S
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {sadarStatements.map((statement, statementIndex) => (
                <div
                  key={statement.text}
                  className="rounded-xl border border-sakti-mist bg-sakti-paper p-3 sm:rounded-sakti sm:p-4"
                >
                  <p className="text-sm font-semibold leading-6 text-sakti-forestDark">
                    {statementIndex + 1}. {statement.text}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {(statement.choices ?? AFFIRMATION_BUTTONS).map((choice) => {
                      const selected = affirmations.sadar[statementIndex] === choice;

                      return (
                        <button
                          key={choice}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectAffirmation("sadar", statementIndex, choice)}
                          className={`tap-target rounded-full border px-3 py-2 text-xs font-black transition ${
                            selected
                              ? "border-sakti-forest bg-sakti-forest text-white shadow-sm"
                              : "border-sakti-mist bg-white text-sakti-forestDark hover:border-sakti-forest"
                          }`}
                        >
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-sakti-mist bg-sakti-mist/30 p-3 text-sm leading-6 text-sakti-forestDark/75 sm:mt-6 sm:rounded-sakti sm:p-4">
              {t("safetyStop")}
            </div>

            <button
              type="button"
              onClick={startReadingAfterSadar}
              disabled={!canStartReading}
              className="tap-target mt-6 w-full rounded-full bg-sakti-forest px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-sakti-mist disabled:text-sakti-forestDark/55 sm:w-auto"
            >
              {t("startReadingAfterSadar")}
            </button>
          </section>
        ) : (
          <>
        <article ref={articleRef} className="reader-article space-y-5 text-[1rem] leading-8 text-sakti-forestDark sm:space-y-6 sm:text-lg sm:leading-9">
          {readerStory.paragraphs.map((paragraph, index) => {
            const images = imageByParagraph.get(index) ?? [];
            return (
              <div key={`${readerStory.slug}-${index}`} className="space-y-6">
                {images.map((image) => (
                  <figure key={image.src} className="-mx-1 sm:mx-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-sakti-mist bg-sakti-paper sm:aspect-[16/10] sm:rounded-sakti">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 768px) 896px, 100vw"
                        className="object-contain"
                      />
                    </div>
                  </figure>
                ))}
                <p>{paragraph}</p>
              </div>
            );
          })}
        </article>

        <section className="mt-10 border-t border-sakti-mist pt-8 sm:mt-14 sm:pt-10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sakti-gold sm:text-xs">
            {t("reflectionEyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-sakti-forestDark">
            {t("reflectionTitle")}
          </h2>
          <div className="mt-5 space-y-4 sm:mt-6 sm:space-y-5">
            {REFLECTION_PROMPTS.map((key) => {
              const statements = getSaktiAffirmations(readerStory, key, sourceLanguage);
              const prompt = getReflectionPrompt(readerStory, key, sourceLanguage);

              return (
                <article key={key} className="rounded-xl border border-sakti-mist bg-white p-4 sm:rounded-sakti">
                  <p className="text-sm font-semibold text-sakti-forest">
                    {t("stageLabel", {
                      letter: SAKTI_STAGE_LETTERS[key],
                      stage: getSaktiStageName(readerStory, key, tSakti(key)),
                    })}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-sakti-forestDark/75">
                    {prompt}
                  </p>

                  {statements.length > 0 ? (
                    <div className="mt-4 rounded-xl border border-sakti-gold/35 bg-sakti-gold/10 p-3 sm:rounded-sakti sm:p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-sakti-gold">
                        {t("responseChoices")}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-sakti-forestDark/70">
                        {t("responseChoicesBody")}
                      </p>
                      <div className="mt-3 space-y-4">
                        {statements.map((statement, statementIndex) => (
                          <div key={statement.text} className="rounded-xl bg-white/80 p-3">
                            <p className="text-sm font-semibold leading-6 text-sakti-forestDark">
                              {statementIndex + 1}. {statement.text}
                            </p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-4">
                              {(statement.choices ?? AFFIRMATION_BUTTONS).map((choice) => {
                                const selected = affirmations[key][statementIndex] === choice;

                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => selectAffirmation(key, statementIndex, choice)}
                                    className={`tap-target rounded-full border px-3 py-2 text-xs font-black transition ${
                                      selected
                                        ? "border-sakti-forest bg-sakti-forest text-white shadow-sm"
                                        : "border-sakti-mist bg-sakti-paper text-sakti-forestDark hover:border-sakti-forest"
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label
                    htmlFor={`reflection-${story.slug}-${key}`}
                    className="mt-4 block text-sm font-semibold text-sakti-forestDark"
                  >
                    {t("myReflectionNote")}
                  </label>
                  <textarea
                    id={`reflection-${story.slug}-${key}`}
                    value={reflection[key]}
                    onChange={(event) => updateReflection(key, event.target.value)}
                    rows={3}
                    className="mt-2 min-h-32 w-full rounded-xl border border-sakti-mist px-3 py-3 text-base leading-7 outline-none focus:border-sakti-forest sm:min-h-0 sm:rounded-sakti sm:py-2"
                  />
                </article>
              );
            })}
          </div>
          <div className="mt-7 rounded-xl border border-sakti-mist bg-white p-4 text-center shadow-sm sm:mt-8 sm:rounded-sakti sm:p-5">
            <p className="text-xs font-black uppercase tracking-wide text-sakti-gold">
              {t("finishSectionEyebrow")}
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
              {canFinish
                ? t("allStagesComplete")
                : t("stageCompletionCount", { completed: completedStages })}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sakti-forestDark/70">
              {t("finishInstruction")}
            </p>
            <button
              type="button"
              onClick={finishStoryJourney}
              disabled={!canFinish}
              className="tap-target mt-5 w-full rounded-full bg-sakti-forest px-6 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-sakti-mist disabled:text-sakti-forestDark/55 sm:w-auto"
            >
              {t("finishButton")}
            </button>
          </div>
        </section>
          </>
        )}
      </main>
    </div>
  );
}
