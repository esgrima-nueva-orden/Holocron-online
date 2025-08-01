import type { QuartzTransformerPlugin } from "quartz"
import { visit } from "unist-util-visit"

export const ObsidianImageProcessor: QuartzTransformerPlugin = () => ({
  name: "ObsidianImageProcessor",
  markdownPlugins() {
    return [
      () => (tree) => {
        console.log("[ObsidianImageProcessor] Plugin activo (fase Markdown)")

        visit(tree, "paragraph", (node: any) => {
          if (!node.children) return

          node.children.forEach((child: any, index: number) => {
            if (child.type === "text" && child.value.includes("![[") && child.value.includes("]]")) {
              //console.log("[ObsidianImageProcessor] Detectado wikilink:", child.value.trim())

              const match = child.value.match(/!\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/)
              if (match) {
                const [, src, fragment, size] = match
                //console.log(`[ObsidianImageProcessor] Procesando -> src=${src}, fragment=${fragment}, size=${size}`)

                const styles: string[] = []
                if (size) {
                  // El tamaño puede venir "350" o "350x200"
                  const widthMatch = size.match(/^(\d+)(x\d+)?$/)
                  if (widthMatch) {
                    styles.push(`width:${widthMatch[1]}px`)
                  }
                }

                const imgNode = {
                  type: "image",
                  url: src,
                  data: {
                    hProperties: {
                      class: fragment ? fragment : undefined,
                      style: styles.length > 0 ? styles.join("; ") + ";" : undefined,
                    },
                  },
                  children: [],
                }

                node.children.splice(index, 1, imgNode)
                //console.log("[ObsidianImageProcessor] Nodo imagen creado:", imgNode)
              }
            }
          })
        })

        //console.log("[ObsidianImageProcessor] Árbol tras procesar:")
        //console.dir(tree, { depth: 5 })
      },
    ]
  },
})
