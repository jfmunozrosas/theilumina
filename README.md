# THEILUMINA — sitio web (Quarto)

## Estructura

```
_quarto.yml          configuración, menú y logo
styles.scss          colores del logo (naranja #E07B20, azul #1F4E7A)
index.qmd            portada (estado del proyecto y últimas noticias)
_status.md           ESTADO DEL PROYECTO (se incluye en Home, Project y News)
research.qmd         problemas y preguntas de investigación (con figuras del paper)
project.qmd          objetivos, WP y actividades
news.qmd             estado y noticias ("Avances")
team.qmd             equipo, afiliaciones, enlaces a perfiles y red de coautorías
identity.qmd         logo e identidad descargables (images/brand/)
contact.qmd          formulario de contacto (abre el correo; sin servidor)
theil-indices.qmd    definición, descomposición, estimadores y jackknife
simulation.qmd       explorador interactivo del sesgo (se ejecuta en el navegador, sin servidor)
data-code.qmd        código R para generar datos con un índice de Theil dado
publications.qmd     publicaciones
dissemination.qmd    seminarios, congresos, estancias
links.qmd            enlaces
observatory.qmd      observatorio (Eurostat y Banco Mundial en vivo; INE al renderizar, requiere R)
images/              logo, red de coautorías, figuras del paper (images/paper/) y kit de identidad (images/brand/)
data/                copia de los datos del INE (se crea al renderizar)
```

## Previsualizar y renderizar

```bash
quarto preview      # abre la web en local y la actualiza al guardar
quarto render       # genera la web en la carpeta docs/
```

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo, `theilumina`) y sube esta carpeta.
2. Cambia `USUARIO` en `_quarto.yml` por tu usuario de GitHub.
3. Ejecuta `quarto publish gh-pages`. La web quedará en `https://USUARIO.github.io/theilumina`.

## Código R ejecutable

El código R aparece como bloques ```` ```r ```` (se muestran, no se ejecutan). Para que se ejecute al renderizar, cámbialos a ```` ```{r} ````.
Para contenidos que necesiten servidor (Shiny), aloja la app en shinyapps.io y enlázala.

## Tareas habituales

**Cambiar el estado del proyecto** (en evaluación → concedido → en ejecución):

1. En `_status.md`, mueve `class="current"` a la etapa actual, pon `class="done"` en las anteriores y edita la frase de debajo.
2. En `_quarto.yml`, cambia el texto del botón de estado del menú (`"● Under evaluation"`) y, si procede, la frase del pie de página.

**Añadir una noticia:** copia un bloque `::: {.news-item}` en `news.qmd` (las más recientes arriba) y actualiza las tres de `index.qmd` ("Latest news").

**Fecha de última actualización:** `date-modified` en `_quarto.yml` (aparece en todas las páginas) y el pie de página.

**Correo de contacto:** constante `CONTACT_EMAIL` en `contact.qmd`.

**Datos del INE:** la página del observatorio contiene un bloque de R que descarga la tabla 67246 del INE al renderizar (solo usa R base) y guarda una copia en `data/ine_67246.csv`, que se usa si el INE no responde. Necesita R con los paquetes `rmarkdown` y `knitr`.
