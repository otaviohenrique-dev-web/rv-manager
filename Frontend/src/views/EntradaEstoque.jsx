import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FaPlusCircle, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function EntradaEstoque() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState(null);
  const [isNovoProduto, setIsNovoProduto] = useState(false);

  const [formData, setFormData] = useState({
    chapa_id: '',
    nova_categoria: '',
    nova_descricao: '',
    nova_espessura: '',
    quantidade_m2: '',
    dimensoes: '',
    valor_frete: '',
    preco_custo_m2: '',
    preco_venda_m2: '',
    limite_vermelho: 50,
    limite_amarelo: 150,
    limite_verde: 250
  });

  useEffect(() => {
    api.get('/api/v1/dashboard/tabela-precos')
       .then(res => setProdutos(res.data || []))
       .catch(() => setErro('Falha ao carregar lista de produtos.'))
       .finally(() => setLoading(false));
  }, []);

  const categoriasExistentes = [...new Set(produtos.map(p => p.categoria))].filter(Boolean);

  const mascaraMoeda = (valor) => {
    let v = valor.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v === "0,00" ? "" : `R$ ${v}`;
  };

  const mascaraDimensoes = (valor) => {
    let v = valor.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 4) return `${v.slice(0,1)}.${v.slice(1,4)} x ${v.slice(4,5)}.${v.slice(5,8)}`;
    else if (v.length > 1) return `${v.slice(0,1)}.${v.slice(1,4)}`;
    return v;
  };

  const mascaraDecimal = (valor) => valor.replace(/[^0-9,]/g, '');

  const handleProdutoExistenteChange = (e) => {
    const selectedId = e.target.value;
    const prod = produtos.find(p => String(p.id) === String(selectedId));
    setFormData({
      ...formData,
      chapa_id: selectedId,
      dimensoes: prod ? prod.dimensoes : '',
      preco_venda_m2: prod ? mascaraMoeda((prod.preco_m2 * 100).toString()) : ''
    });
  };

  const converterMoedaParaFloat = (valorString) => {
    if (!valorString) return 0;
    return parseFloat(valorString.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErro(null);

    const dimensoesLimpas = formData.dimensoes.toLowerCase().replace(/\s+/g, '').replace(/,/g, '.');
    const partes = dimensoesLimpas.split(/x|\*/);
    const altura = parseFloat(partes[0]);
    const largura = parseFloat(partes[1]);
    const precoCusto = converterMoedaParaFloat(formData.preco_custo_m2);
    const precoVenda = converterMoedaParaFloat(formData.preco_venda_m2);
    const valorFrete = converterMoedaParaFloat(formData.valor_frete);
    const quantidade = parseFloat(formData.quantidade_m2.replace(',', '.'));

    if (isNaN(altura) || isNaN(largura)) {
      setErro('Dimensões incompletas. Use o padrão (Ex: 2.200 x 3.210)');
      setSubmitting(false); return;
    }

    if (!precoCusto || !precoVenda) {
      setErro('Informe o preço de custo e o preço de venda por m².');
      setSubmitting(false); return;
    }

    const payload = {
      chapa_id: isNovoProduto ? null : Number(formData.chapa_id),
      nova_categoria: isNovoProduto ? formData.nova_categoria : null,
      nova_descricao: isNovoProduto ? formData.nova_descricao : null,
      nova_espessura: isNovoProduto ? formData.nova_espessura : null,
      limite_vermelho_m2: isNovoProduto ? parseFloat(formData.limite_vermelho) : null,
      limite_amarelo_m2: isNovoProduto ? parseFloat(formData.limite_amarelo) : null,
      limite_verde_m2: isNovoProduto ? parseFloat(formData.limite_verde) : null,
      quantidade_m2: quantidade,
      altura: altura,
      largura: largura,
      valor_frete: valorFrete,
      preco_custo_m2: precoCusto,
      preco_venda_m2: precoVenda
    };

    try {
      const response = await api.post('/api/v1/estoque/entrada', payload);
      const custoMedioAtual = response.data?.custo_medio_m2_atual;

      const mensagemConfirmacao = custoMedioAtual !== undefined
        ? `Entrada registrada! Custo médio ponderado (com frete) atualizado para R$ ${custoMedioAtual.toFixed(2)} / m².`
        : 'Entrada registrada com sucesso!';

      navigate('/', {
        state: {
          toastMessage: mensagemConfirmacao,
          chapaDestacadaId: response.data.chapa_id
        }
      });
    } catch (err) {
      setErro('Erro ao registrar. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

  return (
    <Container className="py-4" style={{ maxWidth: '720px' }}>
      <Button variant="link" className="text-muted text-decoration-none mb-3 p-0" onClick={() => navigate('/')}>
        <FaArrowLeft className="me-2"/> Voltar
      </Button>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 pt-4 px-4">
          <h5 className="fw-bold mb-1"><FaPlusCircle className="text-success me-2" />Adicionar Entrada no Estoque</h5>
        </Card.Header>

        <Card.Body className="p-4">
          {erro && <Alert variant="danger">{erro}</Alert>}

          <Form onSubmit={handleSubmit}>
            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded border">
              <Form.Label className="fw-semibold small mb-0 ms-1">Modo de Operação</Form.Label>
              <Form.Check
                type="switch" id="novo-produto-switch"
                label="Cadastrar novo produto" className="small text-primary fw-bold me-2"
                checked={isNovoProduto} onChange={(e) => setIsNovoProduto(e.target.checked)}
              />
            </div>

            {isNovoProduto ? (
              <div className="p-3 border rounded mb-4 bg-white">
                <h6 className="fw-bold text-dark small text-uppercase mb-3">Identificação do Novo Produto</h6>
                <Row className="g-3 mb-3">
                  <Col xs={12} md={4}>
                    <Form.Group>
                      <Form.Label className="fw-semibold small">Categoria / Família</Form.Label>
                      <Form.Control
                        list="lista-categorias"
                        placeholder="Ex: INCOLOR"
                        value={formData.nova_categoria}
                        onChange={(e) => setFormData({...formData, nova_categoria: e.target.value.toUpperCase()})}
                        required
                      />
                      <datalist id="lista-categorias">
                        {categoriasExistentes.map((cat, i) => <option key={i} value={cat} />)}
                      </datalist>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={5}>
                    <Form.Label className="fw-semibold small">Descrição Interna</Form.Label>
                    <Form.Control
                      placeholder="Ex: REFLETIVO CHAMPANHE"
                      value={formData.nova_descricao}
                      onChange={(e) => setFormData({...formData, nova_descricao: e.target.value.toUpperCase()})}
                      required
                    />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="fw-semibold small">Espessura</Form.Label>
                    <Form.Control
                      placeholder="Ex: 8MM"
                      value={formData.nova_espessura}
                      onChange={(e) => setFormData({...formData, nova_espessura: e.target.value.toUpperCase()})}
                      required
                    />
                  </Col>
                </Row>

                <h6 className="fw-bold text-dark small text-uppercase mt-4 mb-2">Limites de Alerta (Semáforo em m²)</h6>
                <Row className="g-3">
                  <Col xs={4}>
                    <Form.Label className="fw-semibold small text-danger mb-1">Crítico (Vermelho)</Form.Label>
                    <Form.Control type="number" value={formData.limite_vermelho} onChange={(e) => setFormData({...formData, limite_vermelho: e.target.value})} />
                  </Col>
                  <Col xs={4}>
                    <Form.Label className="fw-semibold small text-warning mb-1">Atenção (Amarelo)</Form.Label>
                    <Form.Control type="number" value={formData.limite_amarelo} onChange={(e) => setFormData({...formData, limite_amarelo: e.target.value})} />
                  </Col>
                  <Col xs={4}>
                    <Form.Label className="fw-semibold small text-success mb-1">Saudável (Verde)</Form.Label>
                    <Form.Control type="number" value={formData.limite_verde} onChange={(e) => setFormData({...formData, limite_verde: e.target.value})} />
                  </Col>
                </Row>
              </div>
            ) : (
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold small">Produto Existente no Galpão</Form.Label>
                <Form.Select value={formData.chapa_id} onChange={handleProdutoExistenteChange} required>
                  <option value="">-- Selecione o Produto --</option>
                  {produtos.map((item, i) => (
                    <option key={item.id || i} value={item.id || item.chapa_id}>
                      {item.categoria} - {item.descricao} ({item.espessura})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Entrada (M² Total Comprado)</Form.Label>
                  <Form.Control
                    placeholder="Ex: 45,50"
                    value={formData.quantidade_m2}
                    onChange={(e) => setFormData({...formData, quantidade_m2: mascaraDecimal(e.target.value)})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Valor do Frete (R$)</Form.Label>
                  <Form.Control
                    placeholder="R$ 0,00"
                    value={formData.valor_frete}
                    onChange={(e) => setFormData({...formData, valor_frete: mascaraMoeda(e.target.value)})}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: '11px' }}>
                    O valor será rateado automaticamente no custo total da carga.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Dimensões Padrão da Chapa (m)</Form.Label>
                  <Form.Control
                    placeholder="Ex: 2.200 x 3.210"
                    value={formData.dimensoes}
                    onChange={(e) => setFormData({...formData, dimensoes: mascaraDimensoes(e.target.value)})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mb-4">
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Preço de Custo Base / m² (R$)</Form.Label>
                  <Form.Control
                    placeholder="R$ 0,00"
                    value={formData.preco_custo_m2}
                    onChange={(e) => setFormData({...formData, preco_custo_m2: mascaraMoeda(e.target.value)})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold small">Preço de Venda / m² (R$)</Form.Label>
                  <Form.Control
                    placeholder="R$ 0,00"
                    value={formData.preco_venda_m2}
                    onChange={(e) => setFormData({...formData, preco_venda_m2: mascaraMoeda(e.target.value)})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="text-end">
              <Button type="submit" variant="success" disabled={submitting} className="px-5 py-2 fw-bold" style={{ backgroundColor: '#2EC4B6' }}>
                {submitting ? <Spinner size="sm"/> : 'Confirmar Entrada no Galpão'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}