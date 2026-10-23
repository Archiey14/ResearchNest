export const legalDrafts = {
  privacy: {
    title: "Privacy Policy",
    summary:
      "This draft identifies decisions the ResearchNest team must make before publishing a privacy policy.",
    sections: [
      {
        heading: "Information to be documented",
        body:
          "The team must specify what account, search, saved-paper, and usage information the service will collect, if any. No collection or storage practices are asserted by this draft.",
      },
      {
        heading: "Purpose and access",
        body:
          "The team must describe how information is used, which personnel or service providers may access it, and what choices users will have.",
      },
      {
        heading: "Retention and user requests",
        body:
          "Retention periods, deletion procedures, and ways to request access or correction require a team-approved policy before launch.",
      },
    ],
  },
  security: {
    title: "Security",
    summary:
      "This draft makes no security guarantees. The project team must review and document actual controls before publication.",
    sections: [
      {
        heading: "Controls to review",
        body:
          "The team should document the controls actually implemented for account access, data handling, deployment, and incident response. This page does not claim that any particular control is currently in place.",
      },
      {
        heading: "Service dependencies",
        body:
          "Hosting, backend, database, and other service providers have not been specified here. Their roles and responsibilities should be documented after the architecture is confirmed.",
      },
      {
        heading: "Security contact",
        body:
          "A team-approved contact and incident reporting process must be added before this page is treated as final.",
      },
    ],
  },
  terms: {
    title: "Terms and Conditions",
    summary:
      "This draft is a review checklist, not final legal terms or legal advice.",
    sections: [
      {
        heading: "Service description",
        body:
          "The team must define the service scope, availability expectations, and which research features are experimental before these terms are finalized.",
      },
      {
        heading: "Accounts and acceptable use",
        body:
          "Account responsibilities, permitted use, and any content or conduct rules require review and approval by the project team.",
      },
      {
        heading: "Content and liability",
        body:
          "Ownership, third-party research content, disclaimers, liability, dispute handling, and governing law must be reviewed by qualified counsel where appropriate.",
      },
    ],
  },
};
