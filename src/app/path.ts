const Path = {
  Root: "/",
  2026: {
    Root: "/2026",
    About: "/2026/#about",
    Timeline: "/2026/#timeline",
    Faq: "/2026/#faq",
    Resources: "/2026/#resources",
    Sponsors: "/2026/#sponsors",
    Support: "/2026/#support",

    // No SignUp route: registration is closed for 2026, so accounts are not
    // created from the site any more. Existing accounts sign in as normal.
    SignIn: "/2026/sign-in",
    Onboarding: "/2026/onboarding",
    Dashboard: "/2026/dashboard",
    Payment: "/2026/dashboard/payment",

    Market: "/2026/market",

    // Easter eggs. Not linked from anywhere, found by typing the URL.
    Egg67: "/2026/67",
    EggRambo: "/2026/rambo",

    Admin: "/2026/admin",
    AdminTeams: "/2026/admin/teams",
    AdminIndividuals: "/2026/admin/individuals",
    AdminTasks: "/2026/admin/tasks",
    AdminTimeline: "/2026/admin/timeline",
    AdminMarket: "/2026/admin/market",
    AdminSettings: "/2026/admin/settings",
    AdminUi: "/2026/admin/ui",
  },
} as const;

export default Path;
