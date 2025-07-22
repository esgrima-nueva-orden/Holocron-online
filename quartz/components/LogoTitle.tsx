import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const LogoTitle: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  // Asegura que respete el baseUrl (para GitHub Pages)
  const base = cfg.baseUrl ?? ""
  return (
    <div class="logo-title">
      <a href={base + "/"}>
        <img src={`${base}/static/isotipo_clear_cropped.png`} alt="Logo" class="logo-img" />
      </a>
    </div>
  )
}

LogoTitle.css = `
.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

/* El logo se adapta automáticamente */
.logo-title .logo-img {
  width: 100%;
  max-width: 250px;   /* en pantallas grandes no pasa de 200px */
  height: auto;
  display: block;
}

/* En pantallas pequeñas, se reduce */
@media (max-width: 768px) {
  .logo-title .logo-img {
    max-width: 150px;
  }
}
`

export default (() => LogoTitle) satisfies QuartzComponentConstructor
