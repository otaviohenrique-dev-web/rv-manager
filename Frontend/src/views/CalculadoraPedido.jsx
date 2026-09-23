import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaCalculator, FaFilePdf, FaWhatsapp } from 'react-icons/fa';
import api from '../services/api';

export default function CalculadoraPedido() {
  const [formData, setFormData] = useState({ descricao: 'Incolor', espessura: '4mm', altura: '', largura: '', quantidade: 1 });
  const [calculo, setCalculo] = useState({ totalM2: 0, valorTotal: 0 });
  const [romaneioGerado, setRomaneioGerado] = useState(false);

  // Executa o cálculo físico/financeiro simulando o algoritmo de cubagem da chapa do back
  useEffect(() => {
    const { altura, largura, quantidade } = formData;
    if (altura && largura) {
      const m2Item = parseFloat(altura) * parseFloat(largura) * parseInt(quantidade);
      // Preço base fictício por m² variando por espessura para fins de simulação de interface
      const precoBase = formData.espessura === '5mm' ? 42.00 : 25.50;
      setCalculo({
        totalM2: parseFloat(m2Item.toFixed(3)),
        valorTotal: m2Item * precoBase
      });
    } else {
      setCalculo({ totalM2: 0, valorTotal: 0 });
    }
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGerarRomaneio = () => {
    setRomaneioGerado(true);
  };

  const handleEnviarWhatsapp = () => {
    const msg = `*RV MANAGER - NOVO PEDIDO*%0AChapa: ${formData.descricao} ${formData.espessura}%0AMetragem Total: ${calculo.totalM2} m²%0AValor: R$ ${calculo.valorTotal.toFixed(2)}`;
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  return (
    <Container fluid className="px-4 pb-4">
      <Row className="g-4">
        {/* Formulário de Lançamento */}
        <Col xs={12} lg={7}>
          <Card className="border-0 shadow-sm p-4">
            <h5 className="fw-bold text-dark mb-4 text-uppercase small d-flex align-items-center">
              <FaCalculator className="me-2" style={{ color: '#134074' }} /> Calculadora de Cubagem de Chapas
            </h5>
            <Form>
              <Row className="g-3 mb-3">
                <Form.Group as={Col} xs={12} md={6}>
                  <Form.Label className="small fw-semibold text-muted">Descrição do Vidro</Form.Label>
                  <Form.Select name="descricao" value={formData.descricao} onChange={handleChange}>
                    <option>Incolor</option>
                    <option>Espelho Eco Prata</option>
                    <option>Espelho Premium AGC</option>
                    <option>Espelho Bronze</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} xs={12} md={6}>
                  <Form.Label className="small fw-semibold text-muted">Espessura</Form.Label>
                  <Form.Select name="espessura" value={formData.espessura} onChange={handleChange}>
                    <option>3mm</option>
                    <option>4mm</option>
                    <option>5mm</option>
                  </Form.Select>
                </Form.Group>
              </Row>
              <Row className="g-3 mb-4">
                <Form.Group as={Col} xs={4}>
                  <Form.Label className="small fw-semibold text-muted">Altura (m)</Form.Label>
                  <Form.Control type="number" step="0.001" name="altura" value={formData.altura} onChange={handleChange} placeholder="ex: 2.20" />
                </Form.Group>
                <Form.Group as={Col} xs={4}>
                  <Form.Label className="small fw-semibold text-muted">Largura (m)</Form.Label>
                  <Form.Control type="number" step="0.001" name="largura" value={formData.largura} onChange={handleChange} placeholder="ex: 1.605" />
                </Form.Group>
                <Form.Group as={Col} xs={4}>
                  <Form.Label className="small fw-semibold text-muted">Qtd (Chapas)</Form.Label>
                  <Form.Control type="number" name="quantidade" value={formData.quantidade} onChange={handleChange} min="1" />
                </Form.Group>
              </Row>
            </Form>
          </Card>
        </Col>

        {/* Resumo Financeiro & Romaneio */}
        <Col xs={12} lg={5}>
          <Card className="border-0 shadow-sm p-4 text-center h-100 d-flex flex-column justify-content-between" style={{ backgroundColor: '#FFF' }}>
            <div>
              <h6 className="text-muted text-uppercase small fw-bold mb-3">Resumo Técnico do Lote</h6>
              <div className="p-3 mb-3 bg-light rounded">
                <span className="text-muted d-block small uppercase fw-semibold">Metragem Quadrada Total</span>
                <h2 className="fw-bold text-dark mb-0">{calculo.totalM2} m²</h2>
              </div>
              <div className="p-3 mb-4 bg-light rounded">
                <span className="text-muted d-block small uppercase fw-semibold">Valor Bruto Calculado</span>
                <h2 className="fw-bold text-success mb-0">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculo.valorTotal)}
                </h2>
              </div>
            </div>

            <div className="d-grid gap-2">
              <Button variant="outline-dark" className="fw-semibold d-flex align-items-center justify-content-center p-2.5" onClick={handleGerarRomaneio} disabled={calculo.totalM2 === 0}>
                <FaFilePdf className="me-2" /> Gerar Romaneio PDF
              </Button>
              {romaneioGerado && (
                <Button variant="success" className="fw-semibold d-flex align-items-center justify-content-center p-2.5" onClick={handleEnviarWhatsapp}>
                  <FaWhatsapp className="me-2" /> Transmitir Romaneio via WhatsApp
                </Button>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {romaneioGerado && (
        <Alert variant="success" className="mt-4 border-0 shadow-sm animate__animated animate__fadeIn">
          <Alert.Heading className="fs-6 fw-bold">Romaneio de Produção Gerado com Sucesso!</Alert.Heading>
          <p className="mb-0 small">O layout de impressão limpo foi montado. O arquivo está pronto para ser enviado para a linha de corte e expedição.</p>
        </Alert>
      )}
    </Container>
  );
}