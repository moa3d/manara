const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const SearchIcon = () => <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const XIcon = () => <svg {...base}><path d="M18 6 6 18M6 6l12 12" /></svg>;
export const BackIcon = () => <svg {...base}><path d="m9 18 6-6-6-6" /></svg>;
export const EditIcon = () => <svg {...base}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
export const TrashIcon = () => <svg {...base}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
export const PlusIcon = () => <svg {...base} strokeWidth={2.2}><path d="M12 5v14M5 12h14" /></svg>;
export const FilterIcon = () => <svg {...base}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
export const CheckIcon = () => <svg {...base} strokeWidth={2.4}><path d="m5 12 5 5 9-10" /></svg>;
export const UploadIcon = () => <svg {...base}><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" /></svg>;
