// JSON-LD generators (FR-017, research § 7). Pure functions over plain content data, so unit
// tests can call them; `satisfies` checks each node against the schema.org types of schema-dts.
import type {
  BreadcrumbList,
  CreativeWork,
  EducationalOccupationalCredential,
  EmployeeRole,
  OrganizationRole,
  Person,
  ProfilePage,
  SoftwareSourceCode,
} from 'schema-dts';
import type { Lang, LinkT, LocalizedTextT, PeriodT } from '../content/schemas';

export interface LdContext {
  site: URL;
  lang: Lang;
}

type Node = Record<string, unknown> & { '@type': string; '@id'?: string };

const abs = (site: URL, path: string) => new URL(path, site).href;

/** The one person the whole site is about. */
export const personId = (site: URL) => `${new URL('/', site).href}#person`;
const personRef = (site: URL) => ({ '@id': personId(site) });

export function graph(...nodes: Node[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

interface PersonData {
  name: string;
  headline: LocalizedTextT;
  summary: LocalizedTextT;
  jobTitle?: LocalizedTextT | undefined;
  profiles?: { url: string }[] | undefined;
  languages?: { code: string }[] | undefined;
}

export function personLd(profile: PersonData, { site, lang }: LdContext, imageUrl?: string) {
  return {
    '@type': 'Person',
    '@id': personId(site),
    name: profile.name,
    jobTitle: (profile.jobTitle ?? profile.headline)[lang],
    description: profile.summary[lang],
    url: abs(site, `/${lang}/`),
    ...(imageUrl && { image: imageUrl }),
    ...(profile.profiles?.length && { sameAs: profile.profiles.map((p) => p.url) }),
    ...(profile.languages?.length && { knowsLanguage: profile.languages.map((l) => l.code) }),
  } satisfies Person & Node;
}

export function profilePageLd(profile: PersonData, { site, lang }: LdContext, path: string) {
  return {
    '@type': 'ProfilePage',
    url: abs(site, path),
    name: profile.name,
    description: profile.headline[lang],
    inLanguage: lang,
    mainEntity: personRef(site),
  } satisfies ProfilePage & Node;
}

interface ProjectData {
  title: LocalizedTextT;
  summary: LocalizedTextT;
  period: PeriodT;
  technologies: string[];
  links: LinkT[];
  kind: 'software' | 'creative';
}

export function projectLd(
  project: ProjectData,
  { site, lang }: LdContext,
  { url, image }: { url: string; image?: string | undefined },
) {
  const common = {
    name: project.title[lang],
    description: project.summary[lang],
    url: abs(site, url),
    inLanguage: lang,
    author: personRef(site),
    dateCreated: project.period.start,
    ...(image && { image }),
    ...(project.technologies.length && { keywords: project.technologies.join(', ') }),
  };
  if (project.kind === 'creative') {
    return { '@type': 'CreativeWork', ...common } satisfies CreativeWork & Node;
  }
  const code = project.links.find((l) => l.kind === 'code');
  return {
    '@type': 'SoftwareSourceCode',
    ...common,
    ...(code && { codeRepository: code.url }),
  } satisfies SoftwareSourceCode & Node;
}

interface EducationData {
  title: LocalizedTextT;
  institution: string;
  institutionUrl?: string | undefined;
  level?: LocalizedTextT | undefined;
  period: PeriodT;
}

/** The credential, and the person holding it. */
export function educationLd(edu: EducationData, { site, lang }: LdContext, path: string) {
  const id = `${abs(site, path)}#credential`;
  const credential = {
    '@type': 'EducationalOccupationalCredential',
    '@id': id,
    name: edu.title[lang],
    url: abs(site, path),
    ...(edu.level && { credentialCategory: edu.level[lang] }),
    dateCreated: edu.period.end ?? edu.period.start,
    recognizedBy: {
      '@type': 'EducationalOrganization',
      name: edu.institution,
      ...(edu.institutionUrl && { url: edu.institutionUrl }),
    },
  } satisfies EducationalOccupationalCredential & Node;
  return [credential, { '@type': 'Person', ...personRef(site), hasCredential: { '@id': id } }];
}

interface ExperienceData {
  position: LocalizedTextT;
  organization: string;
  organizationUrl?: string | undefined;
  type: 'employment' | 'freelance' | 'internship' | 'apprenticeship' | 'volunteer';
  period: PeriodT;
}

/** The role, and the person holding it. Employment-like roles are EmployeeRole. */
export function experienceLd(exp: ExperienceData, { site, lang }: LdContext, path: string) {
  const id = `${abs(site, path)}#role`;
  const employee = ['employment', 'internship', 'apprenticeship'].includes(exp.type);
  const role = {
    '@type': employee ? 'EmployeeRole' : 'OrganizationRole',
    '@id': id,
    roleName: exp.position[lang],
    startDate: exp.period.start,
    ...(exp.period.end && { endDate: exp.period.end }),
    worksFor: {
      '@type': 'Organization',
      name: exp.organization,
      ...(exp.organizationUrl && { url: exp.organizationUrl }),
    },
  } satisfies (EmployeeRole | OrganizationRole) & Node;
  return [role, { '@type': 'Person', ...personRef(site), worksFor: { '@id': id } }];
}

export function breadcrumb(site: URL, items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(site, item.path),
    })),
  } satisfies BreadcrumbList & Node;
}
