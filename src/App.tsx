import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { offerIncomingPlanError, offerIncomingPlanText } from './lib/incomingPlan'
import { offerIncomingWodError, offerIncomingWodText } from './lib/incomingWod'
import { OpenWod } from './lib/openWod'
import { parsePlanShareText } from './lib/sharePlan'
import { parseWodShareText } from './lib/shareWod'
import { PLAN_SHARE_FORMAT, WOD_SHARE_FORMAT } from './types/pack'
import { DriveSync } from './pages/DriveSync'
import { HistoryDetail } from './pages/HistoryDetail'
import { HistoryList } from './pages/HistoryList'
import { Home } from './pages/Home'
import { PlanDayPage } from './pages/PlanDay'
import { PlanList } from './pages/PlanList'
import { PlanProgram } from './pages/PlanProgram'
import { PlanSession } from './pages/PlanSession'
import { RmEditor } from './pages/RmEditor'
import { RmList } from './pages/RmList'
import { TimerRun } from './pages/TimerRun'
import { TimerSetup } from './pages/TimerSetup'
import { TimersMenu } from './pages/TimersMenu'
import { WodEditor } from './pages/WodEditor'
import { WodHeroes } from './pages/WodHeroes'
import { WodsList } from './pages/WodsList'

export default function App() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    void StatusBar.setStyle({ style: Style.Light })
    void StatusBar.setBackgroundColor({ color: '#070708' })

    const handle = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else void CapacitorApp.exitApp()
    })

    return () => {
      void handle.then((listener) => listener.remove())
    }
  }, [])

  return (
    <HashRouter>
      <IncomingWodListener />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sync" element={<DriveSync />} />
        <Route path="/timers" element={<TimersMenu />} />
        <Route path="/plan" element={<PlanList />} />
        <Route path="/plan/:programId" element={<PlanProgram />} />
        <Route path="/plan/:programId/day/:dayId" element={<PlanDayPage />} />
        <Route path="/plan/:programId/day/:dayId/train" element={<PlanSession />} />
        <Route path="/wods" element={<WodsList />} />
        <Route path="/wods/heroes" element={<WodHeroes />} />
        <Route path="/wods/:id" element={<WodEditor />} />
        <Route path="/rm" element={<RmList />} />
        <Route path="/rm/:id" element={<RmEditor />} />
        <Route path="/historial" element={<HistoryList />} />
        <Route path="/historial/:id" element={<HistoryDetail />} />
        <Route path="/timers/:kind" element={<TimerSetup />} />
        <Route path="/timers/:kind/run" element={<TimerRun />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

function IncomingWodListener() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const apply = (event: { text?: string; error?: string }) => {
      if (event.error) {
        offerIncomingWodError('No se pudo leer el fichero.')
        navigate('/wods')
        return
      }
      if (!event.text) return
      const kind = sniffShareKind(event.text)
      if (kind === 'plan') {
        offerIncomingPlanText(event.text)
        navigate('/plan')
        return
      }
      if (kind === 'plan-invalid') {
        offerIncomingPlanError('Ese archivo no es un plan de WODtoBox.')
        navigate('/plan')
        return
      }
      offerIncomingWodText(event.text)
      navigate('/wods')
    }

    void OpenWod.consumePending().then(apply)
    const handle = OpenWod.addListener('openFile', apply)
    return () => {
      void handle.then((listener) => listener.remove())
    }
  }, [navigate])

  return null
}

function sniffShareKind(text: string): 'wod' | 'plan' | 'plan-invalid' | 'unknown' {
  if (parsePlanShareText(text)) return 'plan'
  if (parseWodShareText(text)) return 'wod'
  try {
    const raw = JSON.parse(text) as Record<string, unknown>
    if (raw.format === PLAN_SHARE_FORMAT) return 'plan-invalid'
    if (raw.format === WOD_SHARE_FORMAT) return 'unknown'
  } catch {
    /* ignore */
  }
  return 'unknown'
}
