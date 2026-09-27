export type Scope = "all" | "title" | "author" | "publisher";
export type Sort = "added" | "new" | "old" | "title";
export type Facet = "author" | "publisher" | "category" | "language";
export type Filters = { author: number[]; publisher: number[]; category: number[]; language: string[]; from: string; to: string };

export type CatalogState = { q: string; scope: Scope; sort: Sort; f: Filters };

export const EMPTY_FILTERS: Filters = { author: [], publisher: [], category: [], language: [], from: "", to: "" };

export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogState {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) ?? "";
  const ids = (k: string) => one(k).split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const scope = one("in") as Scope;
  const sort = one("sort") as Sort;
  return {
    q: one("q"),
    scope: ["all", "title", "author", "publisher"].includes(scope) ? scope : "all",
    sort: ["added", "new", "old", "title"].includes(sort) ? sort : "added",
    f: {
      author: ids("author"),
      publisher: ids("publisher"),
      category: ids("category"),
      language: one("lang") ? one("lang").split(",") : [],
      from: one("from").replace(/[^\d-]/g, ""),
      to: one("to").replace(/[^\d-]/g, ""),
    },
  };
}

