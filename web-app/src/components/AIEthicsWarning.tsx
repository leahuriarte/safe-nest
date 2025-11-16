import React, { useState } from 'react';
import './AIEthicsWarning.css';

interface AIEthicsWarningProps {
  variant?: 'medical' | 'general' | 'map';
}

const AIEthicsWarning: React.FC<AIEthicsWarningProps> = ({ variant = 'general' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getWarningContent = () => {
    switch (variant) {
      case 'medical':
        return {
          title: '⚠️ Important Medical Disclaimer',
          summary: 'AI-generated medical information is for educational purposes only and should not replace professional medical advice.',
          details: [
            'This AI assistant analyzes documents but cannot provide medical diagnoses or treatment recommendations',
            'Always consult with your healthcare provider for medical decisions during pregnancy',
            'AI responses may contain errors or misinterpretations of medical information',
            'In case of medical emergencies, contact your healthcare provider or emergency services immediately',
            'This tool is designed to help you understand documents, not to provide medical advice'
          ]
        };
      case 'map':
        return {
          title: '⚠️ AI-Generated Risk Assessment Notice',
          summary: 'Environmental risk assessments are AI-generated estimates and should not be the sole basis for important decisions.',
          details: [
            'Risk scores are calculated using available data and AI algorithms, which may have limitations',
            'Environmental conditions change frequently and may not reflect current real-time conditions',
            'Consult with healthcare professionals and local authorities for personalized advice',
            'This tool provides general guidance and should be used alongside other information sources',
            'Individual health conditions may affect how environmental factors impact your pregnancy'
          ]
        };
      default:
        return {
          title: '⚠️ AI-Powered Feature Notice',
          summary: 'This feature uses artificial intelligence and may not always be accurate.',
          details: [
            'AI-generated content should be verified with reliable sources',
            'Results may vary and should not be considered definitive',
            'Always use critical thinking when evaluating AI-provided information',
            'For important decisions, consult with qualified professionals',
            'Report any concerning or inappropriate AI responses'
          ]
        };
    }
  };

  const content = getWarningContent();

  return (
    <div className="ai-ethics-warning">
      <div className="warning-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="warning-title">{content.title}</span>
        <button className="expand-button" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      <div className="warning-summary">
        {content.summary}
      </div>

      {isExpanded && (
        <div className="warning-details">
          <ul>
            {content.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIEthicsWarning;