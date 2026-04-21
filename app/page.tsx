import LaudoSystem from '@/components/LaudoSystem'
import { getLaudos, getBoatTemplates, getNextLaudoNum, getEngenheiros } from './actions'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const laudos = await getLaudos()
  const boats = await getBoatTemplates()
  const nextNum = await getNextLaudoNum()
  const engenheiros = await getEngenheiros()

  return (
    <main>
      <LaudoSystem
        initialLaudos={laudos}
        initialBoats={boats}
        nextNum={nextNum}
        initialEngenheiros={engenheiros}
      />
    </main>
  )
}
