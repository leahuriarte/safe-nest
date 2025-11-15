// src/screens/MapScreen.tsx
import { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Point from '@arcgis/core/geometry/Point'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol'
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

  // Read API key from env
  const apiKey = "AAPTxy8BH1VEsoebNVZXo8HurDgKT26idZJ1d3mlxL61L4Augub-D2I-YRgUN8j1PAwqW8uPEVvez-Kbm7yZ8Izt-KxA2cUcaoP5iO8S76y9LrdM0V4c5S2QKeKYZQy-7AhBZ6oxXFK4ZX0yniErz84D3v8xSwQOz2bMOniz6nDYaRwsVPso_UrB1H-QQQ9l7NKFaHj_hTviNoNbnWZ4t_cNRzDSxePlYKjZVd0sAoGRGA8.AT1_mNE0NHsT"

  useEffect(() => {
    // safety: require API key
    if (!apiKey) {
      console.error('ArcGIS API key not found. Set VITE_ARCGIS_API_KEY in your .env file.')
      return
    }

    // set the API key *before* creating Map/MapView
    esriConfig.apiKey = apiKey

    if (!mapDiv.current) return

    const map = new Map({
      // basemap style from ArcGIS Online. With esriConfig.apiKey this should resolve.
      basemap: 'arcgis/topographic'
    })

    const mapView = new MapView({
      container: mapDiv.current,
      map,
      center: [-118.2437, 34.0522],
      zoom: 11
    })

    // Layers
    const clinicsLayer = new GraphicsLayer({
      id: 'clinics',
      title: 'Clinics'
    })

    const riskLayer = new GraphicsLayer({
      id: 'risk',
      title: 'Risk visualization'
    })

    map.addMany([clinicsLayer, riskLayer])

    // Sample clinic points (replace with real clinic dataset as needed)
    const sampleClinics = [
      { name: 'Community Health Center', lat: 34.0522, lon: -118.2437 },
      { name: 'Planned Parenthood Downtown', lat: 34.0489, lon: -118.2587 },
      { name: 'Women\'s Health Clinic', lat: 34.0608, lon: -118.2347 },
      { name: 'Family Planning Center', lat: 34.0445, lon: -118.2561 }
    ]

    sampleClinics.forEach((c) => {
      const g = new Graphic({
        geometry: new Point({ longitude: c.lon, latitude: c.lat }),
        symbol: new SimpleMarkerSymbol({
          color: [0, 122, 194],
          size: 12,
          outline: { color: [255, 255, 255], width: 2 }
        }),
        attributes: { name: c.name, type: 'clinic' },
        popupTemplate: {
          title: '{name}',
          content: 'Health services available'
        }
      })
      clinicsLayer.add(g)
    })

    // OpenAQ FeatureLayer from ArcGIS Living Atlas
    const openAQLayer = new FeatureLayer({
      portalItem: { id: '8dcf5d4e124f480fa8c529fbe25ba04e' }, // OpenAQ PM2.5
      outFields: ['*'],
      title: 'OpenAQ PM2.5',
      // don't auto-scale visibility here; we'll query the features in view extent
    })

    map.add(openAQLayer)

    setView(mapView)

    // risk calculation
    let analysisTimeout: number | undefined

    async function performRiskAnalysis() {
      if (!mapView || isAnalyzing) return
      setIsAnalyzing(true)
      riskLayer.removeAll()

      try {
        // build a query for openAQ features in current extent only (performance)
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

        for (const feat of results.features) {
          const geom = feat.geometry as Point
          // best-effort fields for PM2.5 (OpenAQ fields vary)
          const pm25 =
            (feat.attributes && (feat.attributes.pm25 || feat.attributes.pm25_mean || feat.attributes.value || feat.attributes.measurement)) ??
            0

          sumPM25 += Number(pm25) || 0

          // compute distance to nearest clinic (km), rough conversion using lat/lon degrees -> km
          let nearestKm = Infinity
          for (const cg of clinics) {
            const cp = cg.geometry as Point
            const dx = (geom.longitude - cp.longitude)
            const dy = (geom.latitude - cp.latitude)
            const distKm = Math.sqrt(dx * dx + dy * dy) * 111 // rough converter
            if (distKm < nearestKm) nearestKm = distKm
          }

          // score components
          let score = 0
          const pm = Number(pm25) || 0
          if (pm > 150) score += 60
          else if (pm > 55) score += 40
          else if (pm > 35) score += 20
          else score += 5

          if (nearestKm > 5) score += 30
          else if (nearestKm > 2) score += 15

          score = Math.min(100, Math.round(score))

          // choose color by score
          function colorForScore(s: number) {
            if (s >= 75) return 'rgba(126,0,35,0.55)' // hazardous-like
            if (s >= 50) return 'rgba(255,0,0,0.45)' // unhealthy
            if (s >= 30) return 'rgba(255,126,0,0.40)' // sensitive
            if (s >= 15) return 'rgba(255,255,0,0.35)' // moderate
            return 'rgba(0,228,0,0.30)' // good
          }

          // draw a filled circle (SimpleFillSymbol on a small polygon or a large marker) — using a translucent fill
          const circle = new Graphic({
            geometry: new Point({ longitude: geom.longitude, latitude: geom.latitude }), // point center
            symbol: new SimpleMarkerSymbol({
              style: 'circle',
              color: colorForScore(score),
              size: Math.max(18, Math.min(60, Math.round(score / 2) + 18)),
              outline: { color: [255, 255, 255, 0.9], width: 1 }
            }),
            attributes: {
              pm25: pm,
              score,
              nearestClinicKm: Number(nearestKm.toFixed(2))
            },
            popupTemplate: {
              title: 'Health Risk',
              content:
                `<b>PM2.5:</b> ${pm.toFixed ? pm.toFixed(1) : pm} <br>` +
                `<b>Risk score:</b> ${score}/100 <br>` +
                `<b>Nearest clinic:</b> ${Number(nearestKm).toFixed(2)} km`
            }
          })

          riskLayer.add(circle)
        }

        const avgPM25 = sumPM25 / results.features.length
        let overall = 10
        let rec = 'Air quality is good.'
        if (avgPM25 > 150) {
          overall = 90
          rec = 'Unhealthy — limit outdoor exposure. Seek clinic if symptoms.'
        } else if (avgPM25 > 55) {
          overall = 60
          rec = 'Moderate — sensitive groups should limit prolonged outdoor activity.'
        } else if (avgPM25 > 35) {
          overall = 40
          rec = 'Acceptable but could affect sensitive groups.'
        }

        setRiskInfo({
          overall,
          aqiLabel: avgPM25 > 150 ? 'Unhealthy' : avgPM25 > 55 ? 'Moderate' : avgPM25 > 35 ? 'Sensitive' : 'Good',
          recommendation: rec
        })
      } catch (err) {
        console.error('Risk analysis error', err)
      } finally {
        setIsAnalyzing(false)
      }
    }

    // watch for view stationary and debounce analysis
    reactiveUtils.watch(
      () => mapView.stationary,
      (stationary) => {
        if (stationary) {
          if (analysisTimeout) window.clearTimeout(analysisTimeout)
          analysisTimeout = window.setTimeout(() => performRiskAnalysis(), 500)
        }
      }
    )

    // initial analysis after the view is ready
    mapView.when(() => {
      setTimeout(() => performRiskAnalysis(), 800)
    })

    // cleanup
    return () => {
      if (analysisTimeout) window.clearTimeout(analysisTimeout)
      mapView.destroy()
    }
  }, [apiKey]) // re-run only when API key changes

  // Toggle layers visibility
  useEffect(() => {
    if (!view || !view.map) return
    const riskL = view.map.findLayerById('risk') as GraphicsLayer | undefined
    if (riskL) riskL.visible = showRiskLayer
  }, [showRiskLayer, view])

  useEffect(() => {
    if (!view || !view.map) return
    const clinicsL = view.map.findLayerById('clinics') as GraphicsLayer | undefined
    if (clinicsL) clinicsL.visible = showClinics
  }, [showClinics, view])

  return (
    <div className="map-screen">
      <div className="map-controls">
        <h3>SafeNest — Health Risk Map</h3>

        <div className="control-panel">
          <label>
            <input type="checkbox" checked={showRiskLayer} onChange={(e) => setShowRiskLayer(e.target.checked)} />
            Unified Risk Visualization
          </label>
          <label>
            <input type="checkbox" checked={showClinics} onChange={(e) => setShowClinics(e.target.checked)} />
            Clinic locations
          </label>
        </div>

        <div className="risk-score-panel">
          <h4>Unified Risk</h4>
          {isAnalyzing && <div className="calculating">Analyzing air quality and clinic proximity...</div>}
          {riskInfo ? (
            <>
              <div className={`risk-badge risk-${riskInfo.aqiLabel.toLowerCase()}`}>
                {riskInfo.overall}/100 — {riskInfo.aqiLabel}
              </div>
              <div className="risk-details">
                <p><strong>Recommendation:</strong> {riskInfo.recommendation}</p>
              </div>
            </>
          ) : !isAnalyzing ? (
            <div className="risk-details">Move/zoom the map to calculate risk.</div>
          ) : null}
        </div>

        <div className="data-source">
          <p>Data: OpenAQ (Living Atlas), sample clinics</p>
        </div>
      </div>

      <div className="map-container" ref={mapDiv} />
    </div>
  )
}
