export default function Support() {
  return (
    <section id="support" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-ink mb-4">Further support</h2>
        <p className="text-ink-dim mb-8">
          If you need immediate support, or you are feeling overwhelmed by
          stress or anxiety, these services are free, confidential and
          anonymous.
        </p>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="border-grid-major bg-blueprint-900/70 rounded-xl border p-6">
            <h3 className="text-ink mb-3">UNSW mental wellbeing support</h3>
            <p className="text-lego-orange mb-4 font-semibold">
              In an emergency, call 000.
            </p>
            <ul className="text-ink-dim space-y-2 text-sm">
              <li>
                Mental Health Support Line (24/7):{" "}
                <a href="tel:+61293855418" className="text-link">
                  (02) 9385 5418
                </a>
              </li>
              <li>
                After-hours SMS support:{" "}
                <a href="sms:+61485826595" className="text-link">
                  0485 826 595
                </a>
              </li>
              <li>
                <a
                  href="https://www.student.unsw.edu.au/counselling"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-link"
                >
                  UNSW Student Support
                </a>
              </li>
            </ul>
          </div>

          <div className="border-grid-major bg-blueprint-900/70 rounded-xl border p-6">
            <h3 className="text-ink mb-3">For anyone in Australia</h3>
            <ul className="text-ink-dim space-y-2 text-sm">
              <li>
                Lifeline:{" "}
                <a href="tel:131114" className="text-link">
                  13 11 14
                </a>
              </li>
              <li>
                Mental Health Line:{" "}
                <a href="tel:1800011511" className="text-link">
                  1800 011 511
                </a>
              </li>
              <li>
                <a
                  href="https://www.beyondblue.org.au/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-link"
                >
                  Beyond Blue
                </a>
              </li>
              <li>
                <a
                  href="https://kidshelpline.com.au/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-link"
                >
                  Kids Helpline
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
