import { useState } from 'react'
import './App.css'
import MapScreen from './screens/MapScreen'
import ClinicEvaluatorScreen from './screens/ClinicEvaluatorScreen'
import CommunityExperienceScreen from './screens/CommunityExperienceScreen'
import MedicalInfoScreen from './screens/MedicalInfoScreen'

type TabName = 'map' | 'eval' | 'community' | 'info' 

function App() {
  const [activeTab, setActiveTab] = useState<TabName>('map')

  const renderScreen = () => {
    switch (activeTab) {
      case 'map':
        return <MapScreen />
      case 'eval':
        return <ClinicEvaluatorScreen />
      case 'community':
        return <CommunityExperienceScreen />
      case 'info':
        return <MedicalInfoScreen />
      default:
        return <MapScreen />
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SafeNest</h1>
      </header>

      <main className="app-main">
        {renderScreen()}
      </main>

      <nav className="app-nav">
        <button
          className={activeTab === 'map' ? 'active' : ''}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button
          className={activeTab === 'eval' ? 'active' : ''}
          onClick={() => setActiveTab('eval')}
        >
          Clinic Info
        </button>
        <button
          className={activeTab === 'community' ? 'active' : ''}
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
        <button
          className={activeTab === 'info' ? 'active' : ''}
          onClick={() => setActiveTab('info')}
        >
          Document Helper
        </button>
      </nav>
    </div>
  )
}

export default App
