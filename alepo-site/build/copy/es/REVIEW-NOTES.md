# Spanish copy: notes for the native reviewer (24 Nov 2026)

The Spanish pages are a translation of the 24 Nov 2026 English copy deck (`strings.json`, 1,596 strings), made for this build and not yet reviewed by a native speaker. Neutral Latin American Spanish, formal "usted". Product names stay in English, as on the current Spanish pages.

## Glossary used

| English | Spanish |
| --- | --- |
| charging, to charge | tarificación, tarificar |
| billing; invoice | facturación; factura |
| collections; dunning | cobranza; gestión de cobranza |
| self-care | autogestión |
| case study, customer stories | caso de éxito, casos de éxito |
| datasheet; white paper | ficha técnica; documento técnico |
| live session; live data | sesión activa; datos en tiempo real |
| top-up; voucher | recarga; voucher |
| care agent; helpdesk; truck roll | agente de atención; mesa de ayuda; visita técnica |
| settlement; wholesale billing | liquidación; facturación mayorista |
| venues | recintos |
| carrier Wi-Fi; Wi-Fi offload | Wi-Fi de operador; descarga Wi-Fi |
| cutover | cambio definitivo |
| Forward-deployed engineers | Ingenieros integrados |
| partner (program) | socio |
| dealer; sign-up | distribuidor; alta |

## Points to confirm

- **Terms with no settled Spanish equivalent:** "Ingenieros integrados" (forward-deployed engineers), "recintos" (venues), "descarga Wi-Fi" (offload), "cambio definitivo" (cutover), "En implementación" (in delivery), "servidor de suscriptores locales (HSS)" (home subscriber server).
- **Repetition:** "Software de cobranza y gestión de cobranza" repeats a word, because collections and dunning both map to "cobranza".
- **City names:** office names stay as written in the English copy (Mexico City, Rio de Janeiro, Mauritius), while running text uses Ciudad de México, Río de Janeiro and Mauricio. Pick one rule.
- **Job titles:** leadership titles use the masculine form (Director, Vicepresidente). Check each against the person.
- **Shortened titles and descriptions:** about 60 titles and meta descriptions were shortened to fit 60 and 155 characters, and some lost a word:
  - "Sistema de facturación de interconexión y roaming" drops "liquidación".
  - "Tarificación en línea (OCS) para operadores telecom" drops "Sistema".
  - Some descriptions say "Alepo" where the English says "Alepo Technologies".
- **Untranslated aliases:** the "Also known as" lists keep some English aliases (for example "MVNO in a box").
- **English titles kept:** blog posts, news items and library documents are published in English, so the Blog, Library and News lists keep their English titles. Each list has a note saying so.

To change a translation, edit its value in `strings.json`, then run `python3 alepo-site/build/copy/i18n.py apply` and rebuild.
