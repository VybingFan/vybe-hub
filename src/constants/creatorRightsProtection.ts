export const CREATOR_RIGHTS_PROTECTION_VERSION = "VYBE-RP-2026-09-04";

export interface CreatorRightsProtectionAcknowledgementState {
  permissionConfirmed: boolean;
  fingerprintingUnderstood: boolean;
  matchLimitUnderstood: boolean;
  workClassificationAccuracyConfirmed: boolean;
  informationRequestUnderstood: boolean;
}

export interface CreatorRightsProtectionAcceptance extends CreatorRightsProtectionAcknowledgementState {
  version: string;
}

export const EMPTY_CREATOR_RIGHTS_PROTECTION_ACKNOWLEDGEMENTS: CreatorRightsProtectionAcknowledgementState = {
  permissionConfirmed: false,
  fingerprintingUnderstood: false,
  matchLimitUnderstood: false,
  workClassificationAccuracyConfirmed: false,
  informationRequestUnderstood: false,
};

export function hasAcceptedCreatorRightsProtection(
  value: CreatorRightsProtectionAcknowledgementState,
): boolean {
  return Object.values(value).every(Boolean);
}
