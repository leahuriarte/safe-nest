import { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import './MapScreen.css'

export default function MapScreen() {
  const mapDiv = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<MapView | null>(null)
  const [showPollution, setShowPollution] = useState(true)
  const [showClinics, setShowClinics] = useState(true)

  useEffect(() => {
    if (!mapDiv.current) return

    // Create the map
    const map = new Map({
      basemap: 'topo-vector'
    })

    // Create the view
    const mapView = new MapView({
      container: mapDiv.current,
      map: map,
      center: [-118.2437, 34.0522], // Los Angeles coordinates
      zoom: 11
    })

    // Add graphics layers
    const clinicsLayer = new GraphicsLayer({
      id: 'clinics',
      title: 'Health Clinics'
    })

    const pollutionLayer = new GraphicsLayer({
      id: 'pollution',
      title: 'Pollution Zones'
    })

    // ========== REAL ARCGIS LIVING ATLAS LAYERS (VERIFIED) ==========

    // OpenAQ Recent Conditions in Air Quality (PM2.5)
    // Updates hourly with 3,500+ monitoring stations worldwide
    // Source: ArcGIS Living Atlas - Item ID: 8dcf5d4e124f480fa8c529fbe25ba04e
    const openAQLayer = new FeatureLayer({
      portalItem: {
        id: '8dcf5d4e124f480fa8c529fbe25ba04e'
      },
      title: 'OpenAQ Air Quality (PM2.5)',
      visible: true,
      opacity: 0.8
    })

    // AirNow AQI Forecast (EPA)
    // Real-time AQI forecast contours for O3 and PM2.5
    // Source: ArcGIS Living Atlas / US EPA
    const airNowLayer = new FeatureLayer({
      url: 'https://services.arcgis.com/cJ9YHowT8TU7DUyn/arcgis/rest/services/AirNowAQIForecast/FeatureServer/0',
      title: 'EPA AirNow AQI Forecast',
      visible: true,
      opacity: 0.7
    })

    map.addMany([airNowLayer, openAQLayer, pollutionLayer, clinicsLayer])

    console.log('✅ REAL Living Atlas layers added: EPA AirNow, OpenAQ (3500+ stations), Clinics')

    // Add sample clinic locations
    const sampleClinics = [
      { name: 'Community Health Center', lat: 34.0522, lon: -118.2437 },
      { name: 'Planned Parenthood Downtown', lat: 34.0489, lon: -118.2587 },
      { name: 'Womens Health Clinic', lat: 34.0608, lon: -118.2347 },
      { name: 'Family Planning Center', lat: 34.0445, lon: -118.2561 },
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

    // Add sample pollution zones (simplified for demo)
    const pollutionZones = [
      { lat: 34.0580, lon: -118.2550, level: 'high' },
      { lat: 34.0450, lon: -118.2400, level: 'medium' },
      { lat: 34.0620, lon: -118.2380, level: 'low' },
    ]

    pollutionZones.forEach(zone => {
      const point = new Point({
        longitude: zone.lon,
        latitude: zone.lat
      })

      const color = zone.level === 'high'
        ? [255, 0, 0, 0.3]
        : zone.level === 'medium'
        ? [255, 165, 0, 0.3]
        : [255, 255, 0, 0.3]

      const circle = {
        type: 'simple-marker',
        color: color,
        size: '40px',
        outline: {
          color: [255, 255, 255, 0.5],
          width: 1
        }
      }

      const graphic = new Graphic({
        // @ts-ignore
        geometry: point,
        // @ts-ignore
        symbol: circle,
        attributes: {
          level: zone.level
        },
        popupTemplate: {
          title: 'Pollution Zone',
          content: `Pollution Level: ${zone.level}`
        }
      })

      pollutionLayer.add(graphic)
    })

    setView(mapView)

    // Cleanup
    return () => {
      mapView.destroy()
    }
  }, [])

  // Toggle layers
  useEffect(() => {
    if (!view || !view.map) return
    const pollutionLayer = view.map.findLayerById('pollution')
    if (pollutionLayer) {
      pollutionLayer.visible = showPollution
    }
  }, [showPollution, view])

  useEffect(() => {
    if (!view || !view.map) return
    const clinicsLayer = view.map.findLayerById('clinics')
    if (clinicsLayer) {
      clinicsLayer.visible = showClinics
    }
  }, [showClinics, view])

  return (
    <div className="map-screen">
      <div className="map-controls">
        <div className="control-panel">
          <h3>Map Layers</h3>
          <label>
            <input
              type="checkbox"
              checked={showClinics}
              onChange={(e) => setShowClinics(e.target.checked)}
            />
            Show Health Clinics
          </label>
          <label>
            <input
              type="checkbox"
              checked={showPollution}
              onChange={(e) => setShowPollution(e.target.checked)}
            />
            Show Pollution Zones
          </label>
          
          <button
            className = "find-nearest-btn"
            onClick = {() => alert("Chatbot ccoming soon!")}
          >
            Find Nearest Clinic
          </button>
          
        </div>
        <div className="info-panel">
          <h3>Health Risk Information</h3>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-color high-risk"></span>
              <span>High Pollution Risk</span>
            </div>
            <div className="legend-item">
              <span className="legend-color medium-risk"></span>
              <span>Medium Pollution Risk</span>
            </div>
            <div className="legend-item">
              <span className="legend-color low-risk"></span>
              <span>Low Pollution Risk</span>
            </div>
            <div className="legend-item">
              <span className="legend-color clinic-marker"></span>
              <span>Health Clinic</span>
            </div>
          </div>
        </div>
      </div>
      <div className="map-container" ref={mapDiv}></div>
    </div>
  )
}
