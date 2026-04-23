import { type Publicacion } from "../types/Publicacion"

type Props = {
  pub: Publicacion
}

function PublicacionCard({ pub }: Props) {
  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="card-body">
          <h5 className="card-title">{pub.titulo}</h5>
          <p><strong>Precio:</strong> ${pub.precio}</p>
          <p><strong>Ubicación:</strong> {pub.ubicacion}</p>
          <p>{pub.descripcion}</p>
          <button className="btn btn-primary">Ver más</button>
        </div>
      </div>
    </div>
  )
}

export default PublicacionCard