export default function Loading() {
  return (
    <div className="min-h-[45vh] flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-sable-500">
        <span className="w-5 h-5 rounded-full border-2 border-sable-300 border-t-vertProfond-700 animate-spin" />
        <span>Chargement • جار التحميل</span>
      </div>
    </div>
  );
}
