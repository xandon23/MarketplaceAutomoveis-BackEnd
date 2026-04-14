import request from "supertest";
import { describe, it, expect, beforeAll } from "vitest";
import sequelize from "../src/config/database";
import app from "../src/app"; // Ajuste o caminho se o seu app.ts estiver em outro lugar

describe("Suite de Testes: Cadastro de Usuário (AutoZoom)", () => {
  // Isso aqui é o "Despertador" do banco para o teste
  beforeAll(async () => {
    // Garante que o Sequelize carregou os Models e a conexão
    await sequelize.authenticate();
    // Opcional: await sequelize.sync();
  });

  it("🔴 Deve bloquear o cadastro de menores de 18 anos", async () => {
    const response = await request(app).post("/users").send({
      name: "Menor Aprendiz",
      email: "menor@gmail.com",
      password: "SenhaForte@123",
      cpf: "04015594916",
      birthDate: "2015-01-01", // Idade inválida
      phone: "4499999999",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("18 anos");
  });

  it("🔴 Deve bloquear cadastro com CPF inválido", async () => {
    const response = await request(app).post("/users").send({
      name: "Hacker Silva",
      email: "hacker@gmail.com",
      password: "SenhaForte@123",
      cpf: "11111111111", // CPF falso
      birthDate: "2000-01-01",
      phone: "4499999999",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("CPF");
  });

  it("🟢 Deve cadastrar um usuário válido com sucesso", async () => {
    const response = await request(app).post("/users").send({
      name: "Alexandre Avaliação",
      email: `alexandre_@test.com`, // Email único para não dar conflito
      password: "SenhaForte@123",
      cpf: "68064904099", // Use um CPF gerado válido aqui
      birthDate: "1995-05-10",
      phone: "4499999999",
    });

    // Se retornar 201, o cadastro funcionou!
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
  });
});
