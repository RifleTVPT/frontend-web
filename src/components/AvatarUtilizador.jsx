import React, { useEffect, useState } from 'react';

const obterIniciais = nome => {
  const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return `${partes[0][0]}${partes.length > 1 ? partes[partes.length - 1][0] : ''}`.toUpperCase();
};

const resolverFoto = foto => {
  if (!foto) return null;
  return foto.startsWith('http') ? foto : `http://localhost:3000${foto}`;
};

const AvatarUtilizador = ({ nome, foto, tamanho = 38 }) => {
  const src = resolverFoto(foto);
  const [fotoFalhou, setFotoFalhou] = useState(false);
  useEffect(() => setFotoFalhou(false), [src]);
  const estilo = {
    width: tamanho,
    height: tamanho,
    minWidth: tamanho,
    objectFit: 'cover'
  };

  return src && !fotoFalhou ? (
    <img
      src={src}
      alt={`Foto de ${nome}`}
      className="rounded-circle border"
      style={estilo}
      onError={() => setFotoFalhou(true)}
    />
  ) : (
    <span
      className="rounded-circle bg-success text-white fw-bold d-inline-flex align-items-center justify-content-center border"
      style={estilo}
      aria-label={`Iniciais de ${nome}`}
    >
      {obterIniciais(nome)}
    </span>
  );
};

export default AvatarUtilizador;
