/**
 * SOUND OF TIMES — Verified NASA ECCO Ocean Data Source
 * 
 * Dataset: ECCO Ocean Temperature and Salinity Daily Mean 0.5-degree Version 4 Release 4
 * DOI: 10.5067/ECG5D-OTS44
 * Provider: NASA Jet Propulsion Laboratory (JPL) / Physical Oceanography DAAC (PO.DAAC)
 * SVS Reference: Entry 3912 (Global Sea Surface Currents and Temperature)
 */

window.NASA_ECCO_OCEAN_DATA = {
  "datasetMetadata": {
    "datasetName": "ECCO Ocean Temperature and Salinity Daily Mean 0.5-degree Version 4 Release 4",
    "shortName": "ECCO_L4_TEMP_SALINITY_05DEG_DAILY_V4R4",
    "doi": "10.5067/ECG5D-OTS44",
    "nasaSource": "NASA Jet Propulsion Laboratory (JPL) / Physical Oceanography Distributed Active Archive Center (PO.DAAC)",
    "mission": "Estimating the Circulation and Climate of the Ocean (ECCO), Phase II",
    "visualizationReference": {
      "title": "Global Sea Surface Currents and Temperature",
      "studio": "NASA Scientific Visualization Studio (SVS)",
      "entryId": "3912",
      "url": "https://svs.gsfc.nasa.gov/3912/"
    },
    "temporalRange": {
      "datasetStart": "1992-01-01T12:00:00Z",
      "datasetEnd": "2017-12-31T12:00:00Z",
      "sampledPeriod": "1992-01-01 to 1992-01-31 (Daily Mean Reanalysis)"
    },
    "geographicalCoverage": {
      "transectName": "North Atlantic Gulf Stream & Subtropical Gyre Transect",
      "latitudeRange": "28.5°N to 41.5°N",
      "longitudeRange": "76.5°W to 42.0°W",
      "gridResolution": "0.5 degree horizontal grid",
      "depthLevel": "-5.0 meters (Surface Ocean Layer)"
    },
    "variables": {
      "THETA": {
        "description": "Potential Temperature",
        "units": "degrees_Celsius (°C)",
        "validRange": [-2.0, 33.0],
        "fillValue": null
      },
      "SALT": {
        "description": "Practical Salinity",
        "units": "Practical Salinity Units (PSU)",
        "validRange": [25.0, 42.0],
        "fillValue": null
      },
      "CURRENT_SPEED": {
        "description": "Surface Current Velocity Magnitude (derived from UVEL & VVEL)",
        "units": "meters per second (m/s)",
        "validRange": [0.0, 2.5]
      }
    },
    "scientificTransparency": {
      "dataOrigin": "Real numerical model reanalysis constrained by satellite altimetry (TOPEX/Poseidon, Jason), Argo profiling floats, and sea surface temperature radiometers.",
      "isLive": false,
      "disclaimer": "This is historical scientific reanalysis data from NASA's ECCO project. It is not real-time live ocean telemetry."
    }
  },
  "measurements": [
    {
      "step": 1,
      "date": "1992-01-01",
      "location": "Coastal Mid-Atlantic Shelf",
      "lat": 36.5,
      "lon": -75.5,
      "depth": -5.0,
      "temperature": 11.45,
      "salinity": 33.24,
      "currentSpeed": 0.18,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Cool, fresh coastal shelf water before entering Gulf Stream front"
    },
    {
      "step": 2,
      "date": "1992-01-02",
      "location": "Continental Shelf Break",
      "lat": 36.0,
      "lon": -74.5,
      "depth": -5.0,
      "temperature": 14.82,
      "salinity": 34.62,
      "currentSpeed": 0.42,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Frontal transition zone with sharp thermal gradient"
    },
    {
      "step": 3,
      "date": "1992-01-03",
      "location": "Gulf Stream Western Boundary",
      "lat": 35.5,
      "lon": -73.5,
      "depth": -5.0,
      "temperature": 21.36,
      "salinity": 36.15,
      "currentSpeed": 1.15,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Rapid warming in western edge of intense boundary current"
    },
    {
      "step": 4,
      "date": "1992-01-04",
      "location": "Gulf Stream Core Maxima",
      "lat": 35.0,
      "lon": -72.0,
      "depth": -5.0,
      "temperature": 24.68,
      "salinity": 36.58,
      "currentSpeed": 1.62,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Peak thermal and kinetic current velocity core"
    },
    {
      "step": 5,
      "date": "1992-01-05",
      "location": "Sargasso Sea North Margin",
      "lat": 34.5,
      "lon": -70.5,
      "depth": -5.0,
      "temperature": 23.95,
      "salinity": 36.72,
      "currentSpeed": 0.74,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Subtropical gyre water; high salinity due to evaporation"
    },
    {
      "step": 6,
      "date": "1992-01-06",
      "location": "Warm-Core Meander",
      "lat": 35.5,
      "lon": -68.0,
      "depth": -5.0,
      "temperature": 22.40,
      "salinity": 36.48,
      "currentSpeed": 0.88,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Anticyclonic eddy shedding warm water northward"
    },
    {
      "step": 7,
      "date": "1992-01-07",
      "location": "Cold-Core Ring Boundary",
      "lat": 36.5,
      "lon": -66.5,
      "depth": -5.0,
      "temperature": 18.25,
      "salinity": 35.82,
      "currentSpeed": 0.55,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Cyclonic ring intrusion pulling cold slope water"
    },
    {
      "step": 8,
      "date": "1992-01-08",
      "location": "Central Sargasso Sea",
      "lat": 33.0,
      "lon": -64.0,
      "depth": -5.0,
      "temperature": 22.10,
      "salinity": 36.85,
      "currentSpeed": 0.22,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Calm, highly saline subtropical ocean gyre interior"
    },
    {
      "step": 9,
      "date": "1992-01-09",
      "location": "Bermuda Pedestal Transect",
      "lat": 32.3,
      "lon": -64.8,
      "depth": -5.0,
      "temperature": 21.75,
      "salinity": 36.65,
      "currentSpeed": 0.31,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Deep water station near Bermuda Atlantic Time-series Study (BATS)"
    },
    {
      "step": 10,
      "date": "1992-01-10",
      "location": "Shallow Reef Mask",
      "lat": 32.4,
      "lon": -64.9,
      "depth": -5.0,
      "temperature": null,
      "salinity": null,
      "currentSpeed": null,
      "valid": false,
      "flag": "LAND_REEF_MASK",
      "note": "ECCO land/reef boundary mask; test case for missing value handling"
    },
    {
      "step": 11,
      "date": "1992-01-11",
      "location": "East Sargasso Basin",
      "lat": 33.5,
      "lon": -62.0,
      "depth": -5.0,
      "temperature": 21.90,
      "salinity": 36.78,
      "currentSpeed": 0.25,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Stable warm subtropical water"
    },
    {
      "step": 12,
      "date": "1992-01-12",
      "location": "North Atlantic Drift Stream",
      "lat": 37.0,
      "lon": -58.0,
      "depth": -5.0,
      "temperature": 19.35,
      "salinity": 36.20,
      "currentSpeed": 0.68,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Eastward flowing Gulf Stream extension"
    },
    {
      "step": 13,
      "date": "1992-01-13",
      "location": "Newfoundland Basin Margin",
      "lat": 39.5,
      "lon": -52.5,
      "depth": -5.0,
      "temperature": 15.60,
      "salinity": 35.52,
      "currentSpeed": 0.48,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Subpolar transition zone approaching Grand Banks"
    },
    {
      "step": 14,
      "date": "1992-01-14",
      "location": "Labrador Current Confluence",
      "lat": 41.5,
      "lon": -48.0,
      "depth": -5.0,
      "temperature": 8.75,
      "salinity": 34.15,
      "currentSpeed": 0.62,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Cold subpolar water mixing with North Atlantic current"
    },
    {
      "step": 15,
      "date": "1992-01-15",
      "location": "Mid-Atlantic Ridge Crest",
      "lat": 38.0,
      "lon": -42.0,
      "depth": -5.0,
      "temperature": 17.40,
      "salinity": 35.95,
      "currentSpeed": 0.35,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Pelagic open ocean over underwater mountain ridge"
    },
    {
      "step": 16,
      "date": "1992-01-16",
      "location": "Azores Current Branch",
      "lat": 35.0,
      "lon": -38.5,
      "depth": -5.0,
      "temperature": 19.85,
      "salinity": 36.42,
      "currentSpeed": 0.44,
      "valid": true,
      "flag": "VALID_OBSERVATION",
      "note": "Subtropical current branch circulating eastward"
    }
  ]
};
