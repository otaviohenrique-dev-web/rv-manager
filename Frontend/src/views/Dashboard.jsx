import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Button, Form, InputGroup, Nav, Toast, ToastContainer, Modal, OverlayTrigger, Tooltip as BsTooltip } from 'react-bootstrap';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FaBoxes, FaChartBar, FaHeartBroken, FaPlusCircle, FaShoppingCart, FaEye, FaEyeSlash, FaSearch, FaFilter, FaEdit, FaTrashAlt, FaExclamationTriangle, FaInfoCircle, FaClipboardList } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const [itensNaoVistos, setItensNaoVistos] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const [dadosKpiGraficos, setDadosKpiGraficos] = useState(null);
  const [dadosTabela, setDadosTabela] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [faturamentoVisivel, setFaturamentoVisivel] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('TODOS');

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // --- Estados de Edição (Modal) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState(null);

  // --- Estados de Exclusão (Modal) ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemParaDeletar, setItemParaDeletar] = useState(null);
  const [deletando, setDeletando] = useState(false);
  const [erroDelete, setErroDelete] = useState(null);

  const formatarMoeda = (valor) => {
    const seguro = valor || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(seguro);
  };

  useEffect(() => {
    if (location.state?.toastMessage) {
      setToastMsg(location.state.toastMessage);
      setShowToast(true);

      if (location.state.chapaDestacadaId !== undefined) {
        const novoId = location.state.chapaDestacadaId;
        setItensNaoVistos(prev => prev.includes(novoId) ? prev : [...prev, novoId]);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  async function buscarDadosDoBack() {
    try {
      setLoading(true);
      const [respostaGraficos, respostaTabela] = await Promise.all([
        api.get('/api/v1/dashboard/cards-graficos'),
        api.get('/api/v1/dashboard/tabela-precos')
      ]);

      setDadosKpiGraficos(respostaGraficos.data);
      setDadosTabela(respostaTabela.data || []);
      setErro(null);
    } catch (err) {
      console.error("Erro na integração com o FastAPI:", err);
      setErro("Falha ao conectar com o servidor. Verifique a conexão com a API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscarDadosDoBack();
  }, []);

  const categoriasDisponiveis = useMemo(() => {
    const categorias = new Set(['TODOS']);
    dadosTabela.forEach(item => {
      const cat = item.familia || item.categoria || (item.descricao ? item.descricao.split(' ')[0] : null);
      if (cat) categorias.add(cat.toUpperCase());
    });
    return Array.from(categorias);
  }, [dadosTabela]);

  const dadosTabelaFiltrados = useMemo(() => {
    return dadosTabela.filter(item => {
      const descricao = (item.descricao || '').toLowerCase();
      const espessura = (item.espessura || '').toLowerCase();
      const busca = termoBusca.toLowerCase();
      const bateTexto = descricao.includes(busca) || espessura.includes(busca);

      const catItem = (item.familia || item.categoria || (item.descricao ? item.descricao.split(' ')[0] : '')).toUpperCase();
      const bateCategoria = categoriaAtiva === 'TODOS' || catItem.includes(categoriaAtiva);

      return bateTexto && bateCategoria;
    });
  }, [dadosTabela, termoBusca, categoriaAtiva]);

  const handleMarcarComoVisto = (id) => {
    if (itensNaoVistos.includes(id)) {
      setItensNaoVistos(prev => prev.filter(itemId => itemId !== id));
    }
  };

  // --- Handlers de Edição ---
  const abrirModalEdicao = (item) => {
    setErroEdicao(null);
    const precoVendaAtual = item.preco_venda_m2 ?? item.preco_m2 ?? 0;
    const precoCustoAtual = item.preco_custo_m2 ?? 0;

    setItemEmEdicao({
      id: item.id ?? item.chapa_id,
      descricao: item.descricao || '',
      preco_venda_m2: precoVendaAtual.toString().replace('.', ','),
      preco_custo_m2: precoCustoAtual.toString().replace('.', ','),
      estoque_chapas: item.estoque_chapas ?? 0,
      dimensoes: item.dimensoes || item.dimensao || '',
      limite_vermelho_m2: item.limite_vermelho_m2 ?? '',
      limite_amarelo_m2: item.limite_amarelo_m2 ?? '',
      limite_verde_m2: item.limite_verde_m2 ?? ''
    });
    setShowEditModal(true);
  };

  const fecharModalEdicao = () => {
    setShowEditModal(false);
    setItemEmEdicao(null);
    setErroEdicao(null);
  };

  const handleSalvarEdicao = async () => {
    if (!itemEmEdicao) return;
    setSalvandoEdicao(true);
    setErroEdicao(null);

    const precoVendaConvertido = parseFloat(String(itemEmEdicao.preco_venda_m2).replace(',', '.'));
    const precoCustoConvertido = parseFloat(String(itemEmEdicao.preco_custo_m2).replace(',', '.'));
    const estoqueConvertido = parseInt(itemEmEdicao.estoque_chapas, 10);

    if (isNaN(precoVendaConvertido) || precoVendaConvertido <= 0) {
      setErroEdicao('Informe um preço de venda válido.');
      setSalvandoEdicao(false);
      return;
    }

    if (isNaN(precoCustoConvertido) || precoCustoConvertido < 0) {
      setErroEdicao('Informe um preço de custo válido.');
      setSalvandoEdicao(false);
      return;
    }

    if (isNaN(estoqueConvertido) || estoqueConvertido < 0) {
      setErroEdicao('Informe uma quantidade em estoque válida.');
      setSalvandoEdicao(false);
      return;
    }

    const payload = {
      descricao: itemEmEdicao.descricao,
      preco_venda_m2: precoVendaConvertido,
      preco_custo_m2: precoCustoConvertido,
      estoque_chapas: estoqueConvertido,
      dimensoes: itemEmEdicao.dimensoes,
      limite_vermelho_m2: itemEmEdicao.limite_vermelho_m2 !== '' ? parseFloat(itemEmEdicao.limite_vermelho_m2) : null,
      limite_amarelo_m2: itemEmEdicao.limite_amarelo_m2 !== '' ? parseFloat(itemEmEdicao.limite_amarelo_m2) : null,
      limite_verde_m2: itemEmEdicao.limite_verde_m2 !== '' ? parseFloat(itemEmEdicao.limite_verde_m2) : null
    };

    try {
      await api.put(`/api/v1/chapas/${itemEmEdicao.id}`, payload);
      await buscarDadosDoBack();
      setToastMsg('Produto atualizado com sucesso!');
      setShowToast(true);
      fecharModalEdicao();
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      setErroEdicao('Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // --- Handlers de Exclusão ---
  const abrirModalDelete = (item) => {
    setErroDelete(null);
    setItemParaDeletar({
      id: item.id ?? item.chapa_id,
      descricao: item.descricao || 'este produto'
    });
    setShowDeleteModal(true);
  };

  const fecharModalDelete = () => {
    setShowDeleteModal(false);
    setItemParaDeletar(null);
    setErroDelete(null);
  };

  const handleConfirmarDelete = async () => {
    if (!itemParaDeletar) return;
    setDeletando(true);
    setErroDelete(null);

    try {
      const response = await api.delete(`/api/v1/chapas/${itemParaDeletar.id}`);
      const tipoExclusao = response.data?.tipo_exclusao;

      const mensagem = tipoExclusao === 'logica'
        ? 'Produto possui histórico de vendas: o estoque foi zerado e o registro preservado para auditoria.'
        : 'Produto removido definitivamente do sistema.';

      await buscarDadosDoBack();
      setToastMsg(mensagem);
      setShowToast(true);
      fecharModalDelete();
    } catch (err) {
      console.error('Erro ao deletar produto:', err);
      setErroDelete('Não foi possível remover o produto. Tente novamente.');
    } finally {
      setDeletando(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#F4F5F7' }}>
        <Spinner animation="border" variant="primary" style={{ color: '#0B2545' }} className="mb-2" />
        <span className="text-muted fw-semibold small text-uppercase">Sincronizando dados de Chaparia...</span>
      </div>
    );
  }

  if (erro) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="shadow-sm border-0">
          <Alert.Heading className="fw-bold fs-5">Erro de Conexão</Alert.Heading>
          <p className="mb-0 small">{erro}</p>
        </Alert>
      </Container>
    );
  }

  const kpis = dadosKpiGraficos?.kpis || {};
  const graficoEstoqueFamilia = dadosKpiGraficos?.grafico_estoque_familia || [];

  const graficoFluxoCompleto = (dadosKpiGraficos?.grafico_vendas_mensal || []).map(item => ({
    mes: item.mes,
    vendas: item.vendas || 0,
    compras: item.compras !== undefined ? item.compras : Math.round((item.vendas || 0) * 0.60)
  }));

  const dadosGraficoFinal = graficoFluxoCompleto.length > 0 ? graficoFluxoCompleto : [
    { mes: 'Jan', vendas: 0, compras: 0 },
    { mes: 'Fev', vendas: 0, compras: 0 },
    { mes: 'Mar', vendas: 0, compras: 0 },
    { mes: 'Abr', vendas: 0, compras: 0 },
    { mes: 'Mai', vendas: 0, compras: 0 },
    { mes: 'Jun', vendas: 0, compras: 0 }
  ];

  const faturamentoLiquido = kpis.faturamento_total || 0;
  const valorInvestido = kpis.valor_investido || 0;
  const faturamentoBruto = kpis.faturamento_bruto || (faturamentoLiquido * 1.12);

  return (
    <div style={{ backgroundColor: '#F4F5F7', minHeight: '100vh', paddingBottom: '2rem' }}>
      <div style={{ backgroundColor: '#0B2545', color: '#FFF', padding: '1.2rem 0' }} className="shadow-sm mb-4">
        <Container fluid className="px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h4 className="mb-1 fw-bold tracking-wider">PAINEL DE CONTROLE DE PRODUÇÃO</h4>
            <p className="mb-0 small" style={{ color: '#A5C4D4' }}>
              Dados consolidados de Chaparia • Sincronização de Contratos Ativa (FastAPI)
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="success"
              className="d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm border-0"
              style={{ backgroundColor: '#2EC4B6' }}
              onClick={() => navigate('/estoque/entrada')}
            >
              <FaPlusCircle size={16} />
              <span>Adicionar (Entrada)</span>
            </Button>

            <Button
              variant="primary"
              className="d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm border-0"
              style={{ backgroundColor: '#FF9F1C' }}
              onClick={() => navigate('/vendas/nova')}
            >
              <FaShoppingCart size={16} />
              <span>Saída / Venda</span>
            </Button>

            <Button
              variant="dark"
              className="d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm border-0"
              style={{ backgroundColor: '#134074' }}
              onClick={() => navigate('/vendas/historico')}
            >
              <FaClipboardList size={16} />
              <span>Histórico / Auditoria</span>
            </Button>
          </div>
        </Container>
      </div>

      <Container fluid className="px-4">
        <Row className="g-3 mb-4">
          <Col xs={12} md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="text-muted mb-0 text-uppercase small fw-bold">Estoque no Galpão</h6>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <BsTooltip>
                          O "Valor Total" reflete o custo real de aquisição (preço de custo médio ponderado, já incluindo o rateio de frete), não o preço de venda projetado.
                        </BsTooltip>
                      }
                    >
                      <span className="text-muted" style={{ cursor: 'help' }}><FaInfoCircle size={12} /></span>
                    </OverlayTrigger>
                  </div>
                  <h3 className="mb-0 fw-bold text-dark">{(kpis.metragem_total_m2 || 0).toLocaleString('pt-BR')} m²</h3>
                  <p className="mb-0 text-muted small mt-1" style={{ fontSize: '12px' }}>
                    Valor Total (Custo): <span className="fw-semibold text-dark">
                      {faturamentoVisivel ? formatarMoeda(valorInvestido) : '••••••••'}
                    </span>
                  </p>
                </div>
                <FaBoxes size={28} style={{ color: '#134074' }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="text-muted mb-0 text-uppercase small fw-bold">Faturamento Corrente</h6>
                    <button
                      onClick={() => setFaturamentoVisivel(!faturamentoVisivel)}
                      className="btn btn-link p-0 text-muted border-0 shadow-none"
                      title={faturamentoVisivel ? "Ocultar valores" : "Mostrar valores"}
                    >
                      {faturamentoVisivel ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                    </button>
                  </div>

                  <div className="d-flex align-items-baseline gap-2">
                    <h3 className="mb-0 fw-bold text-success">
                      {faturamentoVisivel ? formatarMoeda(faturamentoLiquido) : '••••••••'}
                    </h3>

                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill small" style={{ fontSize: '10px' }}>
                      {valorInvestido > 0
                        ? `${(((faturamentoLiquido - valorInvestido) / valorInvestido) * 100).toFixed(1)}%`
                        : '0.0%'}
                    </span>
                  </div>

                  <p className="mb-0 text-muted small mt-1" style={{ fontSize: '12px' }}>
                    Capital Investido: <span className="fw-semibold text-danger">
                      {faturamentoVisivel ? formatarMoeda(valorInvestido) : '••••••••'}
                    </span>
                  </p>
                </div>
                <FaChartBar size={28} style={{ color: '#134074' }} />
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card
              className="border-0 shadow-sm h-100 position-relative cursor-pointer transition-all"
              style={{ cursor: 'pointer', borderLeft: '4px solid #DC3545' }}
              onClick={() => navigate('/quebras/rastreamento')}
            >
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small fw-bold">Rastreamento de Quebras</h6>
                  <h3 className="mb-0 fw-bold text-danger">
                    {kpis.total_quebras || 0} <span className="fs-6 fw-normal text-muted">Chapas</span>
                  </h3>
                  <Button variant="link" className="p-0 text-danger fw-semibold text-decoration-none small mt-2 d-flex align-items-center gap-1" style={{ fontSize: '12px' }}>
                    Ver Detalhes / Rastrear &rarr;
                  </Button>
                </div>
                <FaHeartBroken size={28} style={{ color: '#DC3545' }} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-3 mb-4">
          <Col xs={12} lg={7}>
            <Card className="border-0 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0 text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                  Evolução do Fluxo Comercial (Vendas vs. Compras 2026)
                </h6>
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={dadosGraficoFinal} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="mes" tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
                    <Tooltip formatter={(value, name) => [formatarMoeda(value), name === 'Vendas' ? 'Vendas Total' : 'Compras/Insumos']} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line name="Vendas" type="monotone" dataKey="vendas" stroke="#134074" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line name="Compras" type="monotone" dataKey="compras" stroke="#2EC4B6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={12} lg={5}>
            <Card className="border-0 shadow-sm p-3">
              <h6 className="fw-bold text-dark mb-3 text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                Volume em Estoque por Família (m²)
              </h6>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={graficoEstoqueFamilia} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="familia" tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6C757D', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m²`} />
                    <Tooltip formatter={(value) => [`${value} m²`, 'Volume']} />
                    <Bar dataKey="m2" fill="#0B2545" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <div className="card-header bg-white border-0 pt-3 pb-2 px-3">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                  <h6 className="fw-bold text-dark mb-0 text-uppercase small" style={{ letterSpacing: '0.5px' }}>
                    Tabela Espelho — Valores Atualizados Chaparia
                  </h6>
                  <div style={{ maxWidth: '320px', width: '100%' }}>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-light border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                      <Form.Control
                        placeholder="Buscar por descrição ou espessura..."
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        className="bg-light border-start-0 shadow-none"
                      />
                    </InputGroup>
                  </div>
                </div>

                <Nav variant="tabs" activeKey={categoriaAtiva} onSelect={(k) => setCategoriaAtiva(k)} className="border-bottom-0">
                  {categoriasDisponiveis.map((cat) => (
                    <Nav.Item key={cat}>
                      <Nav.Link
                        eventKey={cat}
                        className={`fw-semibold small px-3 py-2 ${categoriaAtiva === cat ? 'text-primary border-bottom border-primary border-2' : 'text-muted'}`}
                        style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
                      >
                        <FaFilter className="me-1 fs-7" style={{ opacity: categoriaAtiva === cat ? 1 : 0.4 }} />
                        {cat}
                      </Nav.Link>
                    </Nav.Item>
                  ))}
                </Nav>
              </div>

              <div className="table-responsive px-3 pb-0" style={{ maxHeight: '450px', overflowY: 'auto', marginBottom: '1rem' }}>
                <Table hover align="middle" className="mb-0 text-nowrap">
                  <thead className="table-light" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6C757D', position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr>
                      <th style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Descrição</th>
                      <th className="text-center" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Espessura</th>
                      <th className="text-center" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Dimensões (Alt x Larg)</th>
                      <th className="text-end" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Preço de Custo / m²</th>
                      <th className="text-end" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Preço de Venda / m²</th>
                      <th className="text-center" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Estoque Atual</th>
                      <th className="text-center" style={{ position: 'sticky', top: 0, backgroundColor: '#F8F9FA' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '14px', color: '#333' }}>
                    {dadosTabelaFiltrados.length > 0 ? (
                      Object.entries(
                        dadosTabelaFiltrados.reduce((acc, item) => {
                          const cat = item.categoria || 'OUTROS';
                          if (!acc[cat]) acc[cat] = [];
                          acc[cat].push(item);
                          return acc;
                        }, {})
                      ).sort().map(([categoria, itensDaCategoria]) => (
                        <React.Fragment key={`grupo-cat-${categoria}`}>

                          <tr className="bg-light border-top border-bottom">
                            <td colSpan="7" className="fw-bold text-dark text-uppercase py-2 ps-3" style={{ fontSize: '12px', letterSpacing: '0.5px', backgroundColor: '#e9ecef' }}>
                              📂 Família / Categoria: {categoria}
                            </td>
                          </tr>

                          {itensDaCategoria.map((item, index) => {
                            const idItem = item.id ?? item.chapa_id ?? index;
                            const isNaoVisto = itensNaoVistos.includes(idItem);

                            return (
                              <tr
                                key={`chapa-${idItem}-${index}`}
                                onClick={() => handleMarcarComoVisto(idItem)}
                                style={{ cursor: isNaoVisto ? 'pointer' : 'default', transition: 'background-color 0.3s ease' }}
                                className={isNaoVisto ? 'bg-light' : ''}
                              >
                                <td className="fw-semibold ps-4">
                                  <div className="d-flex align-items-center gap-2">
                                    {isNaoVisto && (
                                      <span className="dot-pulsante" title="Novo cadastro. Clique para marcar como visto."></span>
                                    )}
                                    {item.descricao}
                                  </div>
                                </td>
                                <td className="text-center">{item.espessura}</td>
                                <td className="text-center text-muted fw-medium">{item.dimensoes || item.dimensao}</td>
                                <td className="text-end text-muted">{formatarMoeda(parseFloat(item.preco_custo_m2 || 0.0))}</td>
                                <td className="text-end fw-bold">{formatarMoeda(parseFloat(item.preco_venda_m2 ?? item.preco_m2 ?? 0.0))}</td>
                                <td className="text-center">
                                  <Badge
                                    bg={item.status || 'secondary'}
                                    className="px-2 py-1.5 rounded d-flex flex-column align-items-center text-white mx-auto"
                                    style={{ fontSize: '11px', fontWeight: '600', maxWidth: '80px' }}
                                  >
                                    <span>{item.estoque_chapas ?? 0} chs</span>
                                    <span style={{ fontSize: '9px', opacity: 0.85 }}>
                                      {item.m2_estoque ? item.m2_estoque.toFixed(2) : '0.00'} m²
                                    </span>
                                  </Badge>
                                </td>
                                <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="d-flex align-items-center justify-content-center gap-3">
                                    <button
                                      className="btn btn-link p-0 text-primary border-0 shadow-none"
                                      title="Editar produto"
                                      onClick={() => abrirModalEdicao(item)}
                                    >
                                      <FaEdit size={16} />
                                    </button>
                                    <button
                                      className="btn btn-link p-0 text-danger border-0 shadow-none"
                                      title="Excluir produto"
                                      onClick={() => abrirModalDelete(item)}
                                    >
                                      <FaTrashAlt size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted small">
                          Nenhum produto cadastrado no momento. Utilize o botão "Adicionar (Entrada)" para alimentar o estoque.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card>
          </Col>
        </Row>

        <style>{`
          @keyframes pulse-dot {
            0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(46, 196, 182, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 196, 182, 0); }
            100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(46, 196, 182, 0); }
          }
          .dot-pulsante {
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #2EC4B6;
            border-radius: 50%;
            animation: pulse-dot 1.5s infinite;
            flex-shrink: 0;
          }
        `}</style>
      </Container>

      {/* Modal de Edição Rápida */}
      <Modal show={showEditModal} onHide={fecharModalEdicao} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fs-6 fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
            <FaEdit className="text-primary me-2" />Editar Produto
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {itemEmEdicao && (
            <>
              {erroEdicao && <Alert variant="danger" className="small py-2">{erroEdicao}</Alert>}

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Descrição</Form.Label>
                <Form.Control
                  value={itemEmEdicao.descricao}
                  onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, descricao: e.target.value })}
                />
              </Form.Group>

              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <Form.Label className="fw-semibold small">Preço de Custo / m² (R$)</Form.Label>
                  <Form.Control
                    value={itemEmEdicao.preco_custo_m2}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, preco_custo_m2: e.target.value.replace(/[^0-9,]/g, '') })}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label className="fw-semibold small">Preço de Venda / m² (R$)</Form.Label>
                  <Form.Control
                    value={itemEmEdicao.preco_venda_m2}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, preco_venda_m2: e.target.value.replace(/[^0-9,]/g, '') })}
                  />
                </Col>
              </Row>

              <Row className="g-3 mb-3">
                <Col xs={6}>
                  <Form.Label className="fw-semibold small">Estoque (chapas)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={itemEmEdicao.estoque_chapas}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, estoque_chapas: e.target.value })}
                  />
                </Col>
                <Col xs={6}>
                  <Form.Label className="fw-semibold small">Dimensões (Alt x Larg)</Form.Label>
                  <Form.Control
                    value={itemEmEdicao.dimensoes}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, dimensoes: e.target.value })}
                  />
                </Col>
              </Row>

              <Form.Label className="fw-semibold small d-block mb-2">Limites de Alerta (m²)</Form.Label>
              <Row className="g-2">
                <Col xs={4}>
                  <Form.Label className="small text-danger mb-1">Vermelho</Form.Label>
                  <Form.Control
                    type="number"
                    value={itemEmEdicao.limite_vermelho_m2}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, limite_vermelho_m2: e.target.value })}
                  />
                </Col>
                <Col xs={4}>
                  <Form.Label className="small text-warning mb-1">Amarelo</Form.Label>
                  <Form.Control
                    type="number"
                    value={itemEmEdicao.limite_amarelo_m2}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, limite_amarelo_m2: e.target.value })}
                  />
                </Col>
                <Col xs={4}>
                  <Form.Label className="small text-success mb-1">Verde</Form.Label>
                  <Form.Control
                    type="number"
                    value={itemEmEdicao.limite_verde_m2}
                    onChange={(e) => setItemEmEdicao({ ...itemEmEdicao, limite_verde_m2: e.target.value })}
                  />
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" onClick={fecharModalEdicao} disabled={salvandoEdicao}>Cancelar</Button>
          <Button
            variant="success"
            style={{ backgroundColor: '#2EC4B6', border: 'none' }}
            onClick={handleSalvarEdicao}
            disabled={salvandoEdicao}
          >
            {salvandoEdicao ? <Spinner size="sm" /> : 'Salvar Alterações'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteModal} onHide={fecharModalDelete} centered>
        <Modal.Body className="text-center py-4">
          <FaExclamationTriangle size={36} className="text-danger mb-3" />
          <h6 className="fw-bold mb-2">Remover produto do estoque?</h6>
          <p className="text-muted small mb-0">
            Tem certeza que deseja excluir <strong>{itemParaDeletar?.descricao}</strong>?
          </p>
          <p className="text-muted small mb-0 mt-2" style={{ fontSize: '11px' }}>
            Se o produto já tiver histórico de vendas, o sistema apenas zerará o estoque para preservar a auditoria, em vez de remover o registro definitivamente.
          </p>
          {erroDelete && <Alert variant="danger" className="small mt-3 mb-0 py-2">{erroDelete}</Alert>}
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pt-0">
          <Button variant="light" onClick={fecharModalDelete} disabled={deletando}>Cancelar</Button>
          <Button variant="danger" onClick={handleConfirmarDelete} disabled={deletando}>
            {deletando ? <Spinner size="sm" /> : 'Excluir Produto'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={4500} autohide bg="success">
          <Toast.Body className="text-white fw-semibold">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
}