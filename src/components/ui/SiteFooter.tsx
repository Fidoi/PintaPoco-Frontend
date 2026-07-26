/**
 * Solo lo montan las paginas que hacen scroll. El estudio ocupa la pantalla
 * completa y no puede permitirse regalar alto a un pie.
 */
export function SiteFooter() {
  return (
    <footer className='mt-16 border-t border-line'>
      <div className='mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-ink-faint'>
        <p>Dibuja lo que quieras. No hace falta cuenta.</p>
        <p>Next.js · Konva · Vercel Blob</p>
      </div>
    </footer>
  );
}
