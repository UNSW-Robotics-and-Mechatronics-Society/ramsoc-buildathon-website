export type Resource = {
  title: string;
  description: string;
  href: string;
  image: string;
  /** Drives the call to action on the card, so people know what they will get. */
  kind: "video" | "slides" | "link";
};

/**
 * Workshop material. These are the 2025 recordings and decks, which still cover
 * the same ground: they are carried over so the resources page is useful from
 * day one. Replace each href as the 2026 session material goes up.
 */
export const WORKSHOP_RESOURCES: Resource[] = [
  {
    title: "Arduino Workshop Slides",
    description: "Introduction to the Arduino IDE and the ESP32.",
    href: "https://docs.google.com/presentation/d/1Wm3WR9b7rzX5lQ9OzO9Xj3d2U1WqkG0myFVm457qXbU/edit?usp=sharing",
    image: "/2026/resources/week1.png",
    kind: "slides",
  },
  {
    title: "Introduction to CAD",
    description: "Basic CAD using Onshape, from sketch to printable part.",
    href: "https://www.youtube.com/watch?v=2V1Y9ENvDSM",
    image: "/2026/resources/cad.jpg",
    kind: "video",
  },
  {
    title: "Motor Control",
    description:
      "Using an Arduino and the L298N motor driver to get your motors spinning.",
    href: "https://www.youtube.com/watch?v=PFLQC4x5NoQ",
    image: "/2026/resources/motor.jpg",
    kind: "video",
  },
  {
    title: "Arduino Basics",
    description:
      "The basics of getting code written and uploaded to your board.",
    href: "https://www.youtube.com/watch?v=Qaol1ywlcjQ",
    image: "/2026/resources/arduino-vid.jpg",
    kind: "video",
  },
];

export const EXTERNAL_RESOURCES: Resource[] = [
  {
    title: "Arduino IDE",
    description:
      "Install the Arduino IDE before the first workshop so you are ready to flash.",
    href: "https://www.arduino.cc/en/software",
    image: "/2026/resources/arduino.png",
    kind: "link",
  },
  {
    title: "ESP32 Pinout Reference",
    description:
      "Which pin does what on the ESP32 dev board in your kit, and which ones to avoid.",
    href: "https://lastminuteengineers.com/esp32-pinout-reference/",
    image: "/2026/brand/components.jpg",
    kind: "link",
  },
];

export type Troubleshoot = {
  problem: string;
  fix: string;
};

export const TROUBLESHOOTING: Troubleshoot[] = [
  {
    problem: "'LED_BUILTIN' was not declared in this scope",
    fix: "The ESP32 board definition does not define LED_BUILTIN. Replace it with the pin number directly. On most ESP32 dev boards that is 2.",
  },
  {
    problem: "Board is not in download mode / upload times out",
    fix: "Hold the BOOT button on the board while the upload starts, and release it once the IDE reports 'Connecting...'. Some boards need you to tap EN at the same time.",
  },
  {
    problem: "Flash corruption or garbled serial output",
    fix: "Set Flash Frequency to 40MHz and Upload Speed to 115200 in Tools, then re-upload. Faster speeds are unreliable on long or thin USB cables.",
  },
];
