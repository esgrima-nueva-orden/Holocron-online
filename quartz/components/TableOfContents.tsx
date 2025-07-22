import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import legacyStyle from "./styles/legacyToc.scss"
import modernStyle from "./styles/toc.scss"
import { classNames } from "../util/lang"

// @ts-ignore
import script from "./scripts/toc.inline"
import { i18n } from "../i18n"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"

// Función para limpiar texto del TOC, manteniendo colores pero quitando etiquetas que rompen slugs
function sanitizeTOCText(text: string): string {
  // Quitar <center> y cualquier etiqueta que no sea span (para colores)
  text = text.replace(/<\/?center>/gi, "")
  text = text.replace(/<(?!span\b)[^>]+>/gi, "")
  return text
}

// Genera un slug válido si Quartz no lo da bien
function generateSlug(text: string): string {
  return sanitizeTOCText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // quita caracteres raros
    .trim()
    .replace(/\s+/g, "-")
}

interface Options {
  layout: "modern" | "legacy"
}

const defaultOptions: Options = {
  layout: "modern",
}

export default ((opts?: Partial<Options>) => {
  const layout = opts?.layout ?? defaultOptions.layout
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const TableOfContents: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    if (!fileData.toc) {
      return null
    }

    return (
      <div class={classNames(displayClass, "toc")}>
        <button
          type="button"
          class={fileData.collapseToc ? "collapsed toc-header" : "toc-header"}
          aria-controls="toc-content"
          aria-expanded={!fileData.collapseToc}
        >
          <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <OverflowList class={fileData.collapseToc ? "collapsed toc-content" : "toc-content"}>
          {fileData.toc.map((tocEntry) => {
            const cleanText = sanitizeTOCText(tocEntry.text)
            const slug = tocEntry.slug || generateSlug(cleanText)
            return (
              <li key={slug} class={`depth-${tocEntry.depth}`}>
                <a
                  href={`#${slug}`}
                  data-for={slug}
                  dangerouslySetInnerHTML={{ __html: tocEntry.text }} // mantiene colores
                />
              </li>
            )
          })}
        </OverflowList>
      </div>
    )
  }

  TableOfContents.css = modernStyle
  TableOfContents.afterDOMLoaded = concatenateResources(script, overflowListAfterDOMLoaded)

  const LegacyTableOfContents: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    if (!fileData.toc) {
      return null
    }
    return (
      <details class="toc" open={!fileData.collapseToc}>
        <summary>
          <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
        </summary>
        <ul>
          {fileData.toc.map((tocEntry) => {
            const cleanText = sanitizeTOCText(tocEntry.text)
            const slug = tocEntry.slug || generateSlug(cleanText)
            return (
              <li key={slug} class={`depth-${tocEntry.depth}`}>
                <a
                  href={`#${slug}`}
                  data-for={slug}
                  dangerouslySetInnerHTML={{ __html: tocEntry.text }}
                />
              </li>
            )
          })}
        </ul>
      </details>
    )
  }
  LegacyTableOfContents.css = legacyStyle

  return layout === "modern" ? TableOfContents : LegacyTableOfContents
}) satisfies QuartzComponentConstructor
