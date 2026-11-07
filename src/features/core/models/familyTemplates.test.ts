import { describe, expect, it } from 'vitest';
import { FAMILY_TEMPLATE_REGISTRY, createCustomFamilyMemberTemplate, createDefaultBrotherProfile, createFamilyMemberProfile, migrateLegacyFamilyMember, validateFamilyMemberProfile, type FamilyMemberType, } from './familyTemplates';
describe('family template system', () => {
    it('registers every supported family member template', () => {
        const expectedTypes: FamilyMemberType[] = [
            'brother',
            'sister',
            'father',
            'mother',
            'grandfather',
            'grandmother',
            'uncle',
            'aunt',
            'cousin',
            'son',
            'daughter',
            'guardian',
            'friend',
            'custom',
        ];
        expect(Object.keys(FAMILY_TEMPLATE_REGISTRY).sort()).toEqual(expectedTypes.sort());
    });
    it('creates a backward-compatible brother profile using the shared base schema', () => {
        const profile = createDefaultBrotherProfile('Raj', new Date('1998-03-15'));
        expect(profile.memberType).toBe('brother');
        expect(profile.basicInfo.fullName).toBe('Raj');
        expect(profile.relationship.category).toBe('sibling');
        expect(profile.specialized.siblingRole).toBe('younger');
        expect(validateFamilyMemberProfile(profile)).toEqual([]);
    });
    it('supports dynamic fields and privacy controls for additional members', () => {
        const profile = createFamilyMemberProfile('guardian', 'Mrs. Sen', undefined, {
            privacy: {
                defaultLevel: 'private',
                hiddenFields: ['phone'],
            },
            dynamicFields: [
                {
                    fieldId: 'care-role',
                    value: 'Education guardian',
                    updatedAt: new Date('2026-05-23'),
                },
            ],
        });
        expect(profile.memberType).toBe('guardian');
        expect(profile.privacy.defaultLevel).toBe('private');
        expect(profile.dynamicFields).toHaveLength(1);
        expect(validateFamilyMemberProfile(profile)).toEqual([]);
    });
    it('creates custom templates without mutating the registry default', () => {
        const coachTemplate = createCustomFamilyMemberTemplate('Coach', [
            { id: 'match-memory', label: 'Match memory', type: 'textarea' },
        ]);
        expect(coachTemplate.label).toBe('Coach');
        expect(coachTemplate.specializedFields.map((field) => field.id)).toContain('match-memory');
        expect(FAMILY_TEMPLATE_REGISTRY.custom.label).toBe('Custom Member');
    });
    it('migrates unknown legacy members into custom profiles', () => {
        const migrated = migrateLegacyFamilyMember({
            id: 'old-1',
            type: 'extended',
            name: 'Legacy Relative',
            profileData: { note: 'old shape' },
        });
        expect(migrated.id).toBe('old-1');
        expect(migrated.memberType).toBe('custom');
        expect(migrated.metadata.source).toBe('migration');
        expect(validateFamilyMemberProfile(migrated)).toEqual([]);
    });
});
