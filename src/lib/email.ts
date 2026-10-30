// E-mail protection without JavaScript (research § 11): the address is written as numeric HTML
// entities, which browsers decode but naive harvesters reading the raw HTML do not.

export const encodeEntities = (value: string): string =>
  [...value].map((char) => `&#${char.codePointAt(0)};`).join('');

/** `href` and link text of a mailto link, both entity-encoded, for `set:html` / raw output. */
export const protectedMailto = (email: string) => ({
  href: encodeEntities(`mailto:${email}`),
  text: encodeEntities(email),
});
