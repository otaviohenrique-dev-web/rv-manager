import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { FaBoxes, FaPrint, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EstoqueVendedor() {
  const navigate = useNavigate();
  const [dadosTabela, setDadosTabela] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function buscarEstoqueVendas() {
      try {
        setLoading(true);
        const resposta = await api.get('/api/v1/vendedor/estoque');
        setDadosTabela(resposta.data || []);
      } catch (err) {
        console.error("Erro na carga de vendas:", err);
        setErro("Não foi possível carregar a tabela de estoque comercial.");
      } finally {
        setLoading(false);
      }
    }
    buscarEstoqueVendas();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5 min-vh-100">
        <Spinner animation="border" variant="primary" style={{ color: '#0B2545' }} />
      </div>
    );
  }

  return (
    <Container fluid className="px-4 pb-4 mt-4">
      
      {/* Estilos para a Impressão Perfeita em A4 (100% de Escala) */}
      <style>{`
        @media print {
          /* Define o tamanho exato da folha e reduz as margens do navegador */
          @page { size: A4 portrait; margin: 10mm; }
          
          body { background-color: #fff !important; }
          
          /* Remove os paddings laterais do container para ganhar largura útil */
          .container-fluid { padding: 0 !important; margin: 0 !important; }
          
          /* Quebra a trava do bootstrap que causa o corte da última coluna */
          .table-responsive { overflow: visible !important; }
          
          .d-print-none, header, footer, nav { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #000 !important; width: 100% !important; }
          
          .table { border: 1px solid #000 !important; margin-bottom: 0 !important; width: 100% !important; }
          
          /* Ajuste fino de fonte e padding das células para encaixe perfeito */
          th, td { 
            border: 1px solid #000 !important; 
            color: #000 !important; 
            padding: 4px 6px !important; 
            font-size: 11px !important; 
            vertical-align: middle !important;
          }
          
          .auditoria-titulo { display: block !important; }
          
          /* Ajuste da linha de caneta para ocupar o espaço de forma fluida */
          .auditoria-linha { 
            display: block; 
            width: 90%; 
            margin: 0 auto;
            border-bottom: 1px solid #000; 
            height: 15px;
          }
        }
        .auditoria-titulo { display: none; }
        .auditoria-linha { display: none; }
      `}</style>

      <div className="d-flex justify-content-between mb-3 d-print-none">
        <Button variant="link" className="text-muted text-decoration-none p-0" onClick={() => navigate('/')}>
          <FaArrowLeft className="me-1"/> Voltar ao Dashboard
        </Button>
        <Button variant="dark" onClick={() => window.print()} className="fw-semibold px-4">
          <FaPrint className="me-2"/> Imprimir Auditoria Física
        </Button>
      </div>

      {erro && <Alert variant="danger" className="border-0 d-print-none">{erro}</Alert>}

      <Card className="border-0 shadow-sm print-card">
        
        {/* Cabeçalho que aparece apenas na impressão */}
        <div className="text-center pb-2 pt-4 mb-2 auditoria-titulo">
          <h4 className="fw-bold mb-0 text-uppercase">Relatório de Auditoria de Estoque Físico</h4>
          <p className="text-muted mb-0 small">Data da Contagem: ____/____/________ | Responsável: ___________________________</p>
        </div>

        <div className="card-header bg-white border-0 pt-3 pb-2 px-3 d-flex align-items-center d-print-none">
          <FaBoxes className="me-2 text-muted" />
          <h6 className="fw-bold text-dark mb-0 text-uppercase small" style={{ letterSpacing: '0.5px' }}>
            Estoque Físico de Chaparia (Consulta Comercial)
          </h6>
        </div>

        <div className="table-responsive px-3 pb-3">
          <Table hover align="middle" className="mb-0 text-nowrap">
            <thead className="table-light" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6C757D' }}>
              <tr>
                <th>Descrição do Material</th>
                <th className="text-center">Espessura</th>
                <th className="text-center">Dimensões Nominais (m)</th>
                <th className="text-center">Saldo em Sistema</th>
                <th className="text-center auditoria-titulo" style={{ width: '120px' }}>Contagem Real</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px', color: '#333' }}>
              {dadosTabela.length > 0 ? (
                dadosTabela.map((item, index) => (
                  <tr key={`vendas-chapa-${item.chapa_id || index}`}>
                    <td className="fw-semibold">{item.descricao}</td>
                    <td className="text-center">{item.espessura}</td>
                    <td className="text-center text-muted fw-medium">{item.dimensoes || item.dimensao}</td>
                    
                    <td className="text-center">
                      <Badge 
                        bg={item.status || 'secondary'} 
                        className="px-2 py-1.5 rounded d-flex flex-column align-items-center mx-auto" 
                        style={{ fontSize: '11px', fontWeight: '600', maxWidth: '80px' }}
                      >
                        <span>{item.estoque_chapas ?? 0} chs</span>
                        <span style={{ fontSize: '9px', opacity: 0.85 }}>
                          {item.m2_estoque ? Number(item.m2_estoque).toFixed(2) : '0.00'} m²
                        </span>
                      </Badge>
                    </td>
                    
                    {/* Coluna exclusiva para o funcionário anotar a caneta no papel */}
                    <td className="text-center auditoria-titulo">
                      <span className="auditoria-linha"></span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted small">
                    Nenhum produto encontrado no estoque.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
}