export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MindGuide AI";
export const TIMEZONE = "Africa/Lagos";

export const CONCERNS = [
  "Anxiety",
  "Depression",
  "Stress",
  "Grief and loss",
  "Relationships",
  "Trauma",
  "Sleep problems",
  "Self-esteem",
  "Addiction",
  "Anger",
  "Other",
];

export const SUPPORT_AREAS = [
  "Managing emotions",
  "Work or school pressure",
  "Family issues",
  "Marriage and relationships",
  "Coping with loss",
  "Building confidence",
  "Life changes",
  "Parenting",
  "Healing from past experiences",
  "Other",
];

export const SPECIALTIES = [
  "Anxiety",
  "Depression",
  "Trauma and PTSD",
  "Grief",
  "Relationships and couples",
  "Family therapy",
  "Addiction",
  "Child and adolescent",
  "Stress and burnout",
  "Sleep",
];

export const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River",
  "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna",
  "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "Outside Nigeria",
];

export const EMOTIONAL_STATES: Record<number, string> = {
  1: "Very low",
  2: "Very low",
  3: "Low",
  4: "Low",
  5: "Okay",
  6: "Okay",
  7: "Good",
  8: "Good",
  9: "Very good",
  10: "Very good",
};

export type PlanKey = "basic" | "standard" | "premium" | "family";
export const PLANS: { key: PlanKey; name: string; price: number; envCode: string }[] = [
  { key: "basic", name: "Basic", price: 10000, envCode: "PAYSTACK_PLAN_BASIC" },
  { key: "standard", name: "Standard", price: 20000, envCode: "PAYSTACK_PLAN_STANDARD" },
  { key: "premium", name: "Premium", price: 30000, envCode: "PAYSTACK_PLAN_PREMIUM" },
  { key: "family", name: "Family", price: 50000, envCode: "PAYSTACK_PLAN_FAMILY" },
];

/** Community survey (Google Forms). Set NEXT_PUBLIC_SURVEY_URL to "off" to hide the survey banners. */
const SURVEY_ENV = process.env.NEXT_PUBLIC_SURVEY_URL;
export const SURVEY_URL =
  SURVEY_ENV === "off" ? "" : SURVEY_ENV || "https://docs.google.com/forms/d/e/1FAIpQLSevPLQiYlWHfj8DxhHI45aYNm275dfwyBQeoW8aJzsT_XghtQ/viewform";
