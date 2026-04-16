import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/app";
import User from "../src/models/User";
import Vehicle from "../src/models/Vehicle";
import jwt from "jsonwebtoken";

describe("Suite de Testes: Segurança e Autenticação", () => {
  let tokenUsuarioA: string;
  let usuarioAId: string;
  let usuarioBId: string;
  let veiculoAId: string;

  const JWT_SECRET = process.env.JWT_SECRET || "SuaChaveSecretaSuperDificil123";

  beforeAll(async () => {
    await Vehicle.destroy({ where: {} });
    await User.destroy({ where: {} });

    const userA = await User.create({
      name: "Usuario A",
      email: "a@test.com",
      cpf: "11122233344",
      phone: "11999999999",
      password: "SenhaForte@123",
      birthDate: "1990-01-01",
    });
    usuarioAId = userA.id;
    tokenUsuarioA = jwt.sign({ id: userA.id }, JWT_SECRET, { expiresIn: "1h" });

    const userB = await User.create({
      name: "Usuario B",
      email: "b@test.com",
      cpf: "55566677788",
      phone: "11999999999",
      password: "SenhaForte@123",
      birthDate: "1990-01-01",
    });
    usuarioBId = userB.id;

    const veiculo = await Vehicle.create({
      brand: "Fiat",
      model: "Uno",
      manufactureYear: 2010,
      modelYear: 2011,
      price: 15000,
      userId: usuarioAId,
      status: "available",
      location: "PR",
      engine: "1.0",
      transmission: "Manual",
      mileage: 100000,
      description: "Firme",
    });
    veiculoAId = veiculo.id;
  });

  it("🟢 [LOGIN] Deve logar com sucesso e retornar JWT", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "a@test.com",
      password: "SenhaForte@123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("🔴 [LOGIN] Deve bloquear senha incorreta", async () => {
    const res = await request(app).post("/auth/login").send({
      email: "a@test.com",
      password: "SenhaErrada123",
    });
    expect(res.status).toBe(401);
  });

  it("🔴 [USER] Não deve permitir que um usuário edite outro", async () => {
    const res = await request(app)
      .put(`/users/${usuarioBId}`)
      .set("Authorization", `Bearer ${tokenUsuarioA}`)
      .send({ name: "Hacker" });
    expect(res.status).toBe(403);
  });

  it("🔴 [USER] Deve ignorar ou bloquear alteração de e-mail no update", async () => {
    const res = await request(app)
      .put(`/users/${usuarioAId}`)
      .set("Authorization", `Bearer ${tokenUsuarioA}`)
      .send({ email: "novoemail@test.com", name: "Alexandre" });

    const userCheck = await User.findByPk(usuarioAId);
    expect(userCheck?.email).toBe("a@test.com");
  });

  it("🔴 [VEHICLE] Deve impedir que usuário B delete veículo do usuário A", async () => {
    const tokenB = jwt.sign({ id: usuarioBId }, JWT_SECRET, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .delete(`/vehicles/${veiculoAId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain("Proprietário");
  });
});
