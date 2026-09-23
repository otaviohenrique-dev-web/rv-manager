import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Spinner, Alert, Button, Modal, Form, Toast, ToastContainer } from 'react-bootstrap';
import { FaHeartBroken, FaRecycle, FaTrashAlt, FaArrowLeft, FaPlusCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function RastreamentoQuebras() {
  const navigate = useNavigate();
  
  // Estados da Listagem e Auditoria
  const [historicoQuebras, setHistoricoQuebras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Estados do Modal e Cadastro de Quebras (OS 02.1)
  const [showModal, setShowModal] = useState(false);
  const [listaEstoque, setListaEstoque] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Formulário do Modal
  const [chapaSelecionada, setChapaSelecionada] = useState('');
  const [tipoOcorrencia, setTipoOcorrencia] = useState('DESPERDICIO_TOTAL'); // 'DESPERDICIO_TOTAL' | 'REAPROVEITADA'
  const [m2Reaproveitado, setM2Reaproveitado] = useState('');

  // Notificação Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMensagem, setToastMensagem] = useState('');

  // Função para buscar o histórico de quebras da API
  const carregarHistoricoQuebras = async () => {
    try {
      setLoading(true);
      const resposta = await api.get('/api/v1/quebras/historico');
      const dados = resposta.data;
      const listaHistorico = Array.isArray(dados) 
  ? dados 
  : (dados?.quebras || dados?.historico || dados?.itens || []);

      setHistoricoQuebras(listaHistorico);
      setErro(null);
    } catch (err) {
      console.error("Erro ao carregar histórico de quebras:", err);
      setErro("Não foi possível carregar o relatório de quebras. Aguardando sincronização com o endpoint do servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Carrega os dados de histórico e lista de produtos para o Select do Modal
  useEffect(() => {
    carregarHistoricoQuebras();

    // Busca os produtos do estoque atual para popular o Select do modal
    async function carregarEstoqueParaSelect() {
      try {
        const res = await api.get('/api/v1/dashboard/tabela-precos');
        setListaEstoque(res.data || []);
      } catch (err) {
        console.error("Erro ao carregar lista de chapas para o formulário:", err);
      }
    }
    carregarEstoqueParaSelect();
  }, []);

  // Handler para submeter o cadastro da nova quebra (POST)
  const handleRegistrarQuebra = async (e) => {
    e.preventDefault();
    if (!chapaSelecionada) {
      alert("Por favor, selecione qual chapa sofreu a avaria.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
  chapa_id: parseInt(chapaSelecionada, 10), // Força o envio como número
  tipo_ocorrencia: tipoOcorrencia,
  m2_reaproveitado: tipoOcorrencia === 'REAPROVEITADA' ? parseFloat(m2Reaproveitado) || 0 : 0
};

      // Dispara o POST para o endpoint da OS 02.1
      await api.post('/api/v1/quebras/registrar', payload);

      // Sucesso: fecha modal, reseta formulário e exibe o Toast
      setShowModal(false);
      setChapaSelecionada('');
      setTipoOcorrencia('DESPERDICIO_TOTAL');
      setM2Reaproveitado('');
      
      setToastMensagem("Ocorrência de quebra registrada com sucesso! Estoque atualizado.");
      setShowToast(true);

      // Refaz o GET da lista para atualizar em tempo real
      await carregarHistoricoQuebras();

    } catch (err) {
      console.error("Erro ao registrar a quebra:", err);
      alert("Falha ao registrar a quebra. Verifique a integração com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

// Totais consolidados para os cards de topo
  const m2PerdidoTotal = historicoQuebras
    .reduce((acc, curr) => acc + (parseFloat(curr.m2_perda_total) || 0), 0);

  const m2ReaproveitadoTotal = historicoQuebras
    .reduce((acc, curr) => acc + (parseFloat(curr.m2_salvo_reciclagem) || 0), 0);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" variant="danger" className="mb-2" />
        <span className="text-muted fw-semibold small text-uppercase">Auditando Histórico de Refugos...</span>
      </div>
    );
  }

  return (
    <Container fluid className="px-4 pb-4 position-relative">
      
      {/* TOAST NOTIFICAÇÃO VERDE DE SUCESSO */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={4000} autohide bg="success">
          <Toast.Header closeButton={true} className="bg-success text-white">
            <strong className="me-auto">Sucesso!</strong>
          </Toast.Header>
          <Toast.Body className="text-white fw-semibold small">{toastMensagem}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* HEADER DA TELA DE AUDITORIA */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <Button variant="outline-secondary" size="sm" className="mb-2 border-0 fw-semibold" onClick={() => navigate('/')}>
            <FaArrowLeft className="me-1" /> Voltar ao Dashboard
          </Button>
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <FaHeartBroken className="text-danger" /> AUDITORIA DE QUEBRAS E RECICLAGEM
          </h4>
          <p className="text-muted small mb-0">Rastreabilidade completa de refugos, perdas físicas e reaproveitamento de chapa.</p>
        </div>

        {/* BOTÃO DE AÇÃO CHAMATIVO (OS 02.1) */}
        <Button 
          variant="danger" 
          size="lg" 
          className="d-flex align-items-center gap-2 fw-bold shadow-sm px-4 border-0"
          style={{ backgroundColor: '#DC3545' }}
          onClick={() => setShowModal(true)}
        >
          <FaPlusCircle size={20} />
          <span>+ Registrar Quebra</span>
        </Button>
      </div>

      {/* CARDS RESUMO DE PERDAS VS REUSO */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm p-3 border-start border-danger border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted uppercase small fw-bold d-block">Metragem Desperdiçada (Lixo)</span>
                <h3 className="fw-bold text-danger mb-0">{m2PerdidoTotal.toFixed(2)} m²</h3>
              </div>
              <FaTrashAlt size={32} className="text-danger opacity-50" />
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="border-0 shadow-sm p-3 border-start border-success border-4">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted uppercase small fw-bold d-block">Metragem Salva (Reciclada / Retalhos)</span>
                <h3 className="fw-bold text-success mb-0">{m2ReaproveitadoTotal.toFixed(2)} m²</h3>
              </div>
              <FaRecycle size={32} className="text-success opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* ERRO DE INTEGRACAO (FALLBACK DE DESENVOLVIMENTO) */}
      {erro && (
        <Alert variant="warning" className="border-0 shadow-sm mb-4">
          <Alert.Heading className="fs-6 fw-bold">Modo de Homologação de Interface</Alert.Heading>
          <p className="mb-0 small">{erro}</p>
        </Alert>
      )}

      {/* TABELA AUDITÁVEL DE QUEBRAS */}
      <Card className="border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 pb-2 px-3">
          <h6 className="fw-bold text-dark mb-0 text-uppercase small" style={{ letterSpacing: '0.5px' }}>
            Histórico Detalhado de Incidentes de Corte
          </h6>
        </div>
        <div className="table-responsive px-3 pb-3">
          <Table hover align="middle" className="mb-0 text-nowrap">
            <thead className="table-light" style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6C757D' }}>
              <tr>
                <th>Lote de Origem</th>
                <th>Material / Descrição</th>
                <th className="text-center">M² Original</th>
                <th className="text-center">Status do Refugo</th>
                <th className="text-center">M² Final Salvo</th>
                <th className="text-center">Perda Real</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '14px', color: '#333' }}>
              {historicoQuebras.length > 0 ? (
                historicoQuebras.map((item, index) => {
                  // Ajuste das chaves correspondentes ao Schema do Backend
const m2Orig = parseFloat(item.m2_original) || 0;
const m2Fin = parseFloat(item.m2_salvo_reciclagem) || 0; // Alterado de m2_final
const perdaM2 = parseFloat(item.m2_perda_total) || (m2Orig - m2Fin); // Garante a perda total
const eReaproveitada = item.status === 'REAPROVEITADA';

                  return (
                    <tr key={`quebra-${item.id || index}`}>
                      <td className="fw-bold text-dark">#{item.lote_origem || `LT-${1000 + index}`}</td>
                      <td className="fw-semibold">{item.descricao_vidro || 'Incolor 4mm'}</td>
                      <td className="text-center">{m2Orig.toFixed(2)} m²</td>
                      <td className="text-center">
                        <Badge 
                          bg="none"
                          className="px-3 py-1.5 rounded-pill"
                          style={{
                            backgroundColor: eReaproveitada ? '#198754' : '#DC3545',
                            color: '#FFF',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                        >
                          {eReaproveitada ? 'Cortada / Reaproveitada' : 'Desperdiçada Totalmente'}
                        </Badge>
                      </td>
                      <td className="text-center fw-bold text-success">
                        {eReaproveitada ? `${m2Fin.toFixed(2)} m²` : '0.00 m²'}
                      </td>
                      <td className="text-center fw-bold text-danger">
                        -{perdaM2.toFixed(2)} m²
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted small">
                    Nenhum registro de quebra encontrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* MODAL DE CADASTRO DE QUEBRA (OS 02.1) */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
        <Form onSubmit={handleRegistrarQuebra}>
          <Modal.Header closeButton className="border-0 bg-light">
            <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
              <FaHeartBroken className="text-danger" /> Registrar Ocorrência de Quebra
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="px-4 py-3">
            {/* SELECT DA CHAPA */}
<Form.Group className="mb-3">
  <Form.Label className="fw-semibold small text-dark">Chapa / Produto do Estoque</Form.Label>
  <Form.Select 
    value={chapaSelecionada} 
    onChange={(e) => setChapaSelecionada(e.target.value)}
    required
    className="shadow-none"
  >
    <option value="">-- Selecione a Chapa Avariada --</option>
    {listaEstoque.map((item, index) => (
  <option key={`estoque-chapa-${index}`} value={item.id !== undefined ? item.id : index}>
    {item.descricao} ({item.espessura}) - Disponível: {item.estoque_chapas} chs
  </option>
))}
  </Form.Select>
</Form.Group>

            {/* TIPO DE OCORRÊNCIA (RADIO BUTTONS) */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small text-dark d-block">Tipo de Ocorrência</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="opcao-perda-total"
                  name="tipoOcorrencia"
                  label="Opção A: Perda Total (100% Desperdício)"
                  checked={tipoOcorrencia === 'DESPERDICIO_TOTAL'}
                  onChange={() => setTipoOcorrencia('DESPERDICIO_TOTAL')}
                  className="small fw-medium text-danger"
                />
                <Form.Check
                  type="radio"
                  id="opcao-reaproveitamento"
                  name="tipoOcorrencia"
                  label="Opção B: Reaproveitamento (Retalho)"
                  checked={tipoOcorrencia === 'REAPROVEITADA'}
                  onChange={() => setTipoOcorrencia('REAPROVEITADA')}
                  className="small fw-medium text-success"
                />
              </div>
            </Form.Group>

            {/* INPUT NUMÉRICO CONDICIONAL (M² REAPROVEITADO) */}
            {tipoOcorrencia === 'REAPROVEITADA' && (
              <Form.Group className="mb-3 p-3 bg-light rounded border border-success-subtle">
                <Form.Label className="fw-semibold small text-success">M² Reaproveitado (Salvo)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 1.45"
                  value={m2Reaproveitado}
                  onChange={(e) => setM2Reaproveitado(e.target.value)}
                  required
                  className="shadow-none"
                />
                <Form.Text className="text-muted small">
                  Informe a metragem total reaproveitada pós-corte para o estoque de retalhos.
                </Form.Text>
              </Form.Group>
            )}
          </Modal.Body>

          <Modal.Footer className="border-0 bg-light">
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" disabled={submitting} className="fw-bold">
              {submitting ? <Spinner animation="border" size="sm" /> : 'Confirmar e Efetuar Baixa'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Container>
  );
}