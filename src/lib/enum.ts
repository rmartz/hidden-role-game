/**
 * Type guard: whether `value` is one of the members of the string enum
 * `enumObject`.
 *
 * Use this to narrow an untrusted string (a request payload, a form value, a
 * role id that may belong to another mode) to an enum type instead of an
 * unchecked `value as SomeEnum` assertion, which
 * `@typescript-eslint/no-unsafe-enum-assignment` rejects.
 */
export function isEnumValue<E extends Record<string, string>>(
  enumObject: E,
  value: unknown,
): value is E[keyof E] {
  const members: readonly unknown[] = Object.values(enumObject);
  return members.includes(value);
}
