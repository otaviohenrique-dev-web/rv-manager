import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, Table, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaArrowLeft, FaPlus, FaTrash, FaTruck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NovaVenda() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState(null);

  const [clienteNome, setClienteNome] = useState('');
  const [valorFretePedido, setValorFretePedido] = useState('0.00'); // Frete único global do pedido
  const [carrinho, setCarrinho] = useState([]);

  const [itemAtual, setItemAtual] = useState({
    chapa_id: '',
    dimensoes: '',
    quantidade_pecas: '',
    preco_venda_m2: ''
  });

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const response = await api.get('/api/v1/dashboard/tabela-precos');
        setProdutos(response.data || []);
      } catch (err) {
        console.error('Erro ao buscar estoque:', err);
        setErro('Falha ao carregar lista de produtos.');
      } finally {
        setLoading(false);
      }
    }
    carregarProdutos();
  }, []);

  const calcularM2Disponivel = (produto) => {
    if (produto.estoque_m2 !== undefined && produto.estoque_m2 !== null) {
      return Number(produto.estoque_m2);
    }
    if (produto.dimensoes) {
      const partes = produto.dimensoes.toLowerCase().replace(/\s+/g, '').split(/x|\*/);
      let a = parseFloat(partes[0]?.replace(',', '.') || 0);
      let l = parseFloat(partes[1]?.replace(',', '.') || 0);
      if (a > 50) a /= 1000;
      if (l > 50) l /= 1000;
      if (a > 0 && l > 0) {
        return a * l * (produto.estoque_chapas || 0);
      }
    }
    return 0;
  };

  const produtoSelecionado = produtos.find(p => String(p.id ?? p.chapa_id) === String(itemAtual.chapa_id));
  const qtdJaNoCarrinho = carrinho
    .filter(item => String(item.chapa_id) === String(itemAtual.chapa_id))
    .reduce((acc, item) => acc + item.quantidade_pecas, 0);

  const estoqueTotalChapas = produtoSelecionado?.estoque_chapas || 0;
  const saldoDisponivelChapas = Math.max(0, estoqueTotalChapas - qtdJaNoCarrinho);

  const handleProdutoChange = (e) => {
    const selectedId = e.target.value;
    const produtoEncontrado = produtos.find(p => String(p.id ?? p.chapa_id) === String(selectedId));

    setItemAtual({
      ...itemAtual,
      chapa_id: selectedId,
      quantidade_pecas: '',
      dimensoes: produtoEncontrado ? produtoEncontrado.dimensoes : '',
      preco_venda_m2: produtoEncontrado ? (produtoEncontrado.preco_venda_m2 ?? produtoEncontrado.preco_m2) : ''
    });

    // ATUALIZAÇÃO: Puxa automaticamente o frete padrão cadastrado no produto para o pedido
    if (produtoEncontrado && produtoEncontrado.valor_frete !== undefined && produtoEncontrado.valor_frete !== null) {
      setValorFretePedido(produtoEncontrado.valor_frete.toString().replace('.', ','));
    } else {
      setValorFretePedido('0,00');
    }
  };

  const handleAdicionarAoCarrinho = (e) => {
    e.preventDefault();
    setErro(null);

    if (!itemAtual.chapa_id) {
      setErro('Selecione um produto antes de adicionar ao carrinho.');
      return;
    }

    const dimensoesLimpas = itemAtual.dimensoes.toLowerCase().replace(/\s+/g, '');
    const partes = dimensoesLimpas.split(/x|\*/);
    let altura = parseFloat(partes[0]?.replace(',', '.') || 0);
    let largura = parseFloat(partes[1]?.replace(',', '.') || 0);

    if (isNaN(altura) || isNaN(largura) || altura <= 0 || largura <= 0) {
      setErro('Erro ao processar as dimensões do produto selecionado.');
      return;
    }

    const qtdPecas = parseInt(itemAtual.quantidade_pecas, 10);
    const precoM2 = parseFloat(itemAtual.preco_venda_m2?.toString().replace(',', '.')) || 0;

    if (isNaN(qtdPecas) || qtdPecas <= 0) {
      setErro('Informe uma quantidade de peças válida.');
      return;
    }

    if (qtdJaNoCarrinho + qtdPecas > estoqueTotalChapas) {
      const m2UnitarioCalculado = altura * largura;
      const m2RestanteDisponivel = (saldoDisponivelChapas * m2UnitarioCalculado).toFixed(2);
      setErro(`Quantidade indisponível. Você possui apenas ${saldoDisponivelChapas} unidade(s) / ${m2RestanteDisponivel} m² disponíveis.`);
      return;
    }

    if (isNaN(precoM2) || precoM2 <= 0) {
      setErro('Informe um preço de venda por m² válido.');
      return;
    }

    const m2Unitario = altura * largura;
    const m2Total = m2Unitario * qtdPecas;
    const valorVidro = m2Total * precoM2;

    const novoItem = {
      chapa_id: Number(itemAtual.chapa_id),
      descricao: produtoSelecionado?.descricao || 'Chapa Selecionada',
      espessura: produtoSelecionado?.espessura || '',
      altura: altura,
      largura: largura,
      quantidade_pecas: qtdPecas,
      preco_venda_m2: precoM2,
      m2_total: m2Total,
      valor_total: Number(valorVidro) || 0
    };

    setCarrinho([...carrinho, novoItem]);

    setItemAtual({
      chapa_id: '',
      dimensoes: '',
      quantidade_pecas: '',
      preco_venda_m2: ''
    });
  };

  const handleRemoverItem = (indexParaRemover) => {
    setCarrinho(carrinho.filter((_, index) => index !== indexParaRemover));
  };

  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    if (carrinho.length === 0) {
      setErro('Adicione pelo menos um item ao carrinho antes de finalizar a venda.');
      return;
    }

    setSubmitting(true);
    setErro(null);

    const freteTotal = parseFloat(valorFretePedido.toString().replace(',', '.')) || 0;
    // Distribui o frete proporcionalmente ou atribui ao primeiro item para compatibilidade com o backend
    const fretePorItem = carrinho.length > 0 ? freteTotal / carrinho.length : 0;

    const payload = {
      cliente_nome: clienteNome,
      itens: carrinho.map((item, idx) => ({
        chapa_id: item.chapa_id,
        altura: item.altura,
        largura: item.largura,
        quantidade_pecas: item.quantidade_pecas,
        preco_venda_m2: item.preco_venda_m2,
        valor_frete_item: idx === 0 ? freteTotal : 0 // Atribui o frete global no primeiro item da fatura
      }))
    };

    try {
      const response = await api.post('/api/v1/vendas/nova', payload);
      
      // CORREÇÃO CRUCIAL: Passando response.data.venda para extrair os dados perfeitamente no espelho
      navigate('/vendas/espelho', { 
        state: { 
          venda: response.data.venda,
          toastMessage: 'Venda registrada com sucesso e espelho gerado!' 
        } 
      });
      
    } catch (err) {
      if (err.response?.data?.detail) {
        setErro(typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Ocorreu um erro de validação.');
      } else {
        setErro('Ocorreu um erro ao registrar a saída. Verifique a conexão.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalM2Geral = carrinho.reduce((acc, item) => acc + (Number(item.m2_total) || 0), 0);
  const totalProdutosGeral = carrinho.reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0);
  const freteGeralNum = parseFloat(valorFretePedido.toString().replace(',', '.')) || 0;
  const totalGeralPedido = totalProdutosGeral + freteGeralNum;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: '920px' }}>
      <Button variant="link" className="p-0 text-muted mb-3 text-decoration-none d-flex align-items-center gap-2" onClick={() => navigate('/')}>
        <FaArrowLeft /> Voltar ao Dashboard
      </Button>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <div className="d-flex align-items-center gap-2">
            <FaShoppingCart className="text-warning fs-4" />
            <h5 className="fw-bold mb-0 text-dark">Registrar Saída / Nova Venda</h5>
          </div>
          <p className="text-muted small mb-0 mt-1">Monte o carrinho com controle unificado de frete e transparência de preços.</p>
        </Card.Header>

        <Card.Body className="p-4">
          {erro && <Alert variant="danger" className="py-2 small">{erro}</Alert>}

          <Row className="g-3 mb-4">
            <Col xs={12} md={8}>
              <Form.Group>
                <Form.Label className="fw-semibold small">Cliente / Comprador</Form.Label>
                <Form.Control type="text" placeholder="Ex: Vidraçaria Central Ltda" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label className="fw-semibold small d-flex align-items-center gap-1 text-primary">
                  <FaTruck size={12} /> Valor do Frete (Pedido R$)
                </Form.Label>
                <Form.Control type="number" step="0.01" placeholder="Ex: 50.00" value={valorFretePedido} onChange={(e) => setValorFretePedido(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-4 text-muted opacity-25" />

          <h6 className="fw-bold text-secondary mb-3 small text-uppercase">Adicionar Produto ao Pedido</h6>
          <Form onSubmit={handleAdicionarAoCarrinho}>
            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Produto / Chapa</Form.Label>
                  <Form.Select value={itemAtual.chapa_id} onChange={handleProdutoChange} required>
                    <option value="">-- Selecione o Produto --</option>
                    {produtos.map((item, index) => {
                      const idValido = item.id ?? item.chapa_id ?? index;
                      const m2Disp = calcularM2Disponivel(item);
                      return (
                        <option key={idValido} value={idValido}>
                          {item.descricao} ({item.espessura}) - (Disponível: {item.estoque_chapas} chapas / {m2Disp.toFixed(2)} m²)
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Dimensões da Peça (Alt x Larg)</Form.Label>
                  <Form.Control disabled type="text" value={itemAtual.dimensoes ? `${itemAtual.dimensoes} m` : 'Aguardando produto...'} className="bg-light fw-semibold text-secondary" />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Quantidade de Peças</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="1" 
                    max={itemAtual.chapa_id ? saldoDisponivelChapas : undefined} 
                    placeholder="Ex: 3" 
                    value={itemAtual.quantidade_pecas} 
                    onChange={(e) => setItemAtual({ ...itemAtual, quantidade_pecas: e.target.value })} 
                    required 
                  />
                  {itemAtual.chapa_id && (
                    <Form.Text className={saldoDisponivelChapas === 0 ? 'text-danger fw-bold' : 'text-muted'} style={{ fontSize: '10px' }}>
                      Disponível para inserção: {saldoDisponivelChapas} un.
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Preço de Venda / m² (R$)</Form.Label>
                  <Form.Control type="number" step="0.01" placeholder="Ex: 280.00" value={itemAtual.preco_venda_m2} onChange={(e) => setItemAtual({ ...itemAtual, preco_venda_m2: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end mb-4">
              <Button type="submit" variant="outline-primary" className="d-flex align-items-center gap-2 fw-semibold btn-sm px-3">
                <FaPlus size={12} /> Adicionar ao Carrinho
              </Button>
            </div>
          </Form>

          <h6 className="fw-bold text-dark mb-2 small text-uppercase">Resumo dos Itens do Pedido</h6>
          <div className="table-responsive mb-4">
            <Table hover align="middle" className="border align-middle mb-0">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th>Produto</th>
                  <th className="text-center">Medidas</th>
                  <th className="text-center">Qtd</th>
                  <th className="text-center">m² Total</th>
                  <th className="text-end">R$ / m²</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-center" style={{ width: '50px' }}>Ações</th>
                </tr>
              </thead>
              <tbody className="small">
                {carrinho.length > 0 ? (
                  carrinho.map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold">{item.descricao} <Badge bg="secondary" className="ms-1">{item.espessura}</Badge></td>
                      <td className="text-center text-muted">{item.altura.toFixed(3)}m x {item.largura.toFixed(3)}m</td>
                      <td className="text-center fw-bold">{item.quantidade_pecas}</td>
                      <td className="text-center">{item.m2_total.toFixed(3)} m²</td>
                      <td className="text-end">R$ {Number(item.preco_venda_m2 || 0).toFixed(2)}</td>
                      <td className="text-end fw-bold text-success">R$ {Number(item.valor_total || 0).toFixed(2)}</td>
                      <td className="text-center">
                        <Button variant="link" className="text-danger p-0 border-0" onClick={() => handleRemoverItem(idx)} title="Remover item">
                          <FaTrash size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Nenhum item adicionado ao carrinho. Preencha os campos acima e clique em "Adicionar ao Carrinho".
                    </td>
                  </tr>
                )}
              </tbody>
              {carrinho.length > 0 && (
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan="3" className="text-end">TOTAIS DO PEDIDO:</td>
                    <td className="text-center text-primary">{totalM2Geral.toFixed(3)} m²</td>
                    <td></td>
                    <td className="text-end text-success fs-6">
                      R$ {totalGeralPedido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </Table>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitFinal} variant="warning" disabled={submitting || carrinho.length === 0 || !clienteNome.trim()} className="px-4 fw-semibold text-white border-0" style={{ backgroundColor: '#FF9F1C' }}>
              {submitting ? <Spinner size="sm" animation="border" /> : 'Finalizar Venda'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}