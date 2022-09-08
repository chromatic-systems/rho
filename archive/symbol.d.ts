// an enum that can be one of ram or a path to directory
type MemoryType = 'ram' | 'disk'
type Mode = 'r' | 'w'
type MimeType = 'text/plain' | 'application/json'
type Key = string

interface Meta {
    key: Key
    type: MimeType
    template?: string
    empty?: boolean
}

interface Symbol {
    key: Key
    meta: Meta
    value: Buffer | string
}

interface SymbolOptions {
    mem: MemoryType
    mode: Mode
    pubKey?: string
}

declare class SymbolDB {
    constructor(options: SymbolOptions)
    put(key: Key, meta:Meta, value: Buffer | string): Promise<void>
    get(key: Key): Promise<Symbol>
    del(key: Key): Promise<void>
    listKeys(n: int): Promise<Key[]>
    close(): Promise<void>
    getMeta(key: Key): Promise<Meta>
    putMeta(key: Key, meta: Meta): Promise<void>
}

export = SymbolDB