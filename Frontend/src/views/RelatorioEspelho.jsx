import React from 'react';
import { Container, Card, Table, Button, Row, Col, Alert } from 'react-bootstrap';
import { FaPrint, FaArrowLeft } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';

export default function RelatorioEspelho() {
  const location = useLocation();
  const navigate = useNavigate();

  // OS 07: Recebendo o payload da venda injetado pelo state da rota no NovaVenda.jsx
  const relatorio = location.state?.venda;

  // Fallback caso o usuário acesse a rota diretamente sem passar pelo fluxo de vendas
  if (!relatorio) {
    return (
      <Container className="py-5 mt-5 text-center" style={{ maxWidth: '600px' }}>
        <Alert variant="warning" className="shadow-sm">
          Nenhum dado de espelho encontrado na memória. Realize uma nova venda para gerar um espelho válido.
        </Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/vendas/nova')}>
          Ir para Nova Venda
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '920px' }}>
      {/* Estilos essenciais para ocultar UI e formatar a impressão */}
      <style>{`
        @media print {
          body { background-color: #fff !important; }
          .d-print-none, header, footer, nav { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #000 !important; }
          .table { border: 1px solid #000 !important; margin-bottom: 0 !important; }
          th, td { border: 1px solid #000 !important; color: #000 !important; padding: 4px 6px !important; font-size: 11px !important; }
          .assinatura-box { display: block !important; margin-top: 40px; }
        }
        .assinatura-box { display: none; }
      `}</style>

      <div className="d-flex justify-content-between mb-3 d-print-none">
        <Button variant="link" className="text-muted text-decoration-none p-0" onClick={() => navigate('/')}>
          <FaArrowLeft className="me-1"/> Voltar ao Dashboard
        </Button>
        <Button variant="dark" onClick={() => window.print()} className="fw-semibold px-4">
          <FaPrint className="me-2"/> Imprimir Espelho
        </Button>
      </div>

      <Card className="print-card shadow-sm border-0 rounded-0">
        <Card.Body className="p-4 p-print-0">
          <div className="text-center border-bottom border-dark pb-3 mb-4">
            <h4 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>Espelho de Saída</h4>
            <p className="text-muted mb-0 small">RV Manager - Controle de Chaparia</p>
          </div>

          <Row className="mb-4 text-dark align-items-center">
            <Col xs={7}>
              <h6 className="mb-1 text-uppercase small text-muted">Comprador / Cliente</h6>
              <strong className="fs-5">{relatorio.cliente_nome || 'Não informado'}</strong>
            </Col>
            <Col xs={5} className="text-end">
              <h6 className="mb-1 text-uppercase small text-muted">Controle Interno</h6>
              {/* Fallback de compatibilidade para pegar id_venda ou id dependendo do backend */}
              <strong>Nº Saída:</strong> #{relatorio.id_venda || relatorio.id} <br/> 
              <strong>Data/Hora:</strong> {relatorio.data_venda} {relatorio.hora_venda ? `às ${relatorio.hora_venda}` : ''}
            </Col>
          </Row>

          <Table size="sm" className="text-center align-middle border-dark mb-3">
            <thead className="table-light small text-uppercase">
              <tr>
                <th className="text-start">Produto</th>
                <th>Espessura</th>
                <th>Dimensões</th>
                <th>Qtd</th>
                <th>M²</th>
                <th>R$ / m²</th>
                <th>Frete</th>
                <th className="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody className="small">
              {relatorio.itens?.map((i, idx) => (
                <tr key={idx}>
                  <td className="text-start fw-semibold">{i.descricao || '-'}</td>
                  <td>{i.espessura || '-'}</td>
                  <td className="text-muted">{i.dimensoes || '-'}</td>
                  <td className="fw-bold">{i.quantidade_pecas || 0}</td>
                  <td>{Number(i.metragem_total_m2 || 0).toFixed(2)}</td>
                  <td>R$ {Number(i.preco_venda_m2 || 0).toFixed(2)}</td>
                  <td className="text-muted">R$ {Number(i.valor_frete_item || 0).toFixed(2)}</td>
                  <td className="text-end fw-bold text-dark">R$ {Number(i.valor_total || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="table-light fw-bold">
              <tr>
                <td colSpan="4" className="text-end">TOTAIS DO PEDIDO:</td>
                <td className="text-primary">{Number(relatorio.metragem_total || 0).toFixed(2)} m²</td>
                <td></td>
                <td className="text-muted text-end">
                  R$ {Number(relatorio.valor_total_frete_venda || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
                <td className="text-end text-success fs-6">
                  R$ {Number(relatorio.valor_total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </td>
              </tr>
            </tfoot>
          </Table>

          {/* Área de assinatura que só aparece na folha impressa (chão de fábrica) */}
          <div className="assinatura-box text-center">
            <Row>
              <Col xs={6}>
                <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '5px' }}>
                  <small>Assinatura do Separador</small>
                </div>
              </Col>
              <Col xs={6}>
                <div style={{ borderTop: '1px solid #000', width: '80%', margin: '0 auto', paddingTop: '5px' }}>
                  <small>Assinatura do Cliente / Motorista</small>
                </div>
              </Col>
            </Row>
          </div>

        </Card.Body>
      </Card>
    </Container>
  );
}