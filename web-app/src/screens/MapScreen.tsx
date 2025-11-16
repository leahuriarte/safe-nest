// src/screens/MapScreen.tsx
import { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Point from '@arcgis/core/geometry/Point'
import Graphic from '@arcgis/core/Graphic'
import SpatialReference from '@arcgis/core/geometry/SpatialReference'
import HeatmapRenderer from '@arcgis/core/renderers/HeatmapRenderer'
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import esriConfig from '@arcgis/core/config'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import './MapScreen.css'
import ChatbotModal from "../components/ChatbotModal"
import AIEthicsWarning from '../components/AIEthicsWarning'

type RiskInfo = {
  overall: number
  riskLevel: string
  recommendation: string
  factors: {
    airQuality: string
    healthAccess: string
    environmental: string
  }
}

export default function MapScreen() {
  const mapDiv = useRef<HTMLDivElement | null>(null)
  const [view, setView] = useState<MapView | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [riskInfo, setRiskInfo] = useState<RiskInfo | null>(null)
  const [showPollution, setShowPollution] = useState(true)
  const [showHealthcare, setShowHealthcare] = useState(true)
  const [showEnvironmental, setShowEnvironmental] = useState(true)
  const [showRiskOverlay] = useState(true)
  const [showClinics] = useState(true)
  const [chatOpen, setChatOpen] = useState(false);

  const apiKey = "AAPTxy8BH1VEsoebNVZXo8HurDgKT26idZJ1d3mlxL61L4Augub-D2I-YRgUN8j1PAwqW8uPEVvez-Kbm7yZ8Izt-KxA2cUcaoP5iO8S76y9LrdM0V4c5S2QKeKYZQy-7AhBZ6oxXFK4ZX0yniErz84D3v8xSwQOz2bMOniz6nDYaRwsVPso_UrB1H-QQQ9l7NKFaHj_hTviNoNbnWZ4t_cNRzDSxePlYKjZVd0sAoGRGA8.AT1_mNE0NHsT"

  useEffect(() => {
    if (!apiKey) {
      console.error('ArcGIS API key missing.')
      return
    }

    esriConfig.apiKey = apiKey
    if (!mapDiv.current) return

    const map = new Map({
      basemap: 'streets-navigation-vector'
    })

    const mapView = new MapView({
      container: mapDiv.current,
      map,
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 12
    })

    // -----------------------------------------------------
    // 1. AIR QUALITY / POLLUTION LAYER
    // -----------------------------------------------------
    const airQualityLayer = new FeatureLayer({
      id: 'pollution',
      title: 'Air Quality (PM2.5)',
      portalItem: { id: '8dcf5d4e124f480fa8c529fbe25ba04e' }, // OpenAQ PM2.5 data
      outFields: ['*'],
      opacity: 0.7,
      popupTemplate: {
        title: 'Air Quality Reading',
        content: `
          <b>PM2.5:</b> {pm25} µg/m³<br>
          <b>Location:</b> {location}<br>
          <b>Last Updated:</b> {lastUpdated}
        `
      }
    })
    map.add(airQualityLayer)

    // -----------------------------------------------------
    // 2. HEALTHCARE FACILITIES LAYER (Real USA Hospitals Data)
    // -----------------------------------------------------
    const healthcareFacilitiesLayer = new FeatureLayer({
      id: 'healthcare',
      title: 'Healthcare Facilities',
      url: 'https://services.arcgis.com/EaQ3hSM51DBnlwMq/ArcGIS/rest/services/Hospitals/FeatureServer/0',
      outFields: ['*'],
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          color: [0, 122, 194],
          size: 8,
          outline: { color: [255, 255, 255], width: 2 }
        })
      }),
      popupTemplate: {
        title: '{NAME}',
        content: `
          <b>Address:</b> {ADDRESS}<br>
          <b>City:</b> {CITY}, {STATE}<br>
          <b>Type:</b> {TYPE}<br>
          <b>Beds:</b> {BEDS}
        `
      }
    })
    map.add(healthcareFacilitiesLayer)
    console.log('Real hospitals layer added (~3,110 facilities)')
    const clinicsLayer = new GraphicsLayer({
      id: 'clinics',
      title: 'Clinics'
    })

    const sampleClinics = [
      { name: 'Community Health Center', lat: 34.0522, lon: -118.2437 },
      { name: 'Planned Parenthood Downtown', lat: 34.0489, lon: -118.2587 },
      { name: 'Women\'s Health Clinic', lat: 34.0608, lon: -118.2347 },
      { name: 'Family Planning Center', lat: 34.0445, lon: -118.2561 }
    ]

    sampleClinics.forEach(clinic => {
      const point = new Point({
        longitude: clinic.lon,
        latitude: clinic.lat
      })

      const markerSymbol = new SimpleMarkerSymbol({
      color: [0, 122, 194],
      size: '18px',
      outline: { color: [255, 255, 255], width: 2 }
      })

      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          name: clinic.name,
          type: 'clinic'
        },
        popupTemplate: {
          title: '{name}',
          content: 'Health services available'
        }
      })

      clinicsLayer.add(graphic)
    })

    map.add(clinicsLayer)

    // -----------------------------------------------------
    // 3. ENVIRONMENTAL HAZARDS LAYER (Client-side data)
    // -----------------------------------------------------
    const sampleHazards = [
      { name: 'Industrial Site - Vernon', lat: 34.0033, lon: -118.2337, type: 'Industrial Pollution' },
      { name: 'Former Manufacturing Plant', lat: 34.0178, lon: -118.1848, type: 'Toxic Site' },
      { name: 'Oil Refinery Area', lat: 33.9428, lon: -118.2468, type: 'Air Pollution Source' },
      { name: 'Chemical Storage Facility', lat: 34.0789, lon: -118.2347, type: 'Toxic Site' },
      { name: 'Former Waste Treatment Plant', lat: 34.0145, lon: -118.3089, type: 'Contaminated Site' },
      { name: 'Industrial Zone - Commerce', lat: 33.9989, lon: -118.1603, type: 'Industrial Pollution' }
    ]

    const environmentalHazardsLayer = new FeatureLayer({
      id: 'environmental',
      title: 'Environmental Hazards',
      source: sampleHazards.map((hazard, idx) => new Graphic({
        geometry: new Point({
          longitude: hazard.lon,
          latitude: hazard.lat,
          spatialReference: SpatialReference.WGS84
        }),
        attributes: {
          ObjectID: idx + 1,
          SITE_NAME: hazard.name,
          TYPE: hazard.type
        }
      })),
      fields: [
        { name: 'ObjectID', type: 'oid' },
        { name: 'SITE_NAME', type: 'string' },
        { name: 'TYPE', type: 'string' }
      ],
      objectIdField: 'ObjectID',
      geometryType: 'point',
      spatialReference: SpatialReference.WGS84,
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          color: [255, 0, 0],
          size: 8,
          outline: { color: [139, 0, 0], width: 2 }
        })
      }),
      popupTemplate: {
        title: 'Environmental Hazard',
        content: '<b>Site:</b> {SITE_NAME}<br><b>Type:</b> {TYPE}'
      }
    })
    map.add(environmentalHazardsLayer)

    // -----------------------------------------------------
    // 4. RISK OVERLAY HEATMAP
    // -----------------------------------------------------
    const riskOverlayLayer = new FeatureLayer({
      id: 'risk-overlay',
      title: 'Pregnancy Risk Overlay',
      source: [],
      fields: [
        { name: 'ObjectID', type: 'oid' },
        { name: 'riskScore', type: 'double' }
      ],
      objectIdField: 'ObjectID',
      geometryType: 'point',
      spatialReference: SpatialReference.WGS84,
      renderer: new HeatmapRenderer({
        field: 'riskScore',
        maxDensity: 0.01,
        minDensity: 0,
        colorStops: [
          { ratio: 0, color: 'rgba(0, 255, 0, 0)' },      // Transparent
          { ratio: 0.25, color: 'rgba(0, 255, 0, 0.7)' },  // Low risk - green
          { ratio: 0.5, color: 'rgba(255, 255, 0, 0.8)' }, // Low-moderate - yellow
          { ratio: 0.75, color: 'rgba(255, 140, 0, 0.9)' }, // Moderate - orange
          { ratio: 1, color: 'rgba(255, 0, 0, 1)' }      // High risk - red
        ]
      }),
      opacity: 0.8
    })
    map.add(riskOverlayLayer)
    console.log('Risk overlay layer added to map')

    setView(mapView)

    // -----------------------------------------------------
    // RISK ANALYSIS
    // -----------------------------------------------------
    let analysisTimeout: number | undefined

    async function performRiskAnalysis() {
      if (!mapView) return
      setIsAnalyzing(true)

      try {
        const extent = mapView.extent

        // Query air quality data
        const aqQuery = airQualityLayer.createQuery()
        aqQuery.geometry = extent
        aqQuery.returnGeometry = true
        aqQuery.outFields = ['*']

        // Query healthcare facilities
        const hcQuery = healthcareFacilitiesLayer.createQuery()
        hcQuery.geometry = extent
        hcQuery.returnGeometry = true
        hcQuery.outFields = ['*']

        // Query environmental hazards
        const envQuery = environmentalHazardsLayer.createQuery()
        envQuery.geometry = extent
        envQuery.returnGeometry = true
        envQuery.outFields = ['*']

        const [aqResults, hcResults, envResults] = await Promise.all([
          airQualityLayer.queryFeatures(aqQuery).catch(() => ({ features: [] })),
          healthcareFacilitiesLayer.queryFeatures(hcQuery).catch(() => ({ features: [] })),
          environmentalHazardsLayer.queryFeatures(envQuery).catch(() => ({ features: [] }))
        ])

        // Calculate risk scores
        let airQualityScore = 0
        let healthAccessScore = 0
        let environmentalScore = 0

        // Air Quality Assessment
        if (aqResults.features.length > 0) {
          const avgPM25 = aqResults.features.reduce((sum, f) => {
            const pm25 = f.attributes.pm25 || f.attributes.pm25_mean || f.attributes.value || 0
            return sum + pm25
          }, 0) / aqResults.features.length

          if (avgPM25 > 150) airQualityScore = 90
          else if (avgPM25 > 55) airQualityScore = 60
          else if (avgPM25 > 35) airQualityScore = 40
          else if (avgPM25 > 12) airQualityScore = 20
          else airQualityScore = 5
        }

        // Healthcare Access Assessment
        const facilitiesCount = hcResults.features.length
        if (facilitiesCount === 0) healthAccessScore = 80
        else if (facilitiesCount < 3) healthAccessScore = 50
        else if (facilitiesCount < 5) healthAccessScore = 30
        else healthAccessScore = 10

        // Environmental Hazards Assessment
        const hazardsCount = envResults.features.length
        if (hazardsCount > 5) environmentalScore = 80
        else if (hazardsCount > 2) environmentalScore = 50
        else if (hazardsCount > 0) environmentalScore = 30
        else environmentalScore = 5

        // Overall Risk Calculation
        const overall = Math.round(
          (airQualityScore * 0.4) +
          (healthAccessScore * 0.35) +
          (environmentalScore * 0.25)
        )

        let riskLevel = 'Low'
        let recommendation = 'This area is generally safe for pregnancy.'

        if (overall >= 70) {
          riskLevel = 'High'
          recommendation = 'High risk area - consider relocating or consulting healthcare provider about environmental concerns.'
        } else if (overall >= 50) {
          riskLevel = 'Moderate'
          recommendation = 'Moderate risk - take precautions and ensure regular prenatal care.'
        } else if (overall >= 30) {
          riskLevel = 'Low-Moderate'
          recommendation = 'Generally safe, but monitor air quality and maintain regular checkups.'
        }

        // -----------------------------------------------------
        // GENERATE HEATMAP OVERLAY
        // -----------------------------------------------------
        // Clear existing heatmap points
        await riskOverlayLayer.applyEdits({ deleteFeatures: riskOverlayLayer.source.toArray() })

        // Create a grid of points across the visible extent
        const gridSize = 30 // 30x30 grid for better coverage
        const xStep = (extent.xmax - extent.xmin) / gridSize
        const yStep = (extent.ymax - extent.ymin) / gridSize

        const heatmapFeatures: any[] = []

        console.log('Generating heatmap with', gridSize * gridSize, 'points')

        let objectIdCounter = 1

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const lon = extent.xmin + (i * xStep) + (xStep / 2)
            const lat = extent.ymin + (j * yStep) + (yStep / 2)
            const point = new Point({
              longitude: lon,
              latitude: lat,
              spatialReference: SpatialReference.WGS84
            })

            // Calculate risk for this point
            let pointRisk = 0

            // Air quality - find nearest sensor
            if (aqResults.features.length > 0) {
              let minDist = Infinity
              let nearestPM25 = 0
              for (const aqFeature of aqResults.features) {
                const aqPoint = aqFeature.geometry as Point
                if (aqPoint.longitude == null || aqPoint.latitude == null) continue
                const dist = Math.sqrt(
                  Math.pow(lon - aqPoint.longitude, 2) +
                  Math.pow(lat - aqPoint.latitude, 2)
                )
                if (dist < minDist) {
                  minDist = dist
                  nearestPM25 = aqFeature.attributes.pm25 || aqFeature.attributes.pm25_mean || aqFeature.attributes.value || 0
                }
              }

              if (nearestPM25 > 150) pointRisk += 36
              else if (nearestPM25 > 55) pointRisk += 24
              else if (nearestPM25 > 35) pointRisk += 16
              else if (nearestPM25 > 12) pointRisk += 8
              else pointRisk += 2
            }

            // Healthcare access - distance to nearest facility
            if (hcResults.features.length > 0) {
              let minDist = Infinity
              for (const hcFeature of hcResults.features) {
                const hcPoint = hcFeature.geometry as Point
                if (hcPoint.longitude == null || hcPoint.latitude == null) continue
                const dist = Math.sqrt(
                  Math.pow(lon - hcPoint.longitude, 2) +
                  Math.pow(lat - hcPoint.latitude, 2)
                ) * 111 // rough km conversion
                if (dist < minDist) minDist = dist
              }

              if (minDist > 10) pointRisk += 28
              else if (minDist > 5) pointRisk += 17.5
              else if (minDist > 2) pointRisk += 10.5
              else pointRisk += 3.5
            } else {
              pointRisk += 28 // No facilities nearby
            }

            // Environmental hazards - proximity to toxic sites
            let hazardProximity = 0
            for (const envFeature of envResults.features) {
              const envPoint = envFeature.geometry as Point
              if (envPoint.longitude == null || envPoint.latitude == null) continue
              const dist = Math.sqrt(
                Math.pow(lon - envPoint.longitude, 2) +
                Math.pow(lat - envPoint.latitude, 2)
              ) * 111 // rough km conversion

              if (dist < 2) hazardProximity += 20
              else if (dist < 5) hazardProximity += 12.5
              else if (dist < 10) hazardProximity += 7.5
            }
            pointRisk += Math.min(25, hazardProximity)

            // Add point to heatmap
            heatmapFeatures.push({
              geometry: point,
              attributes: {
                ObjectID: objectIdCounter++,
                riskScore: pointRisk
              }
            })
          }
        }

        // Apply all heatmap points
        console.log('Adding', heatmapFeatures.length, 'heatmap features')
        console.log('Sample feature:', heatmapFeatures[0])
        const riskScores = heatmapFeatures.map(f => f.attributes.riskScore)
        console.log('Risk score range:', Math.min(...riskScores), 'to', Math.max(...riskScores))
        const edits = await riskOverlayLayer.applyEdits({ addFeatures: heatmapFeatures })
        console.log('Heatmap edits result:', edits)
        if (edits.addFeatureResults) {
          console.log('Add results:', edits.addFeatureResults)
          const errors = edits.addFeatureResults.filter(r => r.error)
          if (errors.length > 0) {
            console.error('Errors adding features:', errors)
          }
        }
        console.log('Risk overlay layer feature count:', riskOverlayLayer.source.length)

        setRiskInfo({
          overall,
          riskLevel,
          recommendation,
          factors: {
            airQuality: airQualityScore > 60 ? 'Poor' : airQualityScore > 30 ? 'Moderate' : 'Good',
            healthAccess: healthAccessScore > 60 ? 'Limited' : healthAccessScore > 30 ? 'Adequate' : 'Good',
            environmental: environmentalScore > 60 ? 'High Concern' : environmentalScore > 30 ? 'Moderate' : 'Low Concern'
          }
        })
      } catch (err) {
        console.error('Risk analysis error:', err)
        setRiskInfo({
          overall: 0,
          riskLevel: 'Unknown',
          recommendation: 'Unable to calculate risk. Try zooming or moving the map.',
          factors: {
            airQuality: 'N/A',
            healthAccess: 'N/A',
            environmental: 'N/A'
          }
        })
      } finally {
        setIsAnalyzing(false)
      }
    }

    reactiveUtils.watch(
      () => mapView.stationary,
      (stationary) => {
        if (stationary) {
          if (analysisTimeout) clearTimeout(analysisTimeout)
          analysisTimeout = window.setTimeout(() => performRiskAnalysis(), 1000)
        }
      }
    )

    mapView.when(() => {
      setTimeout(() => performRiskAnalysis(), 1500)
    })

    return () => {
      if (analysisTimeout) clearTimeout(analysisTimeout)
      mapView.destroy()
    }
  }, [apiKey])

  // Layer visibility toggles
  useEffect(() => {
    if (!view) return
    const pollutionL = view.map?.findLayerById('pollution')
    if (pollutionL) (pollutionL as FeatureLayer).visible = showPollution
  }, [showPollution, view])

  useEffect(() => {
    if (!view) return
    const healthcareL = view.map?.findLayerById('healthcare')
    if (healthcareL) (healthcareL as FeatureLayer).visible = showHealthcare
  }, [showHealthcare, view])

  useEffect(() => {
    if (!view) return
    const environmentalL = view.map?.findLayerById('environmental')
    if (environmentalL) (environmentalL as FeatureLayer).visible = showEnvironmental
  }, [showEnvironmental, view])

  useEffect(() => {
    if (!view) return
    const riskOverlayL = view.map?.findLayerById('risk-overlay')
    if (riskOverlayL) (riskOverlayL as FeatureLayer).visible = showRiskOverlay
  }, [showRiskOverlay, view])

  useEffect(() => {
    if (!view) return
    const clinicsL = view.map?.findLayerById('clinics')
    if (clinicsL) (clinicsL as GraphicsLayer).visible = showClinics
  }, [showClinics, view])

  return (
  
    <div className="map-screen">
      <div className="map-controls">
        <AIEthicsWarning variant="map" />
        <h3>SafeNest — Risk Maps for Pregnant People</h3>

        <div className="control-panel">
          <h4>Map Layers</h4>
          <label>
            <input type="checkbox"
              checked={showPollution}
              onChange={(e) => setShowPollution(e.target.checked)} />
            Air Quality / Pollution
          </label>
          <label>
            <input type="checkbox"
              checked={showHealthcare}
              onChange={(e) => setShowHealthcare(e.target.checked)} />
            Healthcare Facilities
          </label>
          <label>
            <input type="checkbox"
              checked={showEnvironmental}
              onChange={(e) => setShowEnvironmental(e.target.checked)} />
            Environmental Hazards
          </label>

          <button
            className = "find-nearest-btn" onClick = {() => setChatOpen(true)}>
            <span role="img" aria-label="location">📍</span>
            Find Nearest Clinic
          </button>
          
        </div>
        
        <div className="risk-score-panel">
          <h4>Pregnancy Risk Assessment</h4>
          {isAnalyzing && <div className="calculating">Analyzing area...</div>}
          {riskInfo ? (
            <>
              <div className={`risk-badge risk-${riskInfo.riskLevel.toLowerCase().replace(/\s+/g, '-')}`}>
                {riskInfo.overall}/100 — {riskInfo.riskLevel} Risk
              </div>
              <div className="risk-details">
                <p><strong>Air Quality:</strong> {riskInfo.factors.airQuality}</p>
                <p><strong>Healthcare Access:</strong> {riskInfo.factors.healthAccess}</p>
                <p><strong>Environmental:</strong> {riskInfo.factors.environmental}</p>
              </div>
              <p className="recommendation"><strong>Recommendation:</strong> {riskInfo.recommendation}</p>
            </>
          ) : (!isAnalyzing && <div>Move or zoom the map to analyze this area.</div>)}
        </div>

        <div className="legend">
          <h4>Legend</h4>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#007ac2' }}></div>
            <span>Healthcare Facilities</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ff0000' }}></div>
            <span>Environmental Hazards</span>
          </div>
        </div>

        <div className="data-source">
          <p>Data sources: OpenAQ (Air Quality), ArcGIS Living Atlas (Healthcare & Environmental Hazards)</p>
        </div>
      </div>

      <div className="map-container" ref={mapDiv}></div>
      
      {chatOpen && <ChatbotModal onClose={() => setChatOpen(false)} />}
    </div>
  )
}