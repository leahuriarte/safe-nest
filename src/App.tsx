import React, { useState } from "react";
import { Tabs, Tab, Box } from "@mui/material";
import ClinicNavigatorScreen from "./screens/ClinicNavigatorScreen.tsx";
import MedicalInfoScreen from "./screens/MedicalInfoScreen.tsx";
import CommunityExperienceScreen from "./screens/CommunityExperienceScreen.tsx";
import ClinicEvaluatorScreen from "./screens/ClinicEvaluatorScreen.tsx";

const App: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ width: "100%" }}>
      <Tabs
        value={tab}
        onChange={(e, newVal) => setTab(newVal)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Map" />
        <Tab label="Clinic Navigator" />
        <Tab label="Medical Info" />
        <Tab label="Community Experience" />
        <Tab label="Clinic Evaluator" />
      </Tabs>

      <Box sx={{ padding: 2 }}>
        {tab === 1 && <ClinicNavigatorScreen />}
        {tab === 2 && <MedicalInfoScreen />}
        {tab === 3 && <CommunityExperienceScreen />}
        {tab === 4 && <ClinicEvaluatorScreen />}
      </Box>
    </Box>
  );
};

export default App;