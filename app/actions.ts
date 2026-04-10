'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getLaudos() {
  return await prisma.laudo.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function getLaudo(num: string) {
  return await prisma.laudo.findUnique({
    where: { num }
  })
}

export async function getBoatTemplates() {
  return await prisma.boatTemplate.findMany({
    orderBy: { fabricante: 'asc' }
  })
}

export async function saveLaudo(data: any) {
  const existing = await prisma.laudo.findUnique({ where: { num: data.num } })
  if (existing) {
    await prisma.laudo.update({
      where: { num: data.num },
      data: {
        fabricante: data.fabricante,
        modelo: data.modelo,
        destino: data.destino,
        data: data.data,
        cidade: data.cidade,
        specs: data.specs,
      }
    })
  } else {
    await prisma.laudo.create({
      data: {
        num: data.num,
        fabricante: data.fabricante,
        modelo: data.modelo,
        destino: data.destino,
        data: data.data,
        cidade: data.cidade,
        specs: data.specs,
      }
    })
    
    const numValue = parseInt(data.num.split('/')[0])
    if (!isNaN(numValue)) {
      const config = await prisma.appConfig.findUnique({ where: { key: 'laudoCounter' } })
      const currentVal = config ? parseInt(config.value) : 0
      if (numValue > currentVal) {
        await prisma.appConfig.upsert({
          where: { key: 'laudoCounter' },
          update: { value: numValue.toString() },
          create: { key: 'laudoCounter', value: numValue.toString() }
        })
      }
    }
  }

  if (data.fabricante && data.modelo) {
    await prisma.boatTemplate.upsert({
      where: {
        fabricante_modelo: {
          fabricante: data.fabricante.toUpperCase(),
          modelo: data.modelo.toUpperCase()
        }
      },
      update: { specs: data.specs },
      create: {
        fabricante: data.fabricante.toUpperCase(),
        modelo: data.modelo.toUpperCase(),
        specs: data.specs
      }
    })
  }

  revalidatePath('/')
  return { success: true }
}

export async function deleteLaudo(num: string) {
  await prisma.laudo.delete({ where: { num } })
  revalidatePath('/')
  return { success: true }
}

export async function getNextLaudoNum() {
  const config = await prisma.appConfig.findUnique({ where: { key: 'laudoCounter' } })
  const lastUsed = config ? parseInt(config.value) : 0
  const nextNum = lastUsed + 1
  return `${String(nextNum).padStart(3, '0')}/${new Date().getFullYear()}`
}

export async function setLaudoCounter(num: number) {
  await prisma.appConfig.upsert({
    where: { key: 'laudoCounter' },
    update: { value: num.toString() },
    create: { key: 'laudoCounter', value: num.toString() }
  })
  revalidatePath('/')
  return { success: true }
}
