export const dmcaConfig = {
  serviceProviderLegalName: "REPLACE WITH VYBE LEGAL ENTITY",
  alternateNames: "VYBE; VYBEwithVYBE; vybewithvybe.com",
  agentName: "REPLACE WITH REGISTERED DMCA AGENT",
  agentOrganization: "REPLACE WITH AGENT ORGANIZATION",
  agentAddress: "REPLACE WITH PUBLIC AGENT MAILING ADDRESS",
  agentPhone: "REPLACE WITH PUBLIC AGENT PHONE",
  agentEmail: "copyright@vybewithvybe.com",
  registrationStatus: "pending" as "pending" | "registered",
  policyVersion: "VYBE-DMCA-2026-08-13",
};

export const dmcaConfigReady =
  dmcaConfig.registrationStatus === "registered" &&
  !Object.values(dmcaConfig).some(
    (value) => typeof value === "string" && value.startsWith("REPLACE WITH"),
  );
