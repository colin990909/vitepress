import type { SiteData, PageData, HeadConfig } from '../../types/shared.js'

export type {
  SiteData,
  PageData,
  HeadConfig,
  LocaleConfig,
  LocaleSpecificConfig,
  Header,
  DefaultTheme,
  PageDataPayload,
  CleanUrlsMode,
  Awaitable
} from '../../types/shared.js'

export const EXTERNAL_URL_RE = /^[a-z]+:/i
export const APPEARANCE_KEY = 'vitepress-theme-appearance'
export const HASH_RE = /#.*$/
export const EXT_RE = /(index)?\.(md|html)$/

export const inBrowser = typeof window !== 'undefined'

export const notFoundPageData: PageData = {
  relativePath: '',
  title: '404',
  description: 'Not Found',
  headers: [],
  frontmatter: { sidebar: false, layout: 'page' },
  lastUpdated: 0
}

export function isActive(
  currentPath: string,
  matchPath?: string,
  asRegex: boolean = false
): boolean {
  if (matchPath === undefined) {
    return false
  }

  currentPath = normalize(`/${currentPath}`)

  if (asRegex) {
    return new RegExp(matchPath).test(currentPath)
  }

  if (normalize(matchPath) !== currentPath) {
    return false
  }

  const hashMatch = matchPath.match(HASH_RE)

  if (hashMatch) {
    return (inBrowser ? location.hash : '') === hashMatch[0]
  }

  return true
}

export function normalize(path: string): string {
  return decodeURI(path).replace(HASH_RE, '').replace(EXT_RE, '')
}

export function isExternal(path: string): boolean {
  return EXTERNAL_URL_RE.test(path)
}

/**
 * this merges the locales data to the main data by the route
 */
export function resolveSiteDataByRoute(
  siteData: SiteData,
  relativePath: string
): SiteData {
  const localeIndex =
    Object.keys(siteData.locales).find(
      (key) =>
        key !== 'root' &&
        !isExternal(key) &&
        isActive(relativePath, `/${key}/`, true)
    ) || 'root'

  if (localeIndex === 'root') return siteData

  return Object.assign({}, siteData, {
    localeIndex,
    lang: siteData.locales[localeIndex].lang ?? siteData.lang,
    title: siteData.locales[localeIndex].title ?? siteData.title,
    titleTemplate:
      siteData.locales[localeIndex].titleTemplate ?? siteData.titleTemplate,
    description:
      siteData.locales[localeIndex].description ?? siteData.description,
    head: mergeHead(siteData.locales[localeIndex].head ?? [], siteData.head),
    themeConfig:
      siteData.locales[localeIndex].themeConfig ?? siteData.themeConfig
  })
}

/**
 * Create the page title string based on configs.
 */
export function createTitle(siteData: SiteData, pageData: PageData): string {
  const title = pageData.title || siteData.title
  const template = pageData.titleTemplate ?? siteData.titleTemplate

  if (typeof template === 'string' && template.includes(':title')) {
    return template.replace(/:title/g, title)
  }

  const templateString = createTitleTemplate(siteData.title, template)

  return `${title}${templateString}`
}

function createTitleTemplate(
  siteTitle: string,
  template?: string | boolean
): string {
  if (template === false) {
    return ''
  }

  if (template === true || template === undefined) {
    return ` | ${siteTitle}`
  }

  if (siteTitle === template) {
    return ''
  }

  return ` | ${template}`
}

function hasTag(head: HeadConfig[], tag: HeadConfig) {
  const [tagType, tagAttrs] = tag
  if (tagType !== 'meta') return false
  const keyAttr = Object.entries(tagAttrs)[0] // First key
  if (keyAttr == null) return false
  return head.some(
    ([type, attrs]) => type === tagType && attrs[keyAttr[0]] === keyAttr[1]
  )
}

export function mergeHead(prev: HeadConfig[], curr: HeadConfig[]) {
  return [...prev.filter((tagAttrs) => !hasTag(curr, tagAttrs)), ...curr]
}
