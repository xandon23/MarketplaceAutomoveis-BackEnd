import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import sequelize from "../src/config/database";
import app from "../src/app";

describe("Suite de Testes: Cadastro de Usuário (AutoZoom)", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  it("🔴 Deve bloquear o cadastro de menores de 18 anos", async () => {
    const response = await request(app).post("/users").send({
      name: "Menor Aprendiz",
      email: "menor@gmail.com",
      password: "SenhaForte@123",
      cpf: "04015594916",
      birthDate: "2015-01-01",
      phone: "4499999999",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("Menor de idade");
  });

  it("🔴 Deve bloquear cadastro com CPF inválido", async () => {
    const response = await request(app).post("/users").send({
      name: "Hacker Silva",
      email: "hacker@gmail.com",
      password: "SenhaForte@123",
      cpf: "11111111111",
      birthDate: "2000-01-01",
      phone: "4499999999",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("CPF");
  });

  it("🟢 Deve cadastrar um usuário válido com sucesso", async () => {
    const response = await request(app).post("/users").send({
      name: "Alexandre Avaliação",
      email: `alexandre_@test.com`,
      password: "SenhaForte@123",
      cpf: "68064904099",
      birthDate: "1995-05-10",
      phone: "4499999999",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});
