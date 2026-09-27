"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addTermAction, deleteTermAction, renameTermAction, type TermFormState } from "@/app/admin/actions";
import { TERM_META, type TermKind } from "@/lib/types";
import { booksWord } from "@/lib/text";
import { EditIcon, PlusIcon, TrashIcon } from "./Icons";

type Item = { id: number; name: string; color?: string; books: number };

function useToast(states: TermFormState[]) {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const done = states.find((s) => s.done)?.done;
    if (!done) return;
    setMsg(done);
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, states);
  return msg;
}

function Row({ kind, item }: { kind: TermKind; item: Item }) {
  const one = TERM_META[kind].one;
  const [editing, setEditing] = useState(false);
  const [renameState, rename, renaming] = useActionState<TermFormState, FormData>(renameTermAction.bind(null, kind), {});
  const [delState, del, deleting] = useActionState<TermFormState, FormData>(deleteTermAction.bind(null, kind), {});
  const toast = useToast([renameState, delState]);

  useEffect(() => { if (renameState.done) setEditing(false); }, [renameState]);

  return (
    <li>
      {kind === "categories" && <span className="sw" style={{ "--c": item.color } as React.CSSProperties} />}
      {editing ? (
        <form action={rename} style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          <input type="hidden" name="id" value={item.id} />
          <label className="sr" htmlFor={`rn-${item.id}`}>الاسم الجديد</label>
          <input className="input" id={`rn-${item.id}`} name="name" defaultValue={item.name} autoFocus style={{ flex: 1, minWidth: 160 }}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)} />
          <button className="btn btn-primary btn-sm" disabled={renaming}>حفظ</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>إلغاء</button>
          {renameState.error && <span className="err" style={{ width: "100%" }}>{renameState.error}</span>}
        </form>
      ) : (
        <>
          <span className="nm">
            {item.name}
            {delState.error && <span className="err" style={{ display: "block" }}>{delState.error}</span>}
          </span>
          <span className="bc tnum">{item.books ? `${item.books} ${booksWord(item.books)}` : "لا كتب"}</span>
          <button className="iconbtn" onClick={() => setEditing(true)} aria-label={`تعديل ${item.name}`} title="تعديل الاسم"><EditIcon /></button>
          <form action={del}>
            <input type="hidden" name="id" value={item.id} />
            <button
              className="iconbtn del" disabled={item.books > 0 || deleting} aria-label={`حذف ${item.name}`}
              title={item.books ? `مرتبط بـ${item.books} ${booksWord(item.books)}، انقلها أولًا` : `حذف ${one}`}
            ><TrashIcon /></button>
          </form>
        </>
      )}
      {toast && <div className="flash" role="status">{toast}</div>}
    </li>
  );
}

export default function TermsManager({ kind, items }: { kind: TermKind; items: Item[] }) {
  const meta = TERM_META[kind];
  const [state, add, adding] = useActionState<TermFormState, FormData>(addTermAction.bind(null, kind), {});
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast([state]);

  useEffect(() => {
    if (state.done && inputRef.current) { inputRef.current.value = ""; inputRef.current.focus(); }
  }, [state]);

  return (
    <div className="panel taxo">
      <form className="addrow" action={add}>
        <label className="sr" htmlFor={`new-${kind}`}>إضافة {meta.one}</label>
        <input ref={inputRef} className="input" id={`new-${kind}`} name="name" placeholder={meta.placeholder} aria-invalid={!!state.error} aria-describedby="aerr" />
        <button className="btn btn-primary" disabled={adding}><PlusIcon /> إضافة {meta.one}</button>
        {state.error && <div className="err" id="aerr" style={{ width: "100%" }} role="alert">{state.error}</div>}
      </form>
      {items.length ? (
        <ul>{items.map((it) => <Row key={it.id} kind={kind} item={it} />)}</ul>
      ) : (
        <p style={{ padding: 24, margin: 0, color: "var(--ink-3)", textAlign: "center" }}>لا توجد عناصر بعد. أضف أول {meta.one} من الحقل أعلاه.</p>
      )}
      {toast && <div className="flash" role="status">{toast}</div>}
    </div>
  );
}
