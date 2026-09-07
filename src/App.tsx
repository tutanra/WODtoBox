import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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
