'use client';

import React from 'react';
import { mockPatientDocuments, PatientDocument } from '@/lib/mockEHRData';
import { FileText, Image as ImageIcon, FileCode, Download, Folder, Calendar } from 'lucide-react';

export interface DocumentRepositoryProps {
  documents?: PatientDocument[];
}

export const DocumentRepository: React.FC<DocumentRepositoryProps> = ({
  documents = mockPatientDocuments,
}) => {
  const getFileIcon = (type: PatientDocument['type']) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'Imagen':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'Texto':
        return <FileCode className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleDownload = (docName: string) => {
    alert(`Descargando archivo: ${docName}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Folder className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              Repositorio Documental Clínico
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Historial de informes, notas de evolución e imágenes de diagnóstico
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-center">
          {documents.length} Archivos Disponibles
        </span>
      </div>

      {/* Documents Table List */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
              <th scope="col" className="py-3 px-4">
                Nombre del Archivo
              </th>
              <th scope="col" className="py-3 px-4">
                Categoría
              </th>
              <th scope="col" className="py-3 px-4">
                Fecha de Subida
              </th>
              <th scope="col" className="py-3 px-4">
                Tipo / Tamaño
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <span className="sr-only">Descargar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="bg-white hover:bg-slate-50/80 transition-colors duration-150 group"
              >
                {/* File Icon & Name */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors shrink-0">
                      {getFileIcon(doc.type)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors block">
                        {doc.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {doc.id}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {doc.category}
                  </span>
                </td>

                {/* Date */}
                <td className="py-3.5 px-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.date}</span>
                  </div>
                </td>

                {/* Type & Size */}
                <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                  <span className="font-semibold text-slate-800">{doc.type}</span>{' '}
                  <span className="text-slate-400">({doc.size})</span>
                </td>

                {/* Ghost Download Button */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleDownload(doc.name)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer group-hover:text-blue-600"
                    title={`Descargar ${doc.name}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentRepository;
