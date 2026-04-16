import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/app";
import Proposal from "../src/models/Proposal";
import Vehicle from "../src/models/Vehicle";
import User from "../src/models/User";
import jwt from "jsonwebtoken";

describe("Suite de Testes: Fluxo de Negociação e Venda", () => {
  let tokenVendedor: string;
  let tokenComprador: string;
  let veiculoId: string;
  let propostaGanhadoraId: string;
  let comprador1Id: string;

  beforeAll(async () => {
    await Proposal.destroy({ where: {} });
    await Vehicle.destroy({ where: {} });
    await User.destroy({ where: {} });

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
    comprador1Id = comprador1.id;

    const comprador2 = await User.create({
      name: "Maria Perdedora",
      email: "maria@teste.com",
      cpf: "55199232991",
      phone: "11999999999",
      password: "Senha@123",
      birthDate: new Date("1990-01-01"),
    });

    const JWT_SECRET =
      process.env.JWT_SECRET || "SuaChaveSecretaSuperDificil123";

    tokenVendedor = jwt.sign({ id: vendedor.id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    tokenComprador = jwt.sign({ id: comprador1.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const veiculo = await Vehicle.create({
      brand: "Volkswagen",
      model: "Gol",
      manufactureYear: 2020,
      modelYear: 2021,
      price: 50000,
      userId: vendedor.id,
      status: "available",
      location: "Campo Mourão - PR",
      engine: "1.0 MPI",
      transmission: "Manual",
      mileage: 45000,
      description: "Carro de teste impecável",
      features: ["Ar-condicionado", "Direção hidráulica"],
    });
    veiculoId = veiculo.id;

    const propostaGanhadora = await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador1.id,
      cashOffer: 48000,
      status: "PENDING",
    });
    propostaGanhadoraId = propostaGanhadora.id;

    await Proposal.create({
      targetVehicleId: veiculo.id,
      buyerId: comprador2.id,
      cashOffer: 45000,
      status: "PENDING",
    });
  });

  it("🟢 Deve iniciar a negociação de uma proposta pendente", async () => {
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
      .set("Authorization", `Bearer ${tokenComprador}`)
      .send({
        status: "PENDING",
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("Acesso negado");
  });

  it("🟢 Deve finalizar a venda, marcar carro como vendido e recusar outras propostas", async () => {
    const response = await request(app)
      .patch(`/vehicles/${veiculoId}/sell`)
      .set("Authorization", `Bearer ${tokenVendedor}`)
      .send({
        buyerId: comprador1Id,
      });
    expect(response.status).toBe(200);
    expect(response.body.message).toContain("Venda finalizada com sucesso");

    const soldVehicle = await Vehicle.findByPk(veiculoId);
    expect(soldVehicle?.status).toBe("sold");

    const winningProposal = await Proposal.findByPk(propostaGanhadoraId);
    expect(winningProposal?.status).toBe("ACCEPTED");

    const lostProposal = await Proposal.findOne({
      where: {
        targetVehicleId: veiculoId,
        status: "REJECTED",
      },
    });

    expect(lostProposal).not.toBeNull();
  });
});
