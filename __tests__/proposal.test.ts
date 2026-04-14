import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/app";
import Proposal from "../src/models/Proposal";
import Vehicle from "../src/models/Vehicle";
import User from "../src/models/User";
import jwt from "jsonwebtoken";
import { promiseHooks } from "node:v8";

describe("Suite de Testes: Fluxo de Negociação e Venda", () => {
  // Variáveis globais para usarmos nos testes lá embaixo
  let tokenVendedor: string;
  let tokenComprador: string;
  let veiculoId: string;
  let propostaGanhadoraId: string;

  beforeAll(async () => {
    // 1. FAXINA: Limpa o banco de dados antes de começar para evitar erro de "CPF já cadastrado"
    await Proposal.destroy({ where: {} });
    await Vehicle.destroy({ where: {} });
    await User.destroy({ where: {} });

    // 2. CRIANDO OS ATORES: O Vendedor e o Comprador
    const vendedor = await User.create({
      name: "Vendedor AutoZoom",
      email: "vendedor@teste.com",
      cpf: "59398292955",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    const comprador1 = await User.create({
      name: "João Comprador",
      email: "joao@teste.com",
      cpf: "37458099984",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    const comprador2 = await User.create({
      name: "Maria Perdedora",
      email: "maria@teste.com",
      cpf: "55199232991",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    // ATENÇÃO: Use a mesma palavra secreta que está no seu authMiddleware ou .env
    const JWT_SECRET =
      process.env.JWT_SECRET || "SuaChaveSecretaSuperDificil123";

    // O payload precisa ser igual ao que o seu middleware espera (geralmente { id: usuario.id })
    tokenVendedor = jwt.sign({ id: vendedor.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    tokenComprador = jwt.sign({ id: comprador1.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // 3. CRIANDO O CENÁRIO: O Veículo do Vendedor
    const veiculo = await Vehicle.create({
      brand: "Volkswagen",
      model: "Gol",
      manufactureYear: 2020,
      modelYear: 2021,
      price: 50000,
      userId: vendedor.id, // O carro é do vendedor
      status: "available",
      location: "Campo Mourão - PR",
      engine: "1.0 MPI",
      transmission: "Manual",
      mileage: 45000,
      description: "Carro de teste impecável",
      features: ["Ar-condicionado", "Direção hidráulica"],
    });
    veiculoId = veiculo.id;

    // 4. CRIANDO A AÇÃO: Duas propostas pendentes para o mesmo carro
    const propostaGanhadora = await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador1.id, // Proposta do João
      cashOffer: 48000,
      status: "PENDING",
    });
    propostaGanhadoraId = propostaGanhadora.id;

    await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador2.id, // Proposta da Maria
      cashOffer: 45000,
      status: "PENDING",
    });
  });

  it("🟢 Deve iniciar a negociação de uma proposta pendente", async () => {
    // Supondo que você já tenha criado um veículo (ID 1) e uma proposta (ID 1) no banco
    const response = await request(app)
      .patch(`/proposals/${propostaGanhadoraId}/status`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({
        status: "PENDING",
      });

    console.log("💥 RESPOSTA DA API:", response.body);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("Negociação iniciada");
    expect(response.body.proposal.status).toBe("PENDING");
  });

  it("🔴 Deve bloquear alteração de status se não for o dono do carro", async () => {
    const response = await request(app)
      .patch(`/proposals/${propostaGanhadoraId}/status`)
      .set("Authorization", `Bearer ${tokenComprador}`) // Um token de um usuário aleatório
      .send({
        status: "PENDING",
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("Apenas o proprietário");
  });

  it("🟢 Deve finalizar a venda, marcar carro como vendido e recusar outras propostas", async () => {
    // ID 1 = O carro
    // ID 10 = A proposta que ganhou
    // (Presumindo que existe uma proposta ID 11 pendente no banco para esse mesmo carro)

    const response = await request(app)
      .patch(`/vehicles/${veiculoId}/sell`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({
        winningProposalId: propostaGanhadoraId,
      });

    // 1. Verifica se a rota respondeu com sucesso
    expect(response.status).toBe(200);
    expect(response.body.message).toContain("Venda finalizada com sucesso");

    // 2. Busca o carro direto no banco para ver se o status mudou
    // IMPORTANTE: Importe o Model Vehicle no topo do arquivo de teste
    const soldVehicle = await Vehicle.findByPk(veiculoId);
    expect(soldVehicle?.status).toBe("sold");

    // 3. Busca a proposta vencedora para ver se mudou para 'ACCEPTED'
    const winningProposal = await Proposal.findByPk(propostaGanhadoraId);
    expect(winningProposal?.status).toBe("ACCEPTED");

    // 4. A Prova Final: A outra proposta foi recusada?
    // Busca qualquer proposta desse carro que tenha ficado com o status 'REJECTED'
    const lostProposal = await Proposal.findOne({
      where: {
        targetVehicleId: veiculoId,
        status: "REJECTED",
      },
    });

    // Garante que o banco achou a proposta rejeitada!
    expect(lostProposal).not.toBeNull();
  });
});
