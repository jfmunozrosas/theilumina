# THEILUMINA — sitio web (Quarto)

## Estructura

```
_quarto.yml          configuración, menú y logo
styles.scss          colores del logo (naranja #E07B20, azul #1F4E7A)
index.qmd            portada
project.qmd          objetivos, WP y actividades
team.qmd             equipo
theil-indices.qmd    definición, descomposición, estimadores y jackknife
simulation.qmd       explorador interactivo del sesgo (se ejecuta en el navegador, sin servidor)
data-code.qmd        código R para generar datos con un índice de Theil dado
publications.qmd     publicaciones
dissemination.qmd    seminarios, congresos, estancias
links.qmd            enlaces
images/              logo
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
