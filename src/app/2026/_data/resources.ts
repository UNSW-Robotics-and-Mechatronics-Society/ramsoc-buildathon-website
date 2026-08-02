export type Resource = {
  title: string;
  description: string;
  href: string;
  image: string;
};

/**
 * Workshop material, published as each week runs. Links below are carried over
 * from 2025 and should be replaced with the 2026 slide decks as they go up.
 */
export const WORKSHOP_RESOURCES: Resource[] = [
  {
    title: "Arduino Workshop Slides",
    description: "Introduction to the Arduino IDE and the ESP32.",
    href: "https://docs.google.com/presentation/d/1Xk8VHhQXKzKZ8-placeholder",
    image: "/2026/resources/week1.png",
  },
  {
    title: "Introduction to CAD",
    description: "Basic CAD using Onshape, from sketch to printable part.",
    href: "https://www.youtube.com/watch?v=placeholder",
    image: "/2026/resources/cad.jpg",
  },
  {
    title: "Motor Control",
    description:
      "Using an Arduino and the L298N motor driver to get your motors spinning.",
    href: "https://www.youtube.com/watch?v=placeholder",
    image: "/2026/resources/motor.jpg",
  },
];

export const EXTERNAL_RESOURCES: Resource[] = [
  {
    title: "Arduino IDE",
    description:
      "Install the Arduino IDE before the first workshop so you are ready to flash.",
    href: "https://www.arduino.cc/en/software",
    image: "/2026/resources/arduino.png",
  },
  {
    title: "ESP32 Pinout Reference",
    description: "Which pin does what on the ESP32 dev board in your kit.",
    href: "https://lastminuteengineers.com/esp32-pinout-reference/",
    image: "/2026/resources/arduino-vid.jpg",
  },
];

export type Troubleshoot = {
  problem: string;
  fix: string;
};

export const TROUBLESHOOTING: Troubleshoot[] = [
  {
    problem: "'LED_BUILTIN' was not declared in this scope",
    fix: "The ESP32 board definition does not define LED_BUILTIN. Replace it with the pin number directly — on most ESP32 dev boards that is 2.",
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
