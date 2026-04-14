'use client'

import { useState, useEffect, useRef } from 'react'
import { saveLaudo, deleteLaudo, setLaudoCounter } from '@/app/actions'

const SPECS_FIELDS = [
  { id: 'tipo', label: 'a) Tipo', default: 'bote' },
  { id: 'comprimento', label: 'b) Comprimento total', default: '5,95 m' },
  { id: 'boca', label: 'c) Boca máxima', default: '1,35 m' },
  { id: 'pontal', label: 'd) Pontal', default: '0,52 m' },
  { id: 'calado', label: 'e) Calado', default: '0,13 m' },
  { id: 'contorno', label: 'f) Contorno', default: '2,01 m' },
  { id: 'tripulantes', label: 'g) Número de Tripulantes', default: '01' },
  { id: 'passageiros', label: 'h) Número de Passageiros', default: '04' },
  { id: 'totalPessoas', label: 'i) Número total de pessoas', default: '05' },
  { id: 'ano', label: 'j) Ano de fabricação', default: '2026' },
  { id: 'material', label: 'k) Material', default: 'Alumínio' },
  { id: 'motorizacao', label: 'l) Motorização recomendada', default: 'Até 30 HP' },
  { id: 'proprietario', label: 'm) Proprietário', default: 'Nome do Cliente, CPF: 000.000.000-00' }
]

export default function LaudoSystem({ initialLaudos, initialBoats, nextNum }: any) {
  const [laudos, setLaudos] = useState(initialLaudos)
  const [boats, setBoats] = useState(initialBoats)
  const [isImporting, setIsImporting] = useState(false)
  
  const [num, setNum] = useState(nextNum)
  const [fabricante, setFabricante] = useState('')
  const [modelo, setModelo] = useState('')
  const [destino, setDestino] = useState('MARINHA DO BRASIL (AGÊNCIA FLUVIAL DE CÁCERES)')
  const [data, setData] = useState('')
  const [cidade, setCidade] = useState('Rondonópolis - MT')
  const [serie, setSerie] = useState('XXXX')
  const [specs, setSpecs] = useState<Record<string, string>>({})
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [creaImageBase64, setCreaImageBase64] = useState<string | null>(null)
  
  // Dados da segunda página (CREA)
  const [nomeProfissional, setNomeProfissional] = useState('Douglas Germano da Silva')
  const [registroCrea, setRegistroCrea] = useState('MT05440')
  const [tituloProfissional, setTituloProfissional] = useState('ENGENHEIRO MECÂNICO')
  const [cpfProfissional, setCpfProfissional] = useState('063.587.631-05')
  const [dataNascimento, setDataNascimento] = useState('22/05/1995')
  const [naturalidade, setNaturalidade] = useState('FOZ DO IGUAÇU PR')
  const [tipoSanguineo, setTipoSanguineo] = useState('O +')
  const [dataExpedicao, setDataExpedicao] = useState('23/12/2020')
  const [pis, setPis] = useState('27682919 559/MT')
  const [filiacao, setFiliacao] = useState('JOÃO GERMANO DA SILVA')
  
  const [toast, setToast] = useState<{msg: string, visible: boolean}>({ msg: '', visible: false })
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Generate default date
    const today = new Date()
    const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
    setData(`${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`)

    // Specs defaults
    const initialSpecs: any = {}
    SPECS_FIELDS.forEach(f => initialSpecs[f.id] = f.default)
    setSpecs(initialSpecs)

    // Check local logo
    const savedLogo = localStorage.getItem('sistemmar_logo')
    if (savedLogo) setLogoBase64(savedLogo)

    // Check local CREA image
    const savedCreaImage = localStorage.getItem('sistemmar_crea_image')
    if (savedCreaImage) setCreaImageBase64(savedCreaImage)
  }, [])

  const showToast = (msg: string) => {
    setToast({ msg, visible: true })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast({ msg: '', visible: false }), 3000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setLogoBase64(result)
      localStorage.setItem('sistemmar_logo', result)
      showToast("Logo atualizada!")
    }
    reader.readAsDataURL(file)
  }

  const handleCreaImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setCreaImageBase64(result)
      localStorage.setItem('sistemmar_crea_image', result)
      showToast("Carteira CREA atualizada!")
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    const payload = {
      num, fabricante, modelo, destino, data, cidade, specs: { ...specs, serie },
      // Dados profissionais (CREA)
      nomeProfissional, registroCrea, tituloProfissional, cpfProfissional, 
      dataNascimento, naturalidade, tipoSanguineo, dataExpedicao, pis, filiacao
    }
    
    // Save to DB via Server Action
    await saveLaudo(payload)

    showToast("Laudo salvo com sucesso!")
    
    // Update local state by forcing a refresh or optimistically
    // We update optimistically here for simplicity
    const existingIndex = laudos.findIndex((l: any) => l.num === num)
    if (existingIndex >= 0) {
      const newLaudos = [...laudos]
      newLaudos[existingIndex] = payload
      setLaudos(newLaudos)
    } else {
      setLaudos([payload, ...laudos])
    }

    // Reset num for next
    window.location.reload() // Quickest way to refresh SSR data
  }

  const handleEdit = (laudoNum: string) => {
    const laudo = laudos.find((l: any) => l.num === laudoNum)
    if (!laudo) return
    setNum(laudo.num)
    setFabricante(laudo.fabricante)
    setModelo(laudo.modelo)
    setDestino(laudo.destino || '')
    setData(laudo.data || '')
    setCidade(laudo.cidade || '')
    
    const loadedSpecs = { ...laudo.specs }
    setSerie(loadedSpecs.serie || 'XXXX')
    delete loadedSpecs.serie
    setSpecs(loadedSpecs)

    // Load professional data
    setNomeProfissional(laudo.nomeProfissional || 'Douglas Germano da Silva')
    setRegistroCrea(laudo.registroCrea || 'MT05440')
    setTituloProfissional(laudo.tituloProfissional || 'ENGENHEIRO MECÂNICO')
    setCpfProfissional(laudo.cpfProfissional || '063.587.631-05')
    setDataNascimento(laudo.dataNascimento || '22/05/1995')
    setNaturalidade(laudo.naturalidade || 'FOZ DO IGUAÇU PR')
    setTipoSanguineo(laudo.tipoSanguineo || 'O +')
    setDataExpedicao(laudo.dataExpedicao || '23/12/2020')
    setPis(laudo.pis || '27682919 559/MT')
    setFiliacao(laudo.filiacao || 'JOÃO GERMANO DA SILVA')

    showToast("Laudo carregado para edição!")
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (laudoNum: string) => {
    if (!confirm(`Excluir laudo ${laudoNum}?`)) return
    await deleteLaudo(laudoNum)
    setLaudos(laudos.filter((l: any) => l.num !== laudoNum))
    showToast("Laudo excluído!")
  }

  const handleAutoFill = (fab: string, mod: string) => {
    setFabricante(fab)
    setModelo(mod)
    const boat = boats.find((b: any) => b.fabricante === fab.toUpperCase() && b.modelo === mod.toUpperCase())
    if (boat) {
      const loadedSpecs = { ...boat.specs }
      delete loadedSpecs.serie // Do not override serial
      setSpecs(loadedSpecs)
      showToast("Especificações auto-preenchidas!")
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    showToast("Importando, aguarde...")
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(json)) throw new Error()
        let importedCount = 0
        for (const item of json) {
          if (item && item.num) {
            await saveLaudo(item)
            importedCount++
          }
        }
        showToast(`${importedCount} laudos importados da versão antiga!`)
        setTimeout(() => window.location.reload(), 2000)
      } catch (err) {
        showToast("Erro ao importar. Verifique o arquivo.")
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const handleSetCounter = async () => {
    const newVal = prompt("Digite o número do ÚLTIMO LAUDO já emitido (ex: 46):")
    if (!newVal) return
    const count = parseInt(newVal)
    if (!isNaN(count)) {
      await setLaudoCounter(count)
      showToast(`Próximo laudo ajustado para o número ${count + 1}!`)
      setTimeout(() => window.location.reload(), 1500)
    }
  }

  // Derived lists
  const fabricantes = Array.from(new Set(boats.map((b: any) => b.fabricante)))
  const modelosFiltrados = boats.filter((b: any) => b.fabricante === fabricante.toUpperCase()).map((b: any) => b.modelo)

  return (
    <>
      <header className="app-header">
        <div className="app-brand">
          <label className="app-logo-wrap" title="Clique para carregar a logo">
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo" />
            ) : (
              <span className="app-logo-placeholder">⚓</span>
            )}
            <span className="logo-upload-hint">ALTERAR LOGO</span>
            <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleLogoUpload} />
          </label>
          <div className="app-title-group">
            <div className="app-title">ENGTEC SOLUTIONS</div>
            <div className="app-sub">Emissão de Laudos Náuticos</div>
          </div>
        </div>
        <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
          <label className="btn btn-ghost btn-sm" style={{cursor: 'pointer'}} title="Importar backup (.json)">
            ⬇ Migrar Antigos
            <input type="file" accept=".json" style={{display: 'none'}} onChange={handleImport} disabled={isImporting} />
          </label>
          <button className="btn btn-ghost btn-sm" onClick={handleSetCounter}>🔢 Ajustar Contador</button>
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Imprimir Laudo</button>
          <button className="btn btn-primary" onClick={handleSave}>💾 Salvar Laudo</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>📝</span>
            Dados do Laudo
          </div>
          <div className="sidebar-body">
            
            <div className="form-section">
              <div className="form-section-title">Identificação</div>
              
              <div className="form-group">
                <label>Número do Laudo</label>
                <div className="input-row">
                  <input type="text" value={num} onChange={e => setNum(e.target.value)} style={{fontWeight: 'bold'}} />
                </div>
              </div>

              <div className="form-group">
                <label>Fabricante</label>
                <input 
                  type="text" 
                  list="listFab" 
                  value={fabricante} 
                  onChange={e => handleAutoFill(e.target.value, modelo)} 
                />
                <datalist id="listFab">
                  {fabricantes.map((f: any) => <option key={f} value={f} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>Modelo</label>
                <input 
                  type="text" 
                  list="listMod" 
                  value={modelo} 
                  onChange={e => handleAutoFill(fabricante, e.target.value)} 
                />
                <datalist id="listMod">
                  {modelosFiltrados.map((m: any) => <option key={m} value={m} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label>Destino do Laudo</label>
                <select value={destino} onChange={e => setDestino(e.target.value)}>
                  <option value="MARINHA DO BRASIL (AGÊNCIA FLUVIAL DE CÁCERES)">MARINHA DO BRASIL (AGÊNCIA FLUVIAL DE CÁCERES)</option>
                  <option value="CAPITANIA FLUVIAL DE MATO GROSSO">CAPITANIA FLUVIAL DE MATO GROSSO</option>
                </select>
              </div>

              <div className="form-group">
                <label>Número de Série</label>
                <input 
                  type="text" 
                  value={serie} 
                  onChange={e => setSerie(e.target.value)} 
                />
              </div>

            </div>

            <div className="form-section">
              <div className="form-section-title">Características Técnicas</div>
              {SPECS_FIELDS.map(f => (
                <div className="form-group" key={f.id}>
                  <label>{f.label}</label>
                  <input 
                    type="text" 
                    value={specs[f.id] || ''} 
                    onChange={e => setSpecs({...specs, [f.id]: e.target.value})} 
                  />
                </div>
              ))}
            </div>

            <div className="form-section">
              <div className="form-section-title">Local e Data</div>
              <div className="form-group">
                <label>Data</label>
                <input type="text" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Cidade / Estado</label>
                <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Dados Profissionais (CREA)</div>
              <div className="form-group">
                <label>Carteira CREA</label>
                <label className="btn btn-sm btn-ghost" style={{cursor: 'pointer', display: 'block', textAlign: 'center', width: '100%'}}>
                  📷 Upload Carteira
                  <input type="file" accept="image/*" style={{display: 'none'}} onChange={handleCreaImageUpload} />
                </label>
                {creaImageBase64 && <div style={{fontSize: '0.75rem', marginTop: '0.5rem', color: '#666'}}>✓ Carteira carregada</div>}
              </div>
              <div className="form-group">
                <label>Nome Profissional</label>
                <input type="text" value={nomeProfissional} onChange={e => setNomeProfissional(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Registro CREA</label>
                <input type="text" value={registroCrea} onChange={e => setRegistroCrea(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Título Profissional</label>
                <input type="text" value={tituloProfissional} onChange={e => setTituloProfissional(e.target.value)} />
              </div>
              <div className="form-group">
                <label>CPF</label>
                <input type="text" value={cpfProfissional} onChange={e => setCpfProfissional(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input type="text" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Naturalidade</label>
                <input type="text" value={naturalidade} onChange={e => setNaturalidade(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Tipo Sanguíneo</label>
                <input type="text" value={tipoSanguineo} onChange={e => setTipoSanguineo(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data de Expedição</label>
                <input type="text" value={dataExpedicao} onChange={e => setDataExpedicao(e.target.value)} />
              </div>
              <div className="form-group">
                <label>PIS</label>
                <input type="text" value={pis} onChange={e => setPis(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Filiação</label>
                <input type="text" value={filiacao} onChange={e => setFiliacao(e.target.value)} />
              </div>
            </div>

          </div>
        </aside>

        <div className="preview-area">
          <div className="page">
            <div className="doc-header">
              <div className="doc-logo-area">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo Documento" />
                ) : (
                  <div className="doc-logo-placeholder">SISTEMMAR</div>
                )}
              </div>
              <div className="doc-header-info">
                <div className="company-name">ENGTEC SOLUTIONS</div>
                <div className="doc-num-badge">Laudo Nº <span>{num}</span></div>
              </div>
            </div>

            <div className="doc-body">
              <div className="doc-title">Declaração de Construção</div>
              
              <div className="content-para">
                Declaro, para comprovação perante a <strong>{destino}</strong>, 
                que a embarcação <strong>{modelo || '[MODELO]'}</strong>, 
                construtor <strong>{fabricante || '[FABRICANTE]'}</strong>, 
                número de série: <strong>{serie || '[SÉRIE]'}</strong>, com as seguintes características:
              </div>

              <div className="specs-block">
                {SPECS_FIELDS.map(f => {
                  const val = specs[f.id]
                  if (val && val !== '-' && val !== '00') {
                    return (
                      <div className="spec-item" key={f.id}>
                        <div className="spec-label">{f.label}:</div>
                        <div className="spec-value">{val}</div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              <div className="content-para">
                Atende as prescrições aplicáveis constantes na NORMAM-202/DPC, NORMAM-211/DPC, e apresenta condições de segurança, estabilidade e estruturais satisfatórias.
              </div>

              <div className="content-para">
                Declaro, ainda, que a embarcação foi construída em conformidade com as normas e regulamentos nacionais em vigor.
              </div>

              <div className="doc-city-date">{cidade}, {data}</div>

              <div className="signature-area">
                <div className="sig-line">Douglas Germano da Silva</div>
                <div className="sig-sub">Engenheiro Mecânico</div>
                <div className="sig-sub">CREA MT05440</div>
              </div>
            </div>

            <div className="doc-footer">
              <div className="footer-left">
                ENGTEC SOLUTIONS<br/>
                Rondonópolis – MT
              </div>
              <div className="footer-page">1</div>
            </div>
          </div>

          <div className="page">
            <div className="doc-header">
              <div className="doc-logo-area">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo Documento" />
                ) : (
                  <div className="doc-logo-placeholder">SISTEMMAR</div>
                )}
              </div>
              <div className="doc-header-info">
                <div className="company-name">ENGTEC SOLUTIONS</div>
                <div className="doc-num-badge">Laudo Nº <span>{num}</span></div>
              </div>
            </div>

            <div className="doc-body">
              <div className="doc-title">Carteira de Habilitação Profissional — CREA</div>
              
              <div style={{margin: '2rem 0', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap'}}>
                {creaImageBase64 ? (
                  <div style={{flex: '1', minWidth: '300px', textAlign: 'center'}}>
                    <img src={creaImageBase64} alt="Carteira CREA Frente" style={{maxWidth: '100%', height: 'auto', border: '1px solid #ccc'}} />
                    <div style={{fontSize: '0.875rem', marginTop: '0.5rem', color: '#666'}}>Frente da Carteira</div>
                  </div>
                ) : (
                  <div style={{flex: '1', minWidth: '300px', textAlign: 'center', padding: '3rem 1rem', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{color: '#999'}}>Imagem da Carteira CREA</span>
                  </div>
                )}
              </div>

              <div className="specs-block">
                <div className="spec-item">
                  <div className="spec-label">Nome:</div>
                  <div className="spec-value">{nomeProfissional}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Registro CREA-MT:</div>
                  <div className="spec-value">{registroCrea}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Título Profissional:</div>
                  <div className="spec-value">{tituloProfissional}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">CPF:</div>
                  <div className="spec-value">{cpfProfissional}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Data de Nascimento:</div>
                  <div className="spec-value">{dataNascimento}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Naturalidade:</div>
                  <div className="spec-value">{naturalidade}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Tipo Sanguíneo:</div>
                  <div className="spec-value">{tipoSanguineo}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Data de Expedição:</div>
                  <div className="spec-value">{dataExpedicao}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">PIS:</div>
                  <div className="spec-value">{pis}</div>
                </div>
                <div className="spec-item">
                  <div className="spec-label">Filiação:</div>
                  <div className="spec-value">{filiacao}</div>
                </div>
              </div>
            </div>

            <div className="doc-footer">
              <div className="footer-left">
                ENGTEC SOLUTIONS<br/>
                Rondonópolis – MT
              </div>
              <div className="footer-page">2</div>
            </div>
          </div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h3>Histórico de Laudos</h3>
            <span className="history-count">{laudos.length} laudos</span>
          </div>
          <div style={{overflowX: 'auto'}}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fabricante</th>
                  <th>Modelo</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {laudos.map((l: any) => (
                  <tr key={l.num}>
                    <td><span className="laudo-num">{l.num}</span></td>
                    <td>{l.fabricante || '—'}</td>
                    <td>{l.modelo || '—'}</td>
                    <td>{l.data || '—'}</td>
                    <td>
                      <button className="btn-ghost btn-sm" onClick={() => handleEdit(l.num)}>✏ Editar</button>
                      <button className="btn-danger btn-sm" style={{marginLeft: '0.5rem'}} onClick={() => handleDelete(l.num)}>✕ Excluir</button>
                    </td>
                  </tr>
                ))}
                {laudos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{textAlign: 'center', padding: '2rem'}}>Nenhum laudo registrado no banco online ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast.visible && (
        <div id="toast">
          {toast.msg}
        </div>
      )}
    </>
  )
}
