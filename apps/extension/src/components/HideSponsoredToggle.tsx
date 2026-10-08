import { hideSponsoredItem } from '@/lib/storage';
import { useStorageItem } from '@/lib/use-storage-item';

export function HideSponsoredToggle({ description = false }: { description?: boolean }) {
  const [enabled, setEnabled] = useStorageItem(hideSponsoredItem);

  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="flex flex-col">
        <span className="font-medium">Ocultar contenido patrocinado</span>
        {description && (
          <span className="text-xs text-gray-600">
            Oculta los anuncios marcados como «Patrocinado» en las búsquedas y en las páginas de
            producto de Amazon. Se hace en tu navegador; no se envía nada a nuestros servidores.
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={enabled ?? true}
        disabled={enabled === null}
        onChange={(e) => void setEnabled(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--color-brand)]"
      />
    </label>
  );
}
