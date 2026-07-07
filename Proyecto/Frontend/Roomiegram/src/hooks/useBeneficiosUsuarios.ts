import { useEffect, useMemo, useState } from "react"
import { beneficiosFallback, membresiaService, type BeneficiosPlan } from "../services/membresiaService"

function normalizarIds(usuarioIds: Array<number | null | undefined>) {
  return [...new Set(usuarioIds.filter((id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0))]
    .sort((a, b) => a - b)
}

export function useBeneficiosUsuarios(usuarioIds: Array<number | null | undefined>) {
  const idsKey = useMemo(() => normalizarIds(usuarioIds).join(","), [usuarioIds])
  const [beneficios, setBeneficios] = useState<Record<number, BeneficiosPlan>>({})

  useEffect(() => {
    const ids = idsKey
      ? idsKey.split(",").map(Number).filter((id) => Number.isFinite(id) && id > 0)
      : []

    if (!ids.length) {
      setBeneficios({})
      return
    }

    let isMounted = true

    Promise.allSettled(ids.map((usuarioId) => membresiaService.obtenerBeneficios(usuarioId)))
      .then((results) => {
        if (!isMounted) return

        const next = results.reduce<Record<number, BeneficiosPlan>>((acc, result, index) => {
          const usuarioId = ids[index]
          acc[usuarioId] = result.status === "fulfilled"
            ? result.value
            : beneficiosFallback(usuarioId, "GRATIS")
          return acc
        }, {})

        setBeneficios(next)
      })

    return () => {
      isMounted = false
    }
  }, [idsKey])

  return beneficios
}
