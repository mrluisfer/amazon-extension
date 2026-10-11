import { Link } from 'react-router';
import { ContactLink, LegalPage } from '../components/LegalPage';
import { SITE } from '../site';
import type { Route } from './+types/terms';

export const meta: Route.MetaFunction = () => [
  { title: `Términos de uso — ${SITE.name}` },
  { name: 'description', content: `Condiciones para usar ${SITE.name}.` },
];

export default function Terms() {
  return (
    <LegalPage
      title="Términos de uso"
      intro={
        <p>
          Al instalar o usar {SITE.name} aceptas estos términos. Si no estás de acuerdo, no uses la
          extensión. El tratamiento de datos se describe en el{' '}
          <Link to="/privacidad">aviso de privacidad</Link>.
        </p>
      }
      sections={[
        {
          id: 'servicio',
          title: 'El servicio',
          body: (
            <p>
              La extensión muestra el historial de precios de productos de Amazon México a partir de
              observaciones compartidas por la comunidad, y permite ocultar contenido patrocinado en
              tu navegador. Es gratuita y puede cambiar, pausarse o dejar de ofrecerse en cualquier
              momento.
            </p>
          ),
        },
        {
          id: 'exactitud',
          title: 'Exactitud de los precios',
          body: (
            <p>
              Los precios son observaciones de usuarios y pueden estar incompletos, desactualizados
              o ser incorrectos. <strong>El precio válido siempre es el que muestra Amazon</strong>{' '}
              al momento de comprar. La información se ofrece «tal cual», sin garantías de ningún
              tipo, y no somos responsables de decisiones de compra tomadas con base en ella.
            </p>
          ),
        },
        {
          id: 'uso-aceptable',
          title: 'Uso aceptable',
          body: (
            <>
              <p>No está permitido:</p>
              <ul>
                <li>Enviar precios falsos o manipulados, o intentar alterar el historial.</li>
                <li>
                  Usar herramientas automatizadas para extraer datos de nuestro servicio de forma
                  masiva.
                </li>
                <li>
                  Intentar acceder sin autorización a nuestros sistemas o interferir con ellos.
                </li>
              </ul>
              <p>Podemos bloquear identificadores o descartar datos asociados a estas conductas.</p>
            </>
          ),
        },
        {
          id: 'marcas',
          title: 'Marcas y afiliación',
          body: (
            <p>
              {SITE.name} es un proyecto independiente. No está afiliado, patrocinado ni respaldado
              por Amazon. Amazon y las marcas relacionadas pertenecen a Amazon.com, Inc. o sus
              filiales; las mencionamos solo para describir con qué sitio funciona la extensión.
            </p>
          ),
        },
        {
          id: 'responsabilidad',
          title: 'Limitación de responsabilidad',
          body: (
            <p>
              En la medida en que la ley lo permita, no seremos responsables por daños indirectos,
              pérdida de datos o perjuicios derivados del uso o la imposibilidad de usar la
              extensión.
            </p>
          ),
        },
        {
          id: 'cambios',
          title: 'Cambios',
          body: (
            <p>
              Podemos actualizar estos términos. Publicaremos la nueva versión en esta página con su
              fecha; si sigues usando la extensión después de un cambio, se entiende que lo aceptas.
            </p>
          ),
        },
        {
          id: 'ley',
          title: 'Ley aplicable y contacto',
          body: (
            <p>
              Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier
              duda escríbenos a <ContactLink />.
            </p>
          ),
        },
      ]}
    />
  );
}
