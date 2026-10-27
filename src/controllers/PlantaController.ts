import { Request, Response } from 'express';
import { Luminosidade } from '@prisma/client';
import * as PlantaRepository from '@repositories/PlantaRepository';

const CAMPOS_OBRIGATORIOS = [
  'nome', 'especie', 'preco', 'estoque',
  'luminosidade', 'petFriendly', 'regaACadaDias',
];

const validarPlanta = (dados: any, parcial: boolean): string | null => {
  // 1 - No cadastro, todos os campos são obrigatórios
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