import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({
        data: data,
    });
};

export const findAllPlantas = async (filtros: Prisma.PlantaWhereInput) => {
    return await prisma.planta.findMany({
        where: filtros,
        orderBy: { id: "asc" },
    });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({
        where: { id: id }
    });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({
        where: { id: id },
        data: data,
    });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({
        where: { id: id }
    });
};

export const venderPlanta = async (id: number, quantidade: number) => {
    const resultado = await prisma.planta.updateMany({
        where: {
            id: id,
            estoque: { gte: quantidade },
        },
        data: {
            estoque: { decrement: quantidade },
        },
    });

    return resultado.count;
};

export const findPrecoEEstoque = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};
