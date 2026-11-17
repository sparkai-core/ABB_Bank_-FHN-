/** Official instruments. Sample rates in this app are not these documents. */

export const SOURCES = [
  {
    id: "nk-390",
    priority: "P0",
    date: "2015-12-17",
    number: "390",
    title_az: "Nazirlər Kabinetinin 17 dekabr 2015-ci il tarixli 390 nömrəli Qərarı",
    title_en: "Cabinet of Ministers Decision No. 390 of 17 December 2015",
    name_az: "Dövlət vəsaitləri hesabına maliyyələşdirilən tikinti obyektləri üçün yeni smeta-normativ və qiymətqoyma sisteminin və resurs metodunun tətbiq edilməsi barədə",
    name_en: "On the new estimate-norm and pricing system and the resource method for state-funded construction",
    provides_az: "Resurs metodunun hüquqi əsası: cari qiymətlər, əmək tarifləri və FHN-in cari smeta qiymətləri toplularını hazırlamaq vəzifəsi. 9 yanvar 2021-ci il tarixli 4 nömrəli Qərar 1-ci və 4–7-ci hissələri ləğv edib.",
    provides_en: "Legal basis for resource-based pricing, current rates, and FHN’s duty to issue current estimate-price collections. Decision No. 4 of 9 January 2021 repealed parts 1 and 4–7.",
    href: "https://frameworks.e-qanun.az/31/c_f_31766.html",
  },
  {
    id: "arxkom-smeta",
    priority: "P0",
    date: "",
    number: "",
    title_az: "ARXKOM — Smeta normaları",
    title_en: "ARXKOM — Estimate norms",
    name_az: "Dövlət Şəhərsalma və Arxitektura Komitəsinin smeta normaları səhifəsi",
    name_en: "State Committee for Urban Planning and Architecture, estimate-norms page",
    provides_az: "Dərc olunmuş tikinti smeta normaları və qiymətqoyma topluları.",
    provides_en: "Published construction estimate norms and pricing-related collections.",
    href: "https://arxkom.gov.az/qanunvericilik/normativler/smeta-normalari",
  },
  {
    id: "catalogue",
    priority: "P0",
    date: "2026-01-01",
    number: "",
    title_az: "Qüvvədə olan şəhərsalma və tikintiyə dair normativ sənədlərin Siyahısı",
    title_en: "List of normative documents in force for urban planning and construction",
    name_az: "01.01.2026-cı il tarixinə olan məlumat. FHN və ARXKOM dərc edir.",
    name_en: "Status as of 1 January 2026. Published by FHN and ARXKOM.",
    provides_az: "Sənəd adları, normativ şifrələr və təsdiq məlumatı. Bölmə 4: smeta normaları (DESN).",
    provides_en: "Document titles, normative identifiers, and approval information. Section 4: estimate norms (DESN).",
    href: "https://fhn.gov.az/az/qanunvericilik/nazirliyin-texniki-normativ-huquqi-aktlari/azerbaycan-respublikasinda-quvvede-olan-sehersalma-ve-tikintiye-dair-normativ-senedlerin-siyahisi",
  },
  {
    id: "arxkom-norms",
    priority: "P1",
    date: "",
    number: "",
    title_az: "ARXKOM — Normativlər",
    title_en: "ARXKOM — Norms",
    name_az: "Şəhərsalma və tikinti normativlərinin ümumi səhifəsi",
    name_en: "Broader page of urban-planning and construction norms",
    provides_az: "Tikinti standartları və metodiki istinadlar.",
    provides_en: "Broader construction standards and methodological references.",
    href: "https://arxkom.gov.az/qanunvericilik/normativler",
  },
  {
    id: "nk-150",
    priority: "P1",
    date: "2021-05-25",
    number: "150",
    title_az: "Nazirlər Kabinetinin 25 may 2021-ci il tarixli 150 nömrəli Qərarı",
    title_en: "Cabinet of Ministers Decision No. 150 of 25 May 2021",
    name_az: "Resurs metodu ilə bağlı bəzi normativ hüquqi aktların təsdiq edilməsi haqqında",
    name_en: "On approval of certain normative acts for the resource method",
    provides_az: "Üstəlik xərc və smeta gəliri əməkhaqqı fonduna tətbiq olunur: tikinti 90% və 52%, təmir 80% və 40%, buraxılış-sazlama 55% və 32%. 1 oktyabr 2021-ci ildən qüvvədədir. Qanunvericilik Toplusu, 2021, № 5, maddə 529.",
    provides_en: "Overhead and estimate profit apply to the wage fund: construction 90% and 52%, repair 80% and 40%, commissioning 55% and 32%. In force from 1 October 2021. Legislation Collection, 2021, No. 5, item 529.",
    href: "https://e-qanun.az/framework/47678",
  },
];

/** Annexes 1 and 2 of Decision No. 150. Applied to the wage fund. */
export const WAGE_RATES = [
  { work_az: "Tikinti-quraşdırma", work_en: "Construction and installation", overhead: 90, profit: 52 },
  { work_az: "Təmir-tikinti", work_en: "Repair", overhead: 80, profit: 40 },
  { work_az: "Buraxılış-sazlama", work_en: "Commissioning", overhead: 55, profit: 32 },
  { work_az: "Təmir-bərpa", work_en: "Restoration", overhead: 90, profit: 52 },
];

/** Identifiers taken from the 01.01.2026 catalogue, section 4.1.1. Unit prices are not in that list. */
export const DESN = [
  {
    code: "DESN-91-02-01-2021-D1",
    title_az: "Torpaq işləri",
    title_en: "Earthworks",
    approval_az: "FHN, 7 iyun 2022, № 20/01-002",
    approval_en: "FHN, 7 June 2022, No. 20/01-002",
  },
  {
    code: "DESN-91-02-06-2021-D1",
    title_az: "Monolit beton və dəmir-beton konstruksiyaları",
    title_en: "Cast-in-situ concrete and reinforced concrete",
    approval_az: "FHN, 7 iyun 2022, № 20/01-002",
    approval_en: "FHN, 7 June 2022, No. 20/01-002",
  },
  {
    code: "DESN-91-02-08-2021-D1",
    title_az: "Kərpic və blokdan konstruksiyalar",
    title_en: "Brick and block structures",
    approval_az: "FHN, 7 iyun 2022, № 20/01-002",
    approval_en: "FHN, 7 June 2022, No. 20/01-002",
  },
];
