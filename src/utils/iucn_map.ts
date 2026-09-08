export const IUCN_STATUS_MAP: Record<string, { label: string, color: string }> = {
  LC: { label: 'Least Concern', color: 'bg-green-700 text-white shadow-sm shadow-green-700/30' },
  NT: { label: 'Near Threatened', color: 'bg-green-400 text-slate-900 shadow-sm shadow-green-400/30' },
  VU: { label: 'Vulnerable', color: 'bg-yellow-400 text-slate-900 shadow-sm shadow-yellow-400/30' },
  EN: { label: 'Endangered', color: 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' },
  CR: { label: 'Critically Endangered', color: 'bg-red-600 text-white shadow-sm shadow-red-600/30' },
  EW: { label: 'Extinct in Wild', color: 'bg-amber-900 text-white shadow-sm shadow-amber-900/30' },
  EX: { label: 'Extinct', color: 'bg-black text-white shadow-sm shadow-black/30' }
};
