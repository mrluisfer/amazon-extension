import { ContactLink, LegalPage } from '../components/LegalPage';
import { SITE } from '../site';
import type { Route } from './+types/privacy';

/*
 * Keep in sync with what the code actually does: apps/extension OptionsApp.tsx
 * (consent copy), docs/security.md ("Data collected") and the Chrome Web Store
 * privacy-practices form. Changing data collection = updating this page first.
 */

export const meta: Route.MetaFunction = () => [
  { title: `Aviso de privacidad — ${SITE.name}` },
  {
    name: 'description',
    content: `Qué datos procesa ${SITE.name}, para qué, cuánto tiempo y cómo borrarlos.`,
  },
];

export default function Privacy() {
  return (
    <LegalPage
      title="Aviso de privacidad"
      intro={
        <>
          <p>
            {SITE.name} («la extensión», «nosotros») es una extensión de navegador gratuita que
            muestra el historial de precios de productos de Amazon México. El historial se construye
            con los precios que los propios usuarios deciden compartir.
          </p>
          <p>
            Este aviso explica qué datos procesamos, para qué y qué control tienes sobre ellos. En
            resumen: <strong>no pedimos tu nombre, correo ni ningún dato que te identifique</strong>
            , y compartir precios es opcional.
          </p>
        </>
      }
      sections={[
        {
          id: 'datos',
          title: 'Datos que procesamos',
          body: (
            <>
              <h3 className="font-bold">a) Siempre, para que la extensión funcione</h3>
              <ul>
                <li>
                  <strong>El ASIN del producto que estás viendo</strong> (el código de 10 caracteres
                  que Amazon asigna a cada producto), para consultar y mostrarte su historial.
                </li>
                <li>
                  <strong>Un identificador aleatorio de la instalación</strong>, generado al
                  instalar la extensión. No contiene ni se deriva de ningún dato tuyo; sirve para
                  autenticar las peticiones y prevenir abusos.
                </li>
              </ul>
              <h3 className="font-bold">b) Solo si aceptas compartir precios</h3>
              <p>Cuando abres una página de producto en amazon.com.mx, enviamos:</p>
              <ul>
                <li>El ASIN, el título y la imagen del producto.</li>
                <li>
                  Los precios mostrados (nuevo, usado, vendido por Amazon), el precio de lista y la
                  disponibilidad.
                </li>
                <li>La fecha y hora de la observación.</li>
              </ul>
              <p>
                Estos datos se asocian al identificador aleatorio de tu instalación, no a tu
                identidad. No se envía nada si no has aceptado.
              </p>
              <h3 className="font-bold">c) Si creas avisos de precio</h3>
              <p>Los productos que sigues y el precio objetivo que elijas, para poder avisarte.</p>
              <h3 className="font-bold">d) Datos técnicos</h3>
              <p>
                Como cualquier servicio en internet, nuestro servidor recibe tu dirección IP con
                cada petición. La usamos únicamente en memoria para limitar abusos (por ejemplo,
                demasiadas peticiones en poco tiempo) y <strong>no la guardamos</strong> en nuestra
                base de datos. Nuestro proveedor de alojamiento puede conservarla temporalmente en
                sus registros técnicos.
              </p>
            </>
          ),
        },
        {
          id: 'nunca',
          title: 'Lo que nunca recopilamos',
          body: (
            <ul>
              <li>Tu historial de navegación ni páginas fuera de los productos de Amazon.</li>
              <li>Datos de tu cuenta de Amazon, tus pedidos, direcciones o métodos de pago.</li>
              <li>Cookies, contraseñas, ni el contenido de formularios.</li>
              <li>Tu nombre, correo, teléfono o ubicación.</li>
            </ul>
          ),
        },
        {
          id: 'uso',
          title: 'Para qué usamos los datos',
          body: (
            <>
              <ul>
                <li>Construir y mostrar el historial de precios de cada producto.</li>
                <li>
                  Validar la calidad de los datos (por ejemplo, exigir que un cambio de precio
                  sospechoso lo confirmen varios usuarios).
                </li>
                <li>Prevenir abusos y mantener el servicio seguro.</li>
              </ul>
              <p>
                <strong>No vendemos, rentamos ni compartimos tus datos</strong> con terceros con
                fines publicitarios, no creamos perfiles y no mostramos anuncios. El historial de
                precios que publicamos es agregado por producto y no revela quién compartió cada
                precio.
              </p>
            </>
          ),
        },
        {
          id: 'local',
          title: 'Datos guardados en tu navegador',
          body: (
            <>
              <p>
                La extensión guarda en el almacenamiento local de tu navegador: tu decisión sobre
                compartir precios, el identificador aleatorio, los precios pendientes de enviar y
                tus preferencias (tema, ocultar patrocinados). Se eliminan al desinstalar la
                extensión.
              </p>
              <p>
                La función «Ocultar contenido patrocinado» funciona por completo en tu navegador: no
                envía nada a nuestros servidores.
              </p>
            </>
          ),
        },
        {
          id: 'proveedores',
          title: 'Proveedores',
          body: (
            <>
              <p>
                Para operar el servicio usamos proveedores de infraestructura que procesan los datos
                en nuestro nombre y bajo sus propias medidas de seguridad:
              </p>
              <ul>
                <li>Neon (base de datos PostgreSQL), en Estados Unidos.</li>
                <li>Render (servidor de la API), en Estados Unidos.</li>
                <li>Vercel (este sitio web), que no recibe datos de la extensión.</li>
              </ul>
              <p>
                Al usar la extensión, los datos descritos se transfieren a estos servidores fuera de
                México. No los compartimos con nadie más, salvo que una autoridad competente lo
                exija conforme a la ley.
              </p>
            </>
          ),
        },
        {
          id: 'conservacion',
          title: 'Cuánto tiempo los conservamos',
          body: (
            <ul>
              <li>
                <strong>Observaciones de precio individuales:</strong> se conservan de forma
                indefinida para construir el historial completo, detectar ofertas y validar datos.
                Están asociadas al identificador aleatorio de tu instalación; si borras tus datos,
                dejan de estar vinculadas a él.
              </li>
              <li>
                <strong>Historial de precios por producto:</strong> de forma indefinida. Es un dato
                agregado que no está vinculado a ningún usuario.
              </li>
              <li>
                <strong>Identificador y lista de seguimiento:</strong> hasta que borres tus datos
                (ver siguiente sección).
              </li>
            </ul>
          ),
        },
        {
          id: 'derechos',
          title: 'Tus derechos y cómo borrar tus datos',
          body: (
            <>
              <ul>
                <li>
                  <strong>Dejar de compartir:</strong> en los ajustes de la extensión, elige «No,
                  gracias». A partir de ese momento no se envían precios.
                </li>
                <li>
                  <strong>Borrar tus datos:</strong> en los ajustes, «Borrar mis datos» elimina de
                  nuestros servidores tu identificador y tu lista de seguimiento. Las observaciones
                  de precio que ya compartiste se conservan sin ningún vínculo contigo.
                </li>
                <li>
                  <strong>Desinstalar:</strong> borra todos los datos guardados en tu navegador.
                </li>
              </ul>
              <p>
                Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los
                Particulares, puedes ejercer tus derechos de acceso, rectificación, cancelación y
                oposición (ARCO) escribiendo a <ContactLink />. Como no recopilamos datos que te
                identifiquen, la forma más directa de cancelar tus datos es el botón «Borrar mis
                datos» de la extensión.
              </p>
            </>
          ),
        },
        {
          id: 'chrome',
          title: 'Uso limitado (Chrome Web Store)',
          body: (
            <p>
              El uso que hacemos de la información recibida a través de la extensión se apega a la
              Política de Datos de Usuario de Chrome Web Store, incluidos los requisitos de Uso
              Limitado: solo la usamos para ofrecer y mejorar la función única de la extensión
              (historial de precios), no la transferimos para publicidad ni para determinar
              solvencia crediticia, y no permitimos que personas la lean salvo para seguridad,
              cumplimiento legal o con tu consentimiento.
            </p>
          ),
        },
        {
          id: 'menores',
          title: 'Menores de edad',
          body: (
            <p>
              La extensión no está dirigida a menores de 13 años y no recopilamos a sabiendas datos
              de menores.
            </p>
          ),
        },
        {
          id: 'cambios',
          title: 'Cambios a este aviso',
          body: (
            <p>
              Si cambiamos qué datos procesamos, actualizaremos este aviso y la fecha de arriba. Si
              el cambio amplía los datos que se comparten, te pediremos de nuevo tu consentimiento
              en la extensión antes de aplicarlo.
            </p>
          ),
        },
        {
          id: 'contacto',
          title: 'Contacto',
          body: (
            <p>
              Para cualquier duda sobre este aviso o sobre tus datos, escríbenos a <ContactLink />.
            </p>
          ),
        },
      ]}
    />
  );
}
