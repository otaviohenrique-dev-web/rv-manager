import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Card,
  Table,
  Spinner,
  Alert,
  Button,
  Form,
  InputGroup,
  Badge,
  Collapse
} from 'react-bootstrap';
import {
  FaSearch,
  FaPrint,
  FaChevronDown,
  FaChevronUp,
  FaBoxOpen,
  FaHistory
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function HistoricoVendas() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [expandidos, setExpandidos] = useState({});

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(valor) || 0);
  };

  async function carregarHistorico() {
    try {
      setLoading(true);
      const resposta = await api.get('/api/v1/vendas');
      setVendas(Array.isArray(resposta.data) ? resposta.data : []);
      setErro(null);
    } catch (err) {
      console.error('Erro ao carregar histórico de vendas:', err);
      setErro('Não foi possível carregar o histórico de vendas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHistorico();
  }, []);

  const toggleExpandir = (idVenda) => {
    setExpandidos((prev) => ({
      ...prev,
      [idVenda]: !prev[idVenda]
    }));
  };

  // Processa vendas garantindo compatibilidade com dados Mestre-Detalhe e legados
  const vendasProcessadas = useMemo(() => {
    return vendas.map((venda) => {
      const itens = Array.isArray(venda.itens) ? venda.itens : [];
      
      const totalItens = itens.length > 0
        ? itens.reduce((acc, item) => acc + (Number(item.quantidade_pecas ?? item.quantidade ?? 1)), 0)
        : (venda.total_itens ?? 0);

      const metragemTotal = itens.length > 0
        ? itens.reduce((acc, item) => {
            if (item.m2_total) return acc + Number(item.m2_total);
            const alt = Number(item.altura || 0);
            const larg = Number(item.largura || 0);
            const qtd = Number(item.quantidade_pecas || item.quantidade || 1);
            return acc + (alt * larg * qtd);
          }, 0)
        : Number(venda.metragem_total ?? 0);

      const valorTotal = itens.length > 0
        ? itens.reduce((acc, item) => {
            if (item.valor_total) return acc + Number(item.valor_total);
            const alt = Number(item.altura || 0);
            const larg = Number(item.largura || 0);
            const qtd = Number(item.quantidade_pecas || item.quantidade || 1);
            const preco = Number(item.preco_venda_m2 || item.preco_m2 || 0);
            const frete = Number(item.valor_frete_item || item.valor_frete || 0);
            return acc + (alt * larg * qtd * preco) + frete;
          }, 0)
        : Number(venda.valor_total_venda ?? venda.valor_total ?? 0);

      return {
        ...venda,
        itens,
        totalItensCalculado: totalItens,
        metragemTotalCalculada: metragemTotal,
        valorTotalCalculado: valorTotal
      };
    });
  }, [vendas]);

  const vendasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().replace(/#/g, '').trim();

    if (!termo) return vendasProcessadas;

    return vendasProcessadas.filter((venda) => {
      const idVenda = String(venda.id_venda ?? '');
      const cliente = (venda.cliente_nome ?? '').toLowerCase();
      const possuiItemCorrespondente = venda.itens.some((item) =>
        (item.descricao ?? '').toLowerCase().includes(termo)
      );

      return idVenda.includes(termo) || cliente.includes(termo) || possuiItemCorrespondente;
    });
  }, [vendasProcessadas, busca]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F4F5F7', minHeight: '100vh', padding: '2rem 0' }}>
      <Container fluid className="px-4">
        <Card className="border-0 shadow-sm">
          <Card.Header className="text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: '#0B2545' }}>
            <div>
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                <FaHistory /> Histórico / Auditoria de Saídas
              </h5>
              <small>Consulta e reimpressão de espelhos de venda (Mestre-Detalhe)</small>
            </div>
            <Button variant="outline-light" size="sm" onClick={carregarHistorico} title="Atualizar dados">
              Atualizar
            </Button>
          </Card.Header>

          <Card.Body>
            {erro && <Alert variant="danger">{erro}</Alert>}

            <div className="mb-3" style={{ maxWidth: '380px' }}>
              <InputGroup>
                <InputGroup.Text className="bg-white text-muted">
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por cliente, Nº saída ou produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </InputGroup>
            </div>

            <div className="table-responsive">
              <Table hover align="middle" className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}></th>
                    <th>Nº Saída</th>
                    <th>Cliente</th>
                    <th>Data/Hora</th>
                    <th className="text-center">Qtd Itens</th>
                    <th className="text-center">M² Total</th>
                    <th className="text-end">Valor Total</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {vendasFiltradas.length > 0 ? (
                    vendasFiltradas.map((venda) => {
                      const estaExpandido = !!expandidos[venda.id_venda];
                      const temItens = venda.itens.length > 0;

                      return (
                        <React.Fragment key={venda.id_venda}>
                          <tr>
                            <td className="text-center">
                              {temItens && (
                                <Button
                                  variant="link"
                                  className="p-0 text-dark"
                                  onClick={() => toggleExpandir(venda.id_venda)}
                                  title="Ver itens da venda"
                                >
                                  {estaExpandido ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </Button>
                              )}
                            </td>

                            <td className="fw-semibold">#{venda.id_venda}</td>
                            <td>{venda.cliente_nome || '-'}</td>
                            <td>
                              {venda.data_venda || '-'}
                              <br />
                              <small className="text-muted">{venda.hora_venda || '--:--'}</small>
                            </td>
                            <td className="text-center">
                              <Badge bg="secondary" pill>
                                {venda.totalItensCalculado} pçs
                              </Badge>
                            </td>
                            <td className="text-center">{venda.metragemTotalCalculada.toFixed(2)} m²</td>
                            <td className="text-end fw-bold text-success">
                              {formatarMoeda(venda.valorTotalCalculado)}
                            </td>
                            <td className="text-center">
                              {/* OS 07: Redirecionamento com Payload da Venda injetado direto no Frontend */}
                              <Button
                                size="sm"
                                style={{ backgroundColor: '#FF9F1C', border: 'none' }}
                                onClick={() => {
                                  // Monta o objeto exatamente no formato que o RelatorioEspelho.jsx exige
                                  const payloadEspelho = {
                                    id_venda: venda.id_venda,
                                    cliente_nome: venda.cliente_nome,
                                    data_venda: venda.data_venda,
                                    hora_venda: venda.hora_venda,
                                    metragem_total: venda.metragemTotalCalculada,
                                    valor_total: venda.valorTotalCalculado,
                                    valor_total_frete_venda: venda.valor_total_frete || 0,
                                    itens: venda.itens.map(item => ({
                                      descricao: item.descricao,
                                      espessura: item.espessura,
                                      dimensoes: item.dimensoes ? item.dimensoes : `${item.altura || 0} x ${item.largura || 0}`,
                                      quantidade_pecas: item.quantidade_pecas || item.quantidade || 0,
                                      metragem_total_m2: item.m2_total || item.metragem_m2 || 0,
                                      preco_venda_m2: item.preco_venda_m2 || 0,
                                      valor_frete_item: item.valor_frete_item || 0,
                                      valor_total: item.valor_total || item.subtotal || 0
                                    }))
                                  };
                                  
                                  // Envia para a rota correta passando os dados na memória (state)
                                  navigate('/vendas/espelho', { state: { venda: payloadEspelho } });
                                }}
                              >
                                <FaPrint className="me-1" />
                                Imprimir / Ver Espelho
                              </Button>
                            </td>
                          </tr>

                          {/* Sub-tabela com os detalhes do carrinho (1:N) */}
                          {temItens && (
                            <tr>
                              <td colSpan="8" className="p-0 border-0">
                                <Collapse in={estaExpandido}>
                                  <div className="bg-light p-3 border-bottom shadow-inner">
                                    <h6 className="fw-bold small text-uppercase text-secondary mb-2 d-flex align-items-center gap-2">
                                      <FaBoxOpen /> Detalhamento do Pedido #{venda.id_venda}
                                    </h6>
                                    <Table size="sm" buffered="true" responsive className="bg-white border mb-0 rounded">
                                      <thead className="table-secondary small">
                                        <tr>
                                          <th>Chapa / Produto</th>
                                          <th className="text-center">Dimensões</th>
                                          <th className="text-center">Qtd Peças</th>
                                          <th className="text-center">m² Total</th>
                                          <th className="text-end">Preço m²</th>
                                          <th className="text-end">Frete Item</th>
                                          <th className="text-end">Subtotal</th>
                                        </tr>
                                      </thead>
                                      <tbody className="small">
                                        {venda.itens.map((item, idx) => {
                                          const alt = Number(item.altura || 0);
                                          const larg = Number(item.largura || 0);
                                          const qtd = Number(item.quantidade_pecas || item.quantidade || 1);
                                          const m2Item = item.m2_total ? Number(item.m2_total) : (alt * larg * qtd);
                                          const precoM2 = Number(item.preco_venda_m2 || item.preco_m2 || 0);
                                          const frete = Number(item.valor_frete_item || item.valor_frete || 0);
                                          const subtotal = item.valor_total ? Number(item.valor_total) : (m2Item * precoM2) + frete;

                                          return (
                                            <tr key={idx}>
                                              <td className="fw-semibold">{item.descricao || `Chapa ID #${item.chapa_id}`}</td>
                                              <td className="text-center text-muted">{alt.toFixed(3)}m x {larg.toFixed(3)}m</td>
                                              <td className="text-center fw-bold">{qtd}</td>
                                              <td className="text-center">{m2Item.toFixed(3)} m²</td>
                                              <td className="text-end">{formatarMoeda(precoM2)}</td>
                                              <td className="text-end text-muted">{formatarMoeda(frete)}</td>
                                              <td className="text-end fw-bold">{formatarMoeda(subtotal)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </Table>
                                  </div>
                                </Collapse>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        Nenhuma saída encontrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}