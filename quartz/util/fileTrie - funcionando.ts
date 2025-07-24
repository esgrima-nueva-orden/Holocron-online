import { ContentDetails } from "../plugins/emitters/contentIndex"
import { FullSlug, joinSegments } from "./path"

interface FileTrieData {
  slug: string
  title: string
  filePath: string
  weight?: number // <- añadimos soporte para weight aquí
}

export class FileTrieNode<T extends FileTrieData = ContentDetails> {
  isFolder: boolean
  children: Array<FileTrieNode<T>>

  private slugSegments: string[]
  private fileSegmentHint?: string
  private displayNameOverride?: string
  data: T | null

  constructor(segments: string[], data?: T) {
    this.children = []
    this.slugSegments = segments
    this.data = data ?? null
    this.isFolder = false
    this.displayNameOverride = undefined
  }

  // --- getter de weight para facilitar acceso ---
  get weight(): number {
    return this.data?.weight ?? 0
  }

  get displayName(): string {
    const nonIndexTitle = this.data?.title === "index" ? undefined : this.data?.title
    return (
      this.displayNameOverride ?? nonIndexTitle ?? this.fileSegmentHint ?? this.slugSegment ?? ""
    )
  }

  set displayName(name: string) {
    this.displayNameOverride = name
  }

  get slug(): FullSlug {
    const path = joinSegments(...this.slugSegments) as FullSlug
    if (this.isFolder) {
      return joinSegments(path, "index") as FullSlug
    }
    return path
  }

  get slugSegment(): string {
    return this.slugSegments[this.slugSegments.length - 1]
  }

  private makeChild(path: string[], file?: T) {
    const fullPath = [...this.slugSegments, path[0]]
    const child = new FileTrieNode<T>(fullPath, file)
    this.children.push(child)
    return child
  }

  private insert(path: string[], file: T) {
    if (path.length === 0) {
      throw new Error("path is empty")
    }

    this.isFolder = true
    const segment = path[0]
    if (path.length === 1) {
      if (segment === "index") {
        this.data ??= file
      } else {
        this.makeChild(path, file)
      }
    } else if (path.length > 1) {
      const child =
        this.children.find((c) => c.slugSegment === segment) ?? this.makeChild(path, undefined)

      const fileParts = file.filePath.split("/")
      child.fileSegmentHint = fileParts.at(-path.length)
      child.insert(path.slice(1), file)
    }

    // Cada vez que insertamos, ordenamos los hijos
    this.sortChildren()
  }

  add(file: T) {
    this.insert(file.slug.split("/"), file)
  }

  findNode(path: string[]): FileTrieNode<T> | undefined {
    if (path.length === 0 || (path.length === 1 && path[0] === "index")) {
      return this
    }
    return this.children.find((c) => c.slugSegment === path[0])?.findNode(path.slice(1))
  }

  ancestryChain(path: string[]): Array<FileTrieNode<T>> | undefined {
    if (path.length === 0 || (path.length === 1 && path[0] === "index")) {
      return [this]
    }
    const child = this.children.find((c) => c.slugSegment === path[0])
    if (!child) return undefined

    const childPath = child.ancestryChain(path.slice(1))
    if (!childPath) return undefined

    return [this, ...childPath]
  }

  filter(filterFn: (node: FileTrieNode<T>) => boolean) {
    this.children = this.children.filter(filterFn)
    this.children.forEach((child) => child.filter(filterFn))
  }

  map(mapFn: (node: FileTrieNode<T>) => void) {
    mapFn(this)
    this.children.forEach((child) => child.map(mapFn))
  }

  sort(sortFn: (a: FileTrieNode<T>, b: FileTrieNode<T>) => number) {
    this.children = this.children.sort(sortFn)
    this.children.forEach((e) => e.sort(sortFn))
  }

// Dentro de la clase FileTrieNode
private sortChildren(): void {
  if (this.children && this.children.length > 0) {
    this.children.sort((a, b) => {
      const weightA = a.weight ?? 0
      const weightB = b.weight ?? 0
      if (weightA !== weightB) return weightA - weightB

      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1

      const nameA = a.slugSegment ?? a.displayName ?? ""
      const nameB = b.slugSegment ?? b.displayName ?? ""
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: "base" })
    })

    // Ordenar recursivamente a todos los hijos
    for (const child of this.children) {
      child.sortChildren()
    }
  }
}


  static fromEntries<T extends FileTrieData>(entries: [FullSlug, T][]) {
    const trie = new FileTrieNode<T>([])
    entries.forEach(([, entry]) => trie.add(entry))

    // Orden final después de construir todo
    trie.sortChildren()
    return trie
  }

  entries(): [FullSlug, FileTrieNode<T>][] {
    const traverse = (node: FileTrieNode<T>): [FullSlug, FileTrieNode<T>][] => {
      const result: [FullSlug, FileTrieNode<T>][] = [[node.slug, node]]
      return result.concat(...node.children.map(traverse))
    }
    return traverse(this)
  }

  getFolderPaths() {
    return this.entries()
      .filter(([_, node]) => node.isFolder)
      .map(([path, _]) => path)
  }
}
