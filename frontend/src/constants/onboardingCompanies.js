export const ONBOARDING_COMPANY_CATALOG = Object.freeze({
  campus: Object.freeze([
    "TCS",
    "Infosys",
    "Accenture",
    "Cognizant",
    "Deloitte",
    "Capgemini",
    "Wipro",
    "HCL",
  ]),
  offCampus: Object.freeze([
    "Accenture",
    "TCS",
    "Cognizant",
    "Infosys",
    "Deloitte",
    "Capgemini",
    "Wipro",
    "Amazon",
    "Google",
    "Microsoft",
    "Adobe",
    "Flipkart",
    "Walmart",
  ]),
});

export const ONBOARDING_COMPANY_OPTIONS = Object.freeze([
  ...new Set([
    ...ONBOARDING_COMPANY_CATALOG.campus,
    ...ONBOARDING_COMPANY_CATALOG.offCampus,
  ]),
]);
