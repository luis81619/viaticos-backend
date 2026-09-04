export interface MunicipioEnZonificacion {
  id: string;
  nombre: string;
}

export interface RegionEnZonificacion {
  id: string;
  nombre: string;
  descripcion?: string;
  municipios: MunicipioEnZonificacion[];
}

export interface GrupoZonaEnZonificacion {
  zona: string;
  regiones: RegionEnZonificacion[];
}

export interface EstadoZonificacionResponseDto {
  estado: {
    id: string;
    nombre: string;
    clave: number;
  };
  zonas: GrupoZonaEnZonificacion[];
}
