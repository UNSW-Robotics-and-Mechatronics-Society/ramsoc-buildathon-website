export type Faq = {
  question: string;
  answer: string;
};

export const FAQS: Faq[] = [
  {
    question: "What is Buildathon?",
    answer:
      "Buildathon is a six-week mechatronics hackathon run by UNSW RAMSoc. Teams work to a provided brief, get a hardware kit to start from, and have access to a component shop throughout the competition. It finishes with a presentation night in Week 6 where judges pick the winners.",
  },
  {
    question: "What is the brief?",
    answer:
      "The brief is announced on kick-off night in Week 1, and it changes each year. It is deliberately wide: you pick the problem you want to solve, and the judges look at how well your build actually addresses it. Past entries have ranged from water quality monitors and solar trackers to accessibility devices and bushfire sensors.",
  },
  {
    question: "Who can enter?",
    answer:
      "Anyone. University students of any degree and any year, and high school students too. You do not need to be studying mechatronics, or to have touched a microcontroller before. The weekly workshops start from the basics.",
  },
  {
    question: "How big are teams?",
    answer:
      "Between 2 and 6 people. You can register on your own and use the team browser to find others, or create a team and share your join code with people you already know.",
  },
  {
    question: "I do not know anyone. Can I still enter?",
    answer:
      "Yes, and a good number of people do. Register on your own, then find a team either on the Discord, where there is a channel for exactly this, or in person at the Week 1 kick-off, where we run a team-forming session on the night. You can also browse existing teams from your dashboard and ask a captain for their join code.",
  },
  {
    question: "How much does it cost?",
    answer:
      "$50 per team, not per person. Your team captain pays once through the dashboard after the team has at least 2 members. The fee covers your hardware kit and the shop credit you start with.",
  },
  {
    question: "What is in the kit?",
    answer:
      "An ESP32 development board, a breadboard, an assortment of resistors and LEDs, and a USB cable. That is enough to get a working prototype going on night one. Anything beyond that comes from the shop.",
  },
  {
    question: "What is the shop?",
    answer:
      "A stall run at each session where you spend tickets on extra components such as motors, sensors and drivers. If you buy something and end up not needing it, you can trade the component back for a refund of its ticket cost.",
  },
  {
    question: "How do I earn tickets?",
    answer:
      "Your team earns a ticket for attending a RAMSoc workshop, capped at one per week even if you come to both sessions that week. Additional tickets are raffled at the UNSW Founders workshops.",
  },
  {
    question: "Can I use my own components?",
    answer:
      "Yes. You just have to declare them. Submit an itemised list of any external components with your final build so the judges are comparing like with like.",
  },
  {
    question: "How much time should I expect to put in?",
    answer:
      "Plan for more than two hours a week. The scheduled sessions are two hours, and most teams do work outside them, particularly in Weeks 4 and 5.",
  },
  {
    question: "Do I need to come to every session?",
    answer:
      "No, but the workshops are where you earn tickets and where the mentors are, so teams that show up consistently tend to build more. Build sessions in Weeks 4 and 5 are open makerspace time.",
  },
  {
    question: "What tools will I have access to?",
    answer:
      "3D printing and laser cutting through the MCIC Makerspace, plus the usual hand tools and soldering equipment during build sessions.",
  },
  {
    question: "Can my team win more than one prize?",
    answer:
      "Teams can only win one prize, with the exception of People's Choice, which can be won alongside another award.",
  },
  {
    question: "When is the build due?",
    answer:
      "Your build needs to be finished for the closing presentations on Friday of Week 6, 23 October.",
  },
  {
    question: "I have never done any of this before. Is that a problem?",
    answer:
      "Not at all. A good share of every cohort is in exactly that position. The workshops run from first principles, and mentors are on hand at every build session.",
  },
];
