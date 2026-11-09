/**
 * Guided programmes: week-by-week psychoeducation and practice.
 * DRAFT CONTENT: each programme stays hidden from patients until an admin records the clinical reviewer
 * and publishes it (Admin → Programmes). To change the wording, edit this file.
 */
export type Week = {
  title: string;
  body: string[];
  practice: string[];
  reflect: string;
  tool?: { href: string; label: string };
};
export type Programme = {
  slug: string;
  title: string;
  summary: string;
  forWho: string;
  colour: string;
  weeks: Week[];
  safety: string;
};

export const PROGRAMMES: Programme[] = [
  {
    slug: "managing-anxiety",
    title: "Managing anxiety",
    summary: "Six weeks to understand anxiety, calm your body and loosen the grip of worry, using techniques from cognitive behavioural therapy (CBT).",
    forWho: "For anyone who worries a lot, feels tense or on edge, or has panicky moments.",
    colour: "from-[#0f7d74] to-[#2d2690]",
    safety: "If anxiety is stopping you from working, studying or leaving home, or you have chest pain or trouble breathing, please see a doctor as well as your therapist.",
    weeks: [
      {
        title: "Understanding anxiety",
        body: [
          "Anxiety is your body's alarm system. When it senses danger, it gets you ready to act: your heart beats faster, your breathing speeds up and your muscles tense. This is the 'fight, flight or freeze' response, and it has kept humans safe for a very long time.",
          "The problem is that the alarm can go off when there's no real danger, or stay on for too long. Then the same feelings that should protect you become exhausting.",
          "Anxiety is very common, and it is treatable. This week, the goal is simply to notice your anxiety with curiosity rather than fear.",
        ],
        practice: [
          "Each day, notice one moment you felt anxious. What was happening? What did you feel in your body?",
          "Rate how anxious you felt from 0 to 10.",
        ],
        reflect: "When I feel anxious, I notice it first in my body as…",
      },
      {
        title: "Calming your body",
        body: [
          "When the alarm goes off, slow breathing is one of the fastest ways to tell your body it is safe. Breathing out for longer than you breathe in activates the part of your nervous system that helps you rest.",
          "Like any skill, it works best when you practise while calm, so it's ready when you need it.",
        ],
        practice: [
          "Practise 'longer out-breath' breathing for 2 minutes, twice a day.",
          "Try it once in a moment when you feel tense, and notice what changes.",
        ],
        reflect: "After practising slow breathing this week, I noticed…",
        tool: { href: "/patient/library/breathing", label: "Open breathing exercise" },
      },
      {
        title: "Catching anxious thoughts",
        body: [
          "Anxiety often comes with 'what if' thoughts: what if I fail, what if something bad happens. These thoughts can feel like facts, but they are predictions.",
          "Common thinking traps include expecting the worst (catastrophising), assuming you know what others think (mind-reading), and treating a feeling as proof ('I feel scared, so it must be dangerous').",
        ],
        practice: [
          "Write down two anxious thoughts this week, and name the thinking trap, if there is one.",
          "Ask yourself: 'What would I tell a friend who had this thought?'",
        ],
        reflect: "A 'what if' thought I keep having is… and a fairer way to see it is…",
        tool: { href: "/patient/library/thought-record", label: "Open thought record" },
      },
      {
        title: "Making worry smaller",
        body: [
          "Trying hard not to worry usually makes worry louder. A different approach is to give it a time and a place.",
          "'Worry time' is 15 minutes a day, at the same time, when you allow yourself to worry on paper. When worries pop up at other times, write a word to remind you and save them for worry time. Many people find their worries feel smaller by the time they get to them.",
          "During worry time, sort each worry: is it something I can act on? If yes, plan one small step. If not, practise letting it go.",
        ],
        practice: [
          "Choose a daily 15-minute worry time, not close to bedtime.",
          "Use it on at least four days this week.",
        ],
        reflect: "The worry that took up most of my time this week was… and when I looked at it during worry time, I found…",
      },
      {
        title: "Facing fears, step by step",
        body: [
          "Avoiding what makes us anxious brings relief in the short term, but it teaches the brain the thing really was dangerous, so the fear grows.",
          "Gently and gradually facing a fear does the opposite. Make a 'ladder' of situations, from slightly uncomfortable to very hard. Start at the bottom and stay in the situation until your anxiety starts to drop. Then move up a step.",
          "Go at your own pace. Your therapist can help you plan your ladder.",
        ],
        practice: [
          "Write a ladder of 5 to 8 steps for one thing you avoid.",
          "Try the first step at least twice this week.",
        ],
        reflect: "When I tried the first step on my ladder, I expected… and what actually happened was…",
      },
      {
        title: "Keeping well",
        body: [
          "Well done for reaching the final week. Anxiety may still come and go, and that's normal. What changes is how you respond to it.",
          "Look back at what helped most. Sleep, movement, time with people you trust, and limiting caffeine and alcohol all make a difference to anxiety.",
          "Make a simple plan for difficult days: early warning signs, what helps, and who you can talk to.",
        ],
        practice: [
          "Write your 'keeping well' plan: three warning signs, three things that help, and two people you can contact.",
          "Share your plan with your therapist at your next session.",
        ],
        reflect: "The most useful thing I learned about my anxiety is…",
      },
    ],
  },
  {
    slug: "after-birth",
    title: "Mothers' wellbeing after birth",
    summary: "Six weeks of support for the emotional ups and downs after having a baby, including how to tell the baby blues from postpartum depression and when to get help.",
    forWho: "For mothers in the first year after birth, and for partners and family who want to support them.",
    colour: "from-[#9b1f86] to-[#2d2690]",
    safety: "If you have thoughts of harming yourself or your baby, feel confused, see or hear things others don't, or can't sleep at all even when the baby sleeps, this is an emergency. Call 112 or go to a hospital now. These can be signs of postpartum psychosis, which is rare but treatable.",
    weeks: [
      {
        title: "Baby blues or something more?",
        body: [
          "In the first two weeks after birth, many mothers feel tearful, irritable or overwhelmed. These 'baby blues' are common and usually pass on their own within about two weeks.",
          "Postpartum depression is different. It lasts longer than two weeks and can include feeling low most of the day, losing interest in things, feeling hopeless or guilty, not bonding with the baby, or struggling to cope. It can start any time in the first year.",
          "Postpartum depression is not a sign of weakness or of being a bad mother. It is a health condition, and it gets better with support and treatment.",
        ],
        practice: [
          "Each day, rate your mood from 1 to 10 and note one thing that made the day easier or harder.",
          "If low mood has lasted more than two weeks, tell your therapist or doctor.",
        ],
        reflect: "Since my baby arrived, the feeling I haven't told anyone about is…",
      },
      {
        title: "Looking after your body",
        body: [
          "Your body has been through a lot. Tiredness, pain, feeding and hormone changes all affect mood.",
          "Sleep is precious. When someone else can watch the baby, rest, even for 20 minutes. Eat regularly, drink water and get some daylight each day if you can.",
          "Your postnatal check-ups matter for your mind as well as your body. Tell your midwife or doctor how you are feeling emotionally.",
        ],
        practice: [
          "Choose one small act of care for your body each day: a shower, a proper meal, a short walk.",
          "Ask someone to give you one longer stretch of sleep this week.",
        ],
        reflect: "One thing my body needs that I keep putting off is…",
      },
      {
        title: "Letting others help",
        body: [
          "Many mothers feel they should manage everything alone. But raising a baby was never meant to be done alone.",
          "Family, friends, your partner, your church or mosque community can help with cooking, laundry, older children or holding the baby while you rest. People often want to help but don't know what to do, so be specific.",
          "It is also okay to set limits on visitors if they leave you more tired.",
        ],
        practice: [
          "Make a list of three tasks others could do for you.",
          "Ask one person for one of them this week.",
        ],
        reflect: "Asking for help feels hard for me because… and it would make a difference if…",
      },
      {
        title: "Kinder thoughts about yourself",
        body: [
          "Mothers often hear a harsh inner voice: 'I'm failing', 'Other mothers cope better', 'I should feel happier'. These thoughts are very common with postpartum depression, and they are not the truth.",
          "There is no perfect mother. A 'good enough' mother, who loves her baby and keeps trying, is exactly what a baby needs.",
          "Try noticing the critical thought and answering it as you would answer a friend.",
        ],
        practice: [
          "Write down one critical thought each day, and a kinder, truer reply.",
          "Notice one thing you did well for your baby each day, however small.",
        ],
        reflect: "If my best friend had just had a baby and felt like me, I would tell her…",
        tool: { href: "/patient/library/thought-record", label: "Open thought record" },
      },
      {
        title: "Connecting with your baby",
        body: [
          "Some mothers feel a rush of love straight away. Many don't, especially when they are low or exhausted. Bonding often grows slowly, through everyday moments.",
          "Skin-to-skin contact, talking or singing to your baby, and following their cues all help. You don't have to feel it fully yet to be doing it well.",
          "If you feel nothing at all, or have frightening thoughts about your baby, please tell your therapist. These experiences are more common than people say, and help is available.",
        ],
        practice: [
          "Spend 10 minutes a day in a calm moment with your baby: eye contact, talking, singing or skin-to-skin.",
          "Notice one small response from your baby each day.",
        ],
        reflect: "A small moment with my baby this week that I want to remember is…",
      },
      {
        title: "Your support plan",
        body: [
          "Recovery from postpartum depression often goes up and down. Having a plan makes the harder days easier to get through.",
          "Your plan can include early warning signs, things that help, people to call, and when to contact your therapist or doctor. Share it with your partner or someone close to you.",
          "Partners and fathers can feel low after a birth too. Encourage them to talk and to seek support if they need it.",
        ],
        practice: [
          "Write your support plan and share it with one trusted person.",
          "Book a follow-up session with your therapist.",
        ],
        reflect: "Looking back over these six weeks, the thing that has helped me most is…",
      },
    ],
  },
  {
    slug: "living-with-grief",
    title: "Living with grief",
    summary: "Six weeks of gentle support after losing someone you love: understanding grief, caring for yourself, and finding ways to carry your loss.",
    forWho: "For anyone grieving a death, whether it was recent or a long time ago.",
    colour: "from-[#2d2690] to-[#0f7d74]",
    safety: "If grief brings thoughts of ending your life or of not wanting to be here, please call 112 or one of the helplines under 'Get help now', and tell your therapist.",
    weeks: [
      {
        title: "There's no right way to grieve",
        body: [
          "Grief is the natural response to losing someone we love. It can bring sadness, numbness, anger, guilt, relief, or all of these on the same day.",
          "Grief doesn't follow neat stages or a timetable. It often comes in waves, sometimes triggered by a song, a smell or a date.",
          "Whatever you are feeling is allowed. This programme is not about 'getting over' your loss, but about finding ways to carry it.",
        ],
        practice: [
          "Notice when grief comes in waves this week. What brought it on?",
          "Be gentle with yourself on hard days.",
        ],
        reflect: "Since my loss, the feelings that have surprised me most are…",
      },
      {
        title: "Caring for yourself while grieving",
        body: [
          "Grief is tiring for body and mind. Sleep may be broken, appetite may change and it can be hard to concentrate.",
          "Small routines help: regular meals, some movement or time outdoors, and keeping in touch with people. Try not to rely on alcohol or other substances to numb the pain.",
        ],
        practice: [
          "Choose two simple routines to keep this week, like a morning walk or eating one proper meal a day.",
          "Accept one offer of help.",
        ],
        reflect: "Grief has changed my days by… and one thing that still brings me a little comfort is…",
        tool: { href: "/patient/library/sleep", label: "Open sleep wind-down" },
      },
      {
        title: "Telling the story",
        body: [
          "Many grieving people find it helps to talk or write about the person they lost: who they were, what you shared, and what happened.",
          "Sometimes there are things left unsaid. Writing a letter to the person, even though they will never read it, can help you say them.",
        ],
        practice: [
          "Write about a favourite memory of the person.",
          "If it feels right, write them a letter about what you wish you could tell them.",
        ],
        reflect: "What I want people to know about the person I lost is…",
      },
      {
        title: "Guilt, anger and 'if only'",
        body: [
          "'If only I had…' thoughts are very common in grief. So is anger: at the situation, at others, even at the person who died.",
          "These feelings are part of loving someone and losing them. Often, guilt comes from looking back with knowledge we didn't have at the time.",
        ],
        practice: [
          "Write down any 'if only' thought, then answer it with what you knew and could do at the time.",
          "Find a safe outlet for anger: talking it through, writing or exercise.",
        ],
        reflect: "The 'if only' thought I keep coming back to is… and a kinder way to see it is…",
      },
      {
        title: "Rituals and remembering",
        body: [
          "Funerals, prayers, memorial services and anniversaries help many families express grief and honour the person who died. You can also create your own ways to remember.",
          "Difficult dates such as birthdays and anniversaries are often hard. Planning ahead for them can help.",
        ],
        practice: [
          "Choose a way to remember the person this week: visiting a special place, cooking their favourite meal, praying, or looking at photos.",
          "Plan how you'll spend the next difficult date.",
        ],
        reflect: "A way I'd like to keep their memory part of my life is…",
      },
      {
        title: "Carrying your loss forward",
        body: [
          "Over time, grief usually becomes less sharp, though it doesn't disappear. Many people find life slowly grows around their loss.",
          "If, many months on, grief still stops you from functioning day to day, you feel life has no meaning, or you can't accept the death at all, this may be 'prolonged grief'. It is treatable, so please talk to your therapist.",
        ],
        practice: [
          "Write down one thing you'd like to do in the coming months that feels meaningful.",
          "Share what has helped with your therapist or someone you trust.",
        ],
        reflect: "What I've learned about myself through this grief is…",
      },
    ],
  },
];

export const findProgramme = (slug: string) => PROGRAMMES.find((p) => p.slug === slug) ?? null;

/** A week opens when the one before it is done, or after 7 days per week since starting. */
export function weekOpen(week: number, startedAt: string, completed: number[]) {
  if (week === 1) return true;
  if (completed.includes(week - 1)) return true;
  return Date.now() - new Date(startedAt).getTime() >= (week - 1) * 7 * 86400000;
}
