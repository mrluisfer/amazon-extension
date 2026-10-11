import type { ReactNode } from 'react';
import { SITE } from '../site';

interface Props {
  title: string;
  intro: ReactNode;
  sections: { id: string; title: string; body: ReactNode }[];
}

/** Long-form legal document: table of contents + numbered sections. */
export function LegalPage({ title, intro, sections }: Props) {
  return (
    <main className="bg-canvas">
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-white/70">Última actualización: {SITE.policyUpdatedAt}</p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Contenido" className="hidden lg:block">
          <ol className="sticky top-24 flex flex-col gap-1.5 text-sm">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="link">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="card flex flex-col gap-8 p-6 leading-relaxed shadow-card sm:p-8 [&_a]:text-link [&_a:hover]:text-link-hover [&_a:hover]:underline [&_li]:pl-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:marker:text-brand">
          <div className="flex flex-col gap-3 text-fg-2">{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-20 flex-col gap-3">
              <h2 className="text-xl font-bold">
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

/** Contact line used by the legal pages; falls back to the extension's own controls. */
export function ContactLink() {
  return SITE.contactEmail ? (
    <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
  ) : (
    <span>el correo de contacto indicado en la ficha de Chrome Web Store</span>
  );
}
