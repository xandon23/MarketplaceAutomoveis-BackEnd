import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import Proposal from "../models/Proposal";
import User from "../models/User";
import Vehicle from "../models/Vehicle";
import VehicleImage from "../models/VehicleImage";

export default class ProposalController {
  static async create(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const loggedUserId = req.userId; // O cara que está tentando comprar
      // Extraímos o offeredVehicleId que você adicionou
      const { targetVehicleId, cashOffer, offeredVehicleId } = req.body;

      // 1. Validação de Valor da Oferta (Permitimos 0 caso seja troca chave na chave)
      if (!offeredVehicleId && cashOffer <= 0) {
        // Se NÃO tem carro na troca, o valor tem que ser obrigatóriamente maior que zero
        return res.status(400).json({
          error:
            "O valor da proposta deve ser maior que zero quando não há veículo oferecido na troca.",
        });
      }

      if (offeredVehicleId && cashOffer < 0) {
        // Se TEM carro na troca, aceitamos R$ 0, mas nunca valor negativo
        return res.status(400).json({
          error: "O valor em dinheiro da proposta não pode ser negativo.",
        });
      }

      // 2. Buscamos o veículo alvo no banco para saber quem é o dono
      const vehicle = await Vehicle.findByPk(targetVehicleId);

      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado." });
      }

      // 3. Regra de Ouro: Vendedor não pode fazer proposta no próprio carro
      if (vehicle.userId === loggedUserId) {
        return res.status(400).json({
          error:
            "Operação bloqueada: Você não pode fazer uma proposta no seu próprio veículo.",
        });
      }

      // 4. Regra: O carro alvo ainda pode receber propostas?
      if (vehicle.status !== "available") {
        return res.status(400).json({
          error: "Este veículo já foi vendido ou não está mais disponível.",
        });
      }

      // 5. NOVA REGRA: Validação do carro de troca (Trade-in)
      if (offeredVehicleId) {
        const offeredVehicle = await Vehicle.findByPk(offeredVehicleId);

        // O carro de troca existe e é de quem está logado? (Código do seu print)
        if (!offeredVehicle || offeredVehicle.userId !== loggedUserId) {
          return res
            .status(403)
            .json({ error: "O veículo de troca deve pertencer a você." });
        }

        // Trava de Segurança Bônus: O carro oferecido não pode já ter sido vendido!
        if (offeredVehicle.status !== "available") {
          return res.status(400).json({
            error:
              "O veículo que você está oferecendo na troca já foi vendido ou não está disponível.",
          });
        }
      }

      // Passou por todas as travas de segurança? Salva a proposta!
      const newProposal = await Proposal.create({
        targetVehicleId,
        buyerId: loggedUserId,
        cashOffer,
        offeredVehicleId: offeredVehicleId || null, // Salva o ID do carro de troca (ou nulo se for só dinheiro)
        status: "pending", // Toda proposta nasce como 'pendente'
        message: req.body.message || null, // Mensagem opcional para o vendedor (ex: "Pago à vista se fechar hoje")
      });

      return res.status(201).json({
        message: "Proposta enviada com sucesso!",
        proposal: newProposal,
      });
    } catch (error: any) {
      // 👇 Esta linha vai imprimir no terminal a fofoca inteira do Sequelize!
      console.error("💥 ERRO REAL DO SEQUELIZE:", error);

      // 👇 E aqui devolvemos a mensagem técnica pro teste ver
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateStatus(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const { id } = req.params; // ID da Proposta
      const { status } = req.body; // 'PENDING' ou 'REJECTED'
      const loggedUserId = req.userId;

      // Apenas permitimos esses dois status manuais nesta rota
      if (!["PENDING", "ACCEPTED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          error: "Status inválido. Use 'PENDING', 'ACCEPTED' ou 'REJECTED'.",
        });
      }

      // 1. Buscamos a proposta e trazemos os dados do veículo junto
      const proposal = await Proposal.findByPk(String(id), {
        include: [
          { model: Vehicle, as: "targetVehicle" },
          { model: Vehicle, as: "offeredVehicle" }, // 👈 ADICIONE ESTA LINHA!
        ],
      });

      if (!proposal)
        return res.status(404).json({ error: "Proposta não encontrada." });

      // 2. Trava de Segurança: Só o dono do carro pode mudar o status da proposta
      if (proposal.targetVehicle?.userId !== loggedUserId) {
        return res.status(403).json({
          error:
            "Apenas o proprietário do veículo pode alterar o status da proposta.",
        });
      }

      // 3. Atualizamos a proposta
      await proposal.update({ status });

      // Mensagens personalizadas para o Front-end
      const message =
        status === "PENDING"
          ? "Negociação iniciada! O contato do comprador foi liberado."
          : "Negociação cancelada. A proposta foi recusada.";

      return res.status(200).json({ message, proposal });
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: "Erro interno ao atualizar status da proposta." });
    }
  }

  // GET: Listar propostas recebidas por um veículo
  static async getByVehicle(
    req: AuthRequest,
    res: Response,
  ): Promise<Response> {
    try {
      const targetVehicleId = req.params.vehicleId;
      if (!targetVehicleId) {
        return res
          .status(400)
          .json({ error: "ID do veículo não foi fornecido na rota." });
      }
      const proposals = await Proposal.findAll({
        where: { targetVehicleId: targetVehicleId },
        include: [
          { model: User, as: "buyer", attributes: ["name", "phone"] },
          { model: Vehicle, as: "offeredVehicle" },
        ],
      });
      return res.status(200).json(proposals);
    } catch (error: any) {
      console.error("💥 ERRO REAL DO SEQUELIZE NO GET:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Buscar os detalhes de uma única proposta pelo ID
  static async getById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      // Confirme se no seu arquivo de rotas o parâmetro chama ':id' (ex: router.get('/:id', ...))
      const proposalId = req.params.id;

      if (!proposalId) {
        return res
          .status(400)
          .json({ error: "ID da proposta não foi fornecido na rota." });
      }

      const proposal = await Proposal.findByPk(String(proposalId), {
        include: [
          { model: User, as: "buyer", attributes: ["name", "phone", "email"] },
          {
            model: Vehicle,
            as: "offeredVehicle",
            include: [
              { model: VehicleImage, as: "images" }, // 👈 A MÁGICA ESTÁ AQUI! Traz as fotos junto.
            ],
          },
        ],
      });

      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada." });
      }

      return res.status(200).json(proposal);
    } catch (error: any) {
      console.error("💥 ERRO REAL DO SEQUELIZE NO GET BY ID:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
