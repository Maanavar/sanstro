/**
 * Family-member relationships and the weight each one carries in the family
 * aggregate.
 *
 * The table mirrors `_member_weight` in `app/services/family_vault_service.py`,
 * which is the server's fallback when a member row has no explicit weight. A
 * client that changes the relationship also sends the matching weight, so the
 * two cannot drift into the state where the label says "parent" and the
 * aggregate still weighs them as a child. Kept here because web (the edit
 * modal) and mobile (the member screen) both do that, and two copies of this
 * table is two chances to disagree.
 */

export const FAMILY_RELATIONSHIPS = [
  "self",
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandparent",
  "other",
] as const;

export type FamilyRelationship = (typeof FAMILY_RELATIONSHIPS)[number];

export const RELATIONSHIP_DEFAULT_WEIGHT: Record<FamilyRelationship, number> = {
  self: 1.0,
  spouse: 1.0,
  child: 0.75,
  parent: 1.15,
  sibling: 0.75,
  grandparent: 1.15,
  other: 1.0,
};

export function isFamilyRelationship(value: string): value is FamilyRelationship {
  return (FAMILY_RELATIONSHIPS as readonly string[]).includes(value);
}

/** The weight for a relationship, falling back to 1.0 for an unknown one. */
export function defaultWeightFor(relationship: string): number {
  return isFamilyRelationship(relationship) ? RELATIONSHIP_DEFAULT_WEIGHT[relationship] : 1.0;
}
