// src/screens/MapScreen.tsx
import { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Point from '@arcgis/core/geometry/Point'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import HeatmapRenderer from '@arcgis/core/renderers/HeatmapRenderer'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import esriConfig from '@arcgis/core/config'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import './MapScreen.css'

type RiskInfo = {
  overall: number
  aqiLabel: string
  recommendation: string
}

export default function MapScreen() {
  const mapDiv = useRef<HTMLDivElement | null>(null)
  const [view, setView] = useState<MapView | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [riskInfo, setRiskInfo] = useState<RiskInfo | null>(null)
  const [showClinics, setShowClinics] = useState(true)
  const [showRiskLayer, setShowRiskLayer] = useState(true)

  const apiKey = "AAPTxy8BH1VEsoebNVZXo8HurDgKT26idZJ1d3mlxL61L4Augub-D2I-YRgUN8j1PAwqW8uPEVvez-Kbm7yZ8Izt-KxA2cUcaoP5iO8S76y9LrdM0V4c5S2QKeKYZQy-7AhBZ6oxXFK4ZX0yniErz84D3v8xSwQOz2bMOniz6nDYaRwsVPso_UrB1H-QQQ9l7NKFaHj_hTviNoNbnWZ4t_cNRzDSxePlYKjZVd0sAoGRGA8.AT1_mNE0NHsT"

  useEffect(() => {
    if (!apiKey) {
      console.error('ArcGIS API key missing.')
      return
    }

    esriConfig.apiKey = apiKey
    if (!mapDiv.current) return

    const map = new Map({
      basemap: 'arcgis/topographic'
    })

    const mapView = new MapView({
      container: mapDiv.current,
      map,
      center: [-118.2437, 34.0522],
      zoom: 11
    })

    // -----------------------------------------------------
    // CLINICS LAYER (unchanged)
    // -----------------------------------------------------
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

    sampleClinics.forEach((c) => {
      clinicsLayer.add(
        new Graphic({
          geometry: new Point({ longitude: c.lon, latitude: c.lat }),
          symbol: new SimpleMarkerSymbol({
            color: [0, 122, 194],
            size: 12,
            outline: { color: [255, 255, 255], width: 2 }
          }),
          attributes: { name: c.name },
          popupTemplate: {
            title: '{name}',
            content: 'Health services available'
          }
        })
      )
    })

    map.add(clinicsLayer)

    // -----------------------------------------------------
    // OpenAQ Live Layer
    // -----------------------------------------------------
    const openAQLayer = new FeatureLayer({
      portalItem: { id: '8dcf5d4e124f480fa8c529fbe25ba04e' },
      outFields: ['*'],
      title: 'OpenAQ PM2.5'
    })
    map.add(openAQLayer)

    // -----------------------------------------------------
    // HEATMAP RISK LAYER (client-layer)
    // -----------------------------------------------------
    const riskLayer = new FeatureLayer({
      id: "risk",
      title: "Risk Heatmap",

      source: [],       // IMPORTANT: client-side features

      fields: [
        { name: "ObjectID", type: "oid" },
        { name: "pm25", type: "double" },
        { name: "score", type: "double" },
        { name: "nearestClinicKm", type: "double" }
      ],

      objectIdField: "ObjectID",
      geometryType: "point",

      renderer: new HeatmapRenderer({
        blurRadius: 24,
        minPixelIntensity: 0,
        maxPixelIntensity: 100,
        colorStops: [
          { ratio: 0.0, color: "rgba(0,228,0,0)" },
          { ratio: 0.2, color: "rgba(0,228,0,0.40)" },
          { ratio: 0.4, color: "rgba(255,255,0,0.60)" },
          { ratio: 0.6, color: "rgba(255,126,0,0.75)" },
          { ratio: 0.8, color: "rgba(255,0,0,0.85)" },
          { ratio: 1.0, color: "rgba(126,0,35,0.95)" }
        ]
      })
    })

    map.add(riskLayer)

    setView(mapView)

    // -----------------------------------------------------
    // RISK ANALYSIS + HEATMAP POINTS
    // -----------------------------------------------------
    let analysisTimeout: number | undefined

    async function performRiskAnalysis() {
      if (!mapView || isAnalyzing) return
      setIsAnalyzing(true)

      await riskLayer.applyEdits({ deleteFeatures: riskLayer.source.toArray() })

      try {
        const q = openAQLayer.createQuery()
        q.geometry = mapView.extent
        q.returnGeometry = true
        q.outFields = ['*']

        const results = await openAQLayer.queryFeatures(q)
        if (!results || results.features.length === 0) {
          setRiskInfo(null)
          setIsAnalyzing(false)
          return
        }

        const clinics = clinicsLayer.graphics.toArray()
        let sumPM25 = 0

        const adds: any[] = []

        for (const feat of results.features) {
          const geom = feat.geometry as Point
          const pm25 =
            (feat.attributes.pm25 ||
              feat.attributes.pm25_mean ||
              feat.attributes.value ||
              feat.attributes.measurement) ?? 0

          sumPM25 += pm25

          // compute distance to nearest clinic
          let nearestKm = Infinity
          for (const cg of clinics) {
            const cp = cg.geometry as Point
            const dx = geom.longitude - cp.longitude
            const dy = geom.latitude - cp.latitude
            const distKm = Math.sqrt(dx * dx + dy * dy) * 111
            if (distKm < nearestKm) nearestKm = distKm
          }

          // Risk scoring
          let score = 0
          if (pm25 > 150) score += 60
          else if (pm25 > 55) score += 40
          else if (pm25 > 35) score += 20
          else score += 5

          if (nearestKm > 5) score += 30
          else if (nearestKm > 2) score += 15

          score = Math.min(100, Math.round(score))

          // Add to heatmap layer
          adds.push({
            geometry: new Point({ longitude: geom.longitude, latitude: geom.latitude }),
            attributes: {
              pm25,
              score,
              nearestClinicKm: Number(nearestKm.toFixed(2))
            }
          })
        }

        await riskLayer.applyEdits({ addFeatures: adds })

        const avgPM25 = sumPM25 / results.features.length
        let overall = 10
        let rec = 'Air quality is good.'
        if (avgPM25 > 150) {
          overall = 90
          rec = 'Unhealthy — limit outdoor exposure.'
        } else if (avgPM25 > 55) {
          overall = 60
          rec = 'Moderate — sensitive groups limit activity.'
        } else if (avgPM25 > 35) {
          overall = 40
          rec = 'Acceptable but may affect sensitive people.'
        }

        setRiskInfo({
          overall,
          aqiLabel: avgPM25 > 150 ? 'Unhealthy' : avgPM25 > 55 ? 'Moderate' : avgPM25 > 35 ? 'Sensitive' : 'Good',
          recommendation: rec
        })
      } catch (err) {
        console.error('Risk error', err)
      } finally {
        setIsAnalyzing(false)
      }
    }

    reactiveUtils.watch(
      () => mapView.stationary,
      (stationary) => {
        if (stationary) {
          if (analysisTimeout) clearTimeout(analysisTimeout)
          analysisTimeout = window.setTimeout(() => performRiskAnalysis(), 500)
        }
      }
    )

    mapView.when(() => {
      setTimeout(() => performRiskAnalysis(), 800)
    })

    return () => {
      if (analysisTimeout) clearTimeout(analysisTimeout)
      mapView.destroy()
    }
  }, [apiKey])

  // Layer visibility toggles
  useEffect(() => {
    if (!view) return
    const riskL = view.map?.findLayerById('risk')
    if (riskL) (riskL as FeatureLayer).visible = showRiskLayer
  }, [showRiskLayer, view])

  useEffect(() => {
    if (!view) return
    const clinicsL = view.map?.findLayerById('clinics')
    if (clinicsL) (clinicsL as GraphicsLayer).visible = showClinics
  }, [showClinics, view])

  return (
    <div className="map-screen">
      <div className="map-controls">
        <h3>SafeNest — Health Risk Map</h3>

        <div className="control-panel">
          <label>
            <input type="checkbox"
              checked={showRiskLayer}
              onChange={(e) => setShowRiskLayer(e.target.checked)} />
            Unified Risk Heatmap
          </label>
          <label>
            <input type="checkbox"
              checked={showClinics}
              onChange={(e) => setShowClinics(e.target.checked)} />
            Clinic locations
          </label>
        </div>

        <div className="risk-score-panel">
          <h4>Unified Risk</h4>
          {isAnalyzing && <div className="calculating">Analyzing...</div>}
          {riskInfo ? (
            <>
              <div className={`risk-badge risk-${riskInfo.aqiLabel.toLowerCase()}`}>
                {riskInfo.overall}/100 — {riskInfo.aqiLabel}
              </div>
              <p><strong>Recommendation:</strong> {riskInfo.recommendation}</p>
            </>
          ) : (!isAnalyzing && <div>Move or zoom map to calculate risk.</div>)}
        </div>

        <div className="data-source">
          <p>Data: OpenAQ, sample clinics</p>
        </div>
      </div>

      <div className="map-container" ref={mapDiv} />
    </div>
  )
}
