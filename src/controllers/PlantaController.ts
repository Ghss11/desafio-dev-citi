import { Request, Response } from 'express';
import { Luminosidade } from '@prisma/client';
import * as PlantaRepository from '@repositories/PlantaRepository';

const CAMPOS_OBRIGATORIOS = [
  'nome', 'especie', 'preco', 'estoque',
  'luminosidade', 'petFriendly', 'regaACadaDias',
];

const validarPlanta = (dados: any, parcial: boolean): string | null => {
  // 1. No cadastro, todos os campos são obrigatórios
  if (!parcial) {
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (dados[campo] === undefined) {
        return `O campo ${campo} é obrigatório.`;
      }
    }
  }

  // 2. Cada campo enviado precisa ter um valor válido
  const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = dados;

  if (nome !== undefined && !(typeof nome === 'string' && nome.trim() !== '')) {
    return 'O nome deve ser um texto não vazio.';
  }

  if (especie !== undefined && !(typeof especie === 'string' && especie.trim() !== '')) {
    return 'A espécie deve ser um texto não vazio.';
  }

  if (preco !== undefined && !(Number.isInteger(preco) && preco > 0)) {
    return 'O preço deve ser um número inteiro maior que zero, em centavos (ex.: 8990 para R$ 89,90).';
  }

  if (estoque !== undefined && !(Number.isInteger(estoque) && estoque >= 0)) {
    return 'O estoque deve ser um número inteiro maior ou igual a zero.';
  }

  if (regaACadaDias !== undefined && !(Number.isInteger(regaACadaDias) && regaACadaDias >= 1)) {
    return 'O campo regaACadaDias deve ser um número inteiro de pelo menos 1.';
  }

  if (luminosidade !== undefined && !(Object.values(Luminosidade).includes(luminosidade))) {
    return 'A luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.';
  }

  if (petFriendly !== undefined && !(typeof petFriendly === 'boolean')) {
    return 'O campo petFriendly deve ser true ou false.';
  }

  return null;
};

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const erro = validarPlanta(req.body, false);

    if (erro !== null) {
      return res.status(400).json({ message: erro });
    }

    const planta = await PlantaRepository.createPlanta({
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(201).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao cadastrar planta.' });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'O id deve ser um número inteiro maior que zero.' });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (planta === null) {
      return res.status(404).json({ message: `Não existe planta com o id ${id}.` });
    }

    return res.status(200).json(planta);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao buscar planta.' });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'O id deve ser um número inteiro maior que zero.' });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (planta === null) {
      return res.status(404).json({ message: `Não existe planta com o id ${id}.` });
    }

    await PlantaRepository.deletePlanta(id);

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao remover planta.' });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'O id deve ser um número inteiro maior que zero.' });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (planta === null) {
      return res.status(404).json({ message: `Não existe planta com o id ${id}.` });
    }

    const erro = validarPlanta(req.body, true);

    if (erro !== null) {
      return res.status(400).json({ message: erro });
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = req.body;

    const plantaAtualizada = await PlantaRepository.updatePlanta(id, {
      nome,
      especie,
      preco,
      estoque,
      luminosidade,
      petFriendly,
      regaACadaDias,
    });

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao editar planta.' });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
        const { luminosidade, petFriendly, nome, ordem } = req.query;

    if (luminosidade !== undefined && !Object.values(Luminosidade).includes(luminosidade as Luminosidade)) {
      return res.status(400).json({ message: 'O filtro luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO.' });
    }

    if (petFriendly !== undefined && petFriendly !== 'true' && petFriendly !== 'false') {
      return res.status(400).json({ message: 'O filtro petFriendly deve ser true ou false.' });
    }

    if (nome !== undefined && typeof nome !== 'string') {
      return res.status(400).json({ message: 'O filtro nome deve ser um texto.' });
    }

    if (ordem !== undefined && ordem !== 'preco' && ordem !== 'nome') {
      return res.status(400).json({ message: 'O parâmetro ordem deve ser preco ou nome.' });
    }

        const plantas = await PlantaRepository.findAllPlantas(
      {
        luminosidade: luminosidade as Luminosidade | undefined,
        petFriendly: petFriendly === undefined ? undefined : petFriendly === 'true',
        nome: nome === undefined ? undefined : { contains: nome, mode: 'insensitive' },
      },
      ordem === 'preco' ? { preco: 'asc' } : ordem === 'nome' ? { nome: 'asc' } : { id: 'asc' },
    );

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao listar plantas.' });
  }
};

export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'O id deve ser um número inteiro maior que zero.' });
    }

    const { quantidade } = req.body;

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return res.status(400).json({ message: 'A quantidade deve ser um número inteiro maior que zero.' });
    }

    const planta = await PlantaRepository.findPlantaById(id);

    if (planta === null) {
      return res.status(404).json({ message: `Não existe planta com o id ${id}.` });
    }

    if (planta.estoque < quantidade) {
      return res.status(400).json({
        message: `Estoque insuficiente: temos só ${planta.estoque} vasos de ${planta.nome}.`,
      });
    }

    const vendida = await PlantaRepository.venderPlanta(id, quantidade);

    if (vendida === 0) {
      return res.status(400).json({
        message: 'Estoque insuficiente: outra venda foi registrada ao mesmo tempo. Consulte o estoque e tente novamente.',
      });
    }

    const plantaAtualizada = await PlantaRepository.findPlantaById(id);

    return res.status(200).json(plantaAtualizada);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao registrar venda.' });
  }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPrecoEEstoque();

    let valorTotalEmCentavos = 0;
    let totalDeVasos = 0;

    for (const planta of plantas) {
      valorTotalEmCentavos += planta.preco * planta.estoque;
      totalDeVasos += planta.estoque;
    }

    return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao calcular o valor do estoque.' });
  }
};

export const readPlantasEsgotadas = async (req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPlantasEsgotadas();

    return res.status(200).json(plantas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao listar plantas esgotadas.' });
  }
};

