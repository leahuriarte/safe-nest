import ClinicEvaluator from '../components/ClinicEvaluator'
import AIEthicsWarning from '../components/AIEthicsWarning'
import './ClinicEvaluatorScreen.css'

export default function ClinicEvaluatorScreen() {
  return (
    <div className="clinic-evaluator-screen">
      <div className="screen-container">
        <AIEthicsWarning variant="general" />
        <ClinicEvaluator />
      </div>
    </div>
  )
}
